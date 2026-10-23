import { Alert, Linking, Platform } from 'react-native';
import { useProgress } from './progress';

const REMINDER_ID = 'dailyword-daily-reminder';
const CHANNEL_ID = 'daily-reminder';

type NotificationsModule = typeof import('expo-notifications');

let notificationModule: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
  if (Platform.OS === 'web') return null;
  if (notificationModule) return notificationModule;

  try {
    notificationModule = require('expo-notifications') as NotificationsModule;
    return notificationModule;
  } catch {
    return null;
  }
}

export const formatTime = (hour: number, minute: number) => {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 === 0 ? 12 : hour % 12}:${`${minute}`.padStart(2, '0')} ${suffix}`;
};

/** Show notifications even while the app is open. Call once at startup. */
export function configureNotifications() {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

async function ensureChannel() {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Daily reminder', importance: Notifications.AndroidImportance.DEFAULT });
}

export type PermissionResult = 'granted' | 'denied' | 'blocked' | 'unsupported';

/**
 * Ask the system for notification permission, showing the Allow / Don't allow dialog.
 * On Android 13+ the dialog only appears if a notification channel already exists, so the channel is created first.
 */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') return 'unsupported';
  const Notifications = getNotifications();
  if (!Notifications) return 'unsupported';

  try {
    await ensureChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (permission.granted) return 'granted';
    if (!permission.canAskAgain) return 'blocked';
    permission = await Notifications.requestPermissionsAsync();
    if (permission.granted) return 'granted';
    return permission.canAskAgain ? 'denied' : 'blocked';
  } catch {
    return 'unsupported';
  }
}

async function schedule(hour: number, minute: number) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'DailyWord', body: 'Take a quiet moment with the Word today.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}

export async function cancelDailyReminder() {
  if (Platform.OS === 'web') return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  try { await Notifications.cancelScheduledNotificationAsync(REMINDER_ID); } catch { /* nothing scheduled */ }
}

/** Ask permission if needed, then schedule the daily reminder. Shows an explanation if it cannot be turned on. */
export async function turnOnReminder(hour?: number, minute?: number): Promise<boolean> {
  const saved = useProgress.getState().reminder;
  const at = { hour: hour ?? saved.hour, minute: minute ?? saved.minute };
  const permission = await requestNotificationPermission();
  if (permission === 'granted') {
    try {
      await schedule(at.hour, at.minute);
      useProgress.getState().setReminder({ ...at, enabled: true });
      return true;
    } catch {
      Alert.alert('Reminder not set', 'Something went wrong while scheduling the reminder. Please try again.');
      return false;
    }
  }
  if (permission === 'unsupported') Alert.alert('Reminders unavailable', Platform.OS === 'web' ? 'Daily reminders work in the Android and iOS apps.' : 'This device could not set up notifications.');
  else if (permission === 'blocked') Alert.alert('Notifications are turned off', 'To get a daily reminder, allow notifications for DailyWord in your device settings.', [{ text: 'Not now', style: 'cancel' }, { text: 'Open settings', onPress: () => void Linking.openSettings() }]);
  else Alert.alert('Reminder not set', 'DailyWord needs permission to send notifications. You can try again whenever you are ready.');
  return false;
}

export async function turnOffReminder() {
  await cancelDailyReminder();
  useProgress.getState().setReminder({ enabled: false });
}

/** Change the reminder time, rescheduling if the reminder is on. */
export async function changeReminderTime(hour: number, minute: number) {
  if (useProgress.getState().reminder.enabled) return turnOnReminder(hour, minute);
  useProgress.getState().setReminder({ hour, minute });
  return true;
}

/** Send a notification a couple of seconds from now so the user can confirm reminders work on this device. */
export async function sendTestNotification(): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    Alert.alert('Notifications are not allowed', 'Allow notifications for DailyWord in your device settings, then try again.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Open settings', onPress: () => void Linking.openSettings() }]);
    return false;
  }
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'DailyWord', body: 'Reminders are working. This is how your daily reminder will look.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: CHANNEL_ID },
    });
    return true;
  } catch { return false; }
}

/** At startup: keep the schedule in step with the saved setting (the system may have cleared it, or permission may have been revoked). */
export async function syncReminderOnLaunch() {
  if (Platform.OS === 'web') return;
  const { enabled, hour, minute } = useProgress.getState().reminder;
  if (!enabled) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await ensureChannel();
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) { useProgress.getState().setReminder({ enabled: false }); return; }
    await schedule(hour, minute);
  } catch { /* try again next launch */ }
}
