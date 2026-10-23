import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { getChapterVerses } from '@/src/database';
import { cleanForSpeech, formatSpeed, loadVoices, pickVoice, speechLanguage, voicesForLanguage } from '@/src/speech';
import { useSettings } from '@/src/store';
import { usePalette } from '@/src/theme';
import { PageHeader } from '@/src/ui';
import { stopAllChapterSpeech } from '@/src/useChapterSpeech';
import { translationName, versionForTranslation } from '@/src/versions';

export default function ReadAloudScreen() {
  const palette = usePalette();
  const translation = useSettings((state) => state.selectedTranslation);
  const rate = useSettings((state) => state.speechRate);
  const pitch = useSettings((state) => state.speechPitch);
  const voices = useSettings((state) => state.speechVoices);
  const autoContinue = useSettings((state) => state.speechAutoContinue);
  const verseNumbers = useSettings((state) => state.speechVerseNumbers);
  const announce = useSettings((state) => state.speechAnnounceChapter);
  const setSpeech = useSettings((state) => state.setSpeech);
  const setSpeechVoice = useSettings((state) => state.setSpeechVoice);

  const language = speechLanguage(translation);
  const languageName = versionForTranslation(translation)?.language ?? language.toUpperCase();
  const [available, setAvailable] = useState<Speech.Voice[] | null>(null);
  const [testing, setTesting] = useState(false);
  const testRun = useRef(0);

  useEffect(() => {
    let active = true;
    loadVoices().then((all) => { if (active) setAvailable(voicesForLanguage(all, language)); });
    return () => { active = false; };
  }, [language]);

  useEffect(() => () => { testRun.current += 1; void Speech.stop(); }, []);

  const stopTest = useCallback(() => { testRun.current += 1; setTesting(false); void Speech.stop(); }, []);
  const playTest = async () => {
    if (testing) { stopTest(); return; }
    const run = ++testRun.current;
    setTesting(true);
    await stopAllChapterSpeech().catch(() => undefined);
    try {
      const sample = (await getChapterVerses(1, 1, translation))[0]?.text ?? 'In the beginning God created the heaven and the earth.';
      const voice = await pickVoice(language, voices[language]);
      if (testRun.current !== run) return;
      Speech.speak(cleanForSpeech(sample), { language, voice, rate, pitch, onDone: () => { if (testRun.current === run) setTesting(false); }, onStopped: () => { if (testRun.current === run) setTesting(false); }, onError: () => { if (testRun.current === run) { setTesting(false); Alert.alert('Read aloud unavailable', 'This device could not speak with the current settings. Check that a text-to-speech voice for this language is installed.'); } } });
    } catch { setTesting(false); }
  };
  const openDeviceVoiceSettings = async () => {
    try { if (Platform.OS === 'android') await Linking.sendIntent('com.android.settings.TTS_SETTINGS'); else await Linking.openSettings(); }
    catch { Alert.alert('Unable to open settings', 'Open your device settings and look for Text-to-speech (Android) or Spoken Content (iOS).'); }
  };

  const savedVoice = voices[language];
  const row = (title: string, sub: string, value: boolean, onChange: (next: boolean) => void) => <View style={[styles.switchRow, { borderBottomColor: palette.border }]}><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text><Text style={[styles.rowSub, { color: palette.mutedText }]}>{sub}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: palette.border, true: palette.accent }} thumbColor="#fffaf0" accessibilityLabel={title} /></View>;

  return <View style={[styles.safe, { backgroundColor: palette.background }]}><PageHeader title="Read aloud" close />
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={playTest} style={[styles.test, { backgroundColor: palette.accent }]} accessibilityLabel={testing ? 'Stop preview' : 'Preview this voice'}><Ionicons name={testing ? 'stop' : 'volume-high'} size={18} color={palette.background} /><Text style={[styles.testText, { color: palette.background }]}>{testing ? 'Stop preview' : 'Preview voice'}</Text></TouchableOpacity>

      <View style={styles.labelRow}><Text style={[styles.label, { color: palette.mutedText }]}>SPEED</Text><Text style={[styles.value, { color: palette.accent }]}>{formatSpeed(rate)}</Text></View>
      <View style={styles.slider}><Ionicons name="walk-outline" size={18} color={palette.text} /><Slider style={{ flex: 1 }} minimumValue={0.5} maximumValue={1.5} step={0.05} value={rate} minimumTrackTintColor={palette.accent} maximumTrackTintColor={palette.border} thumbTintColor={palette.accent} onSlidingComplete={(next) => setSpeech({ speechRate: Number(next.toFixed(2)) })} accessibilityLabel="Speaking speed" /><Ionicons name="flash-outline" size={18} color={palette.text} /></View>

      <View style={styles.labelRow}><Text style={[styles.label, { color: palette.mutedText }]}>PITCH</Text><Text style={[styles.value, { color: palette.accent }]}>{pitch.toFixed(2)}</Text></View>
      <View style={styles.slider}><Ionicons name="remove" size={18} color={palette.text} /><Slider style={{ flex: 1 }} minimumValue={0.8} maximumValue={1.2} step={0.05} value={pitch} minimumTrackTintColor={palette.accent} maximumTrackTintColor={palette.border} thumbTintColor={palette.accent} onSlidingComplete={(next) => setSpeech({ speechPitch: Number(next.toFixed(2)) })} accessibilityLabel="Voice pitch" /><Ionicons name="add" size={18} color={palette.text} /></View>

      <Text style={[styles.label, { color: palette.mutedText, marginTop: 22 }]}>VOICE · {languageName.toUpperCase()}</Text>
      <Text style={[styles.hint, { color: palette.mutedText }]}>Voices come from your device and match the language of {translationName(translation)}.</Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TouchableOpacity style={[styles.voiceRow, { borderBottomColor: palette.border }]} onPress={() => setSpeechVoice(language, null)}><Text style={[styles.rowTitle, { color: palette.text, flex: 1 }]}>Automatic (device default)</Text>{!savedVoice && <Ionicons name="checkmark-circle" size={18} color={palette.accent} />}</TouchableOpacity>
        {available === null && <Text style={[styles.hint, { color: palette.mutedText, margin: 12 }]}>Looking for voices…</Text>}
        {available?.map((voice) => <TouchableOpacity key={voice.identifier} style={[styles.voiceRow, { borderBottomColor: palette.border }]} onPress={() => setSpeechVoice(language, voice.identifier)}><View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>{voice.name}</Text><Text style={[styles.rowSub, { color: palette.mutedText }]}>{voice.language}{voice.quality === Speech.VoiceQuality.Enhanced ? ' · Enhanced' : ''}</Text></View>{savedVoice === voice.identifier && <Ionicons name="checkmark-circle" size={18} color={palette.accent} />}</TouchableOpacity>)}
        {available && available.length === 0 && <Text style={[styles.hint, { color: palette.mutedText, margin: 12 }]}>No {languageName} voice was found on this device. Install one in your device’s text-to-speech settings, then come back.</Text>}
      </View>
      <TouchableOpacity onPress={openDeviceVoiceSettings} style={styles.linkRow}><Ionicons name="settings-outline" size={16} color={palette.accent} /><Text style={[styles.link, { color: palette.accent }]}>Device voice settings</Text></TouchableOpacity>

      <Text style={[styles.label, { color: palette.mutedText, marginTop: 22 }]}>PLAYBACK</Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        {row('Continue to next chapter', 'Keep reading when a chapter ends', autoContinue, (next) => setSpeech({ speechAutoContinue: next }))}
        {row('Announce the chapter', 'Say “Genesis, chapter 1” first (English versions)', announce, (next) => setSpeech({ speechAnnounceChapter: next }))}
        {row('Say verse numbers', 'Read the number before each verse', verseNumbers, (next) => setSpeech({ speechVerseNumbers: next }))}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { paddingHorizontal: 17, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, back: { width: 40, height: 40, justifyContent: 'center' }, title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 }, test: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 }, testText: { fontSize: 13, fontWeight: '700' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }, label: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }, value: { fontSize: 11, fontWeight: '700' }, slider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  hint: { fontSize: 11, lineHeight: 16, marginTop: 6 }, card: { marginTop: 12, borderRadius: 15, borderWidth: 1, overflow: 'hidden' }, voiceRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  switchRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth }, rowTitle: { fontSize: 13, fontWeight: '600' }, rowSub: { fontSize: 10, marginTop: 3 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }, link: { fontSize: 12, fontWeight: '600' },
});
