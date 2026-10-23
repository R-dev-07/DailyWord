import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatSpeed } from './speech';
import { useSettings } from './store';
import { usePalette } from './theme';
import type { useChapterSpeech } from './useChapterSpeech';

/** Compact transport controls shown while a chapter is being read aloud (or paused). */
export function SpeechPlayer({ speech, title }: { speech: ReturnType<typeof useChapterSpeech>; title: string }) {
  const palette = usePalette();
  const rate = useSettings((state) => state.speechRate);
  if (speech.status === 'idle') return null;
  const playing = speech.status === 'playing';
  return <View style={[styles.player, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
    <TouchableOpacity onPress={() => speech.skip(-1)} style={styles.button} accessibilityLabel="Previous verse"><Ionicons name="play-skip-back" size={20} color={palette.text} /></TouchableOpacity>
    <TouchableOpacity onPress={() => speech.toggle()} style={[styles.main, { backgroundColor: palette.accent }]} accessibilityLabel={playing ? 'Pause' : 'Resume'}><Ionicons name={playing ? 'pause' : 'play'} size={20} color={palette.background} /></TouchableOpacity>
    <TouchableOpacity onPress={() => speech.skip(1)} style={styles.button} accessibilityLabel="Next verse"><Ionicons name="play-skip-forward" size={20} color={palette.text} /></TouchableOpacity>
    <TouchableOpacity style={styles.info} onPress={() => router.push('/read-aloud')} accessibilityLabel="Read aloud settings">
      <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>{title}{speech.currentVerse ? `:${speech.currentVerse}` : ''}</Text>
      <Text style={[styles.sub, { color: palette.mutedText }]} numberOfLines={1}>{playing ? 'Reading aloud · settings' : 'Paused · settings'}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={speech.cycleSpeed} style={[styles.chip, { borderColor: palette.border }]} accessibilityLabel={`Speaking speed ${formatSpeed(rate)}. Tap to change`}><Text style={[styles.chipText, { color: palette.accent }]}>{formatSpeed(rate)}</Text></TouchableOpacity>
    <TouchableOpacity onPress={speech.stop} style={styles.button} accessibilityLabel="Stop reading aloud"><Ionicons name="stop" size={19} color={palette.text} /></TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  player: { marginHorizontal: 14, marginBottom: 8, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1 },
  button: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  main: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
  info: { flex: 1, paddingLeft: 6, paddingRight: 4 },
  title: { fontSize: 12, fontWeight: '700' },
  sub: { fontSize: 9, marginTop: 2 },
  chip: { borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '700' },
});
