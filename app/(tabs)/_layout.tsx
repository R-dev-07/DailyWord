import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from '@/src/theme';
import { stopAllChapterSpeech } from '@/src/useChapterSpeech';

const icons = {
  index: ['home', 'home-outline'],
  bible: ['book', 'book-outline'],
  study: ['school', 'school-outline'],
  habits: ['flame', 'flame-outline'],
  more: ['grid', 'grid-outline'],
} as const;

export default function TabLayout() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      // Switching to a different tab silences read-aloud, so audio never plays from a screen you can no longer see.
      screenListeners={({ navigation, route }) => ({
        tabPress: () => { const state = navigation.getState(); if (state.routes[state.index]?.name !== route.name) void stopAllChapterSpeech(); },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.mutedText,
        tabBarStyle: { backgroundColor: palette.tabBar, borderTopColor: palette.border, height: 66 + insets.bottom, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const pair = icons[route.name as keyof typeof icons] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={pair[focused ? 0 : 1] as never} size={size} color={color} />;
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="bible" options={{ title: 'Bible' }} />
      <Tabs.Screen name="study" options={{ title: 'Study' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
