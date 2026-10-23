import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { bookById, bookLabel, type Passage } from './bible';
import { removeHighlight, saveBookmark, saveHighlight } from './database';
import { useProgress } from './progress';
import { usePalette } from './theme';
import { translationBadge } from './versions';
import { withAlpha } from './ui';

export const HIGHLIGHT_COLORS = ['#e7b65e', '#6fcf97', '#5aaee6', '#e98fb4'] as const;

/** What you can do with the verse you tapped: save, note, highlight, copy, share, memorise. */
export function VerseActions({ passage, text, translationId, color, onColor, onClose }: { passage: Passage; text: string; translationId: string; color?: string; onColor: (color: string | null) => void; onClose: () => void }) {
  const palette = usePalette();
  const addMemory = useProgress((state) => state.addMemory);
  const [flash, setFlash] = useState('');
  const [picking, setPicking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setPicking(false); setFlash(''); }, [passage.bookId, passage.chapter, passage.verse]);

  const reference = `${bookLabel(passage.bookId)} ${passage.chapter}:${passage.verse}`;
  const quote = `“${text}” — ${reference} (${translationBadge(translationId)})`;
  const say = (message: string) => { setFlash(message); clearTimeout(timer.current); timer.current = setTimeout(() => setFlash(''), 1800); };
  const guard = async (work: () => Promise<void>) => { try { await work(); } catch { Alert.alert('Something went wrong', 'Please try again.'); } };

  const items: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }> = [
    { icon: 'bookmark-outline', label: 'Save', onPress: () => guard(async () => { await saveBookmark(passage.bookId, passage.chapter, passage.verse); say('Saved to Bookmarks'); }) },
    { icon: 'create-outline', label: 'Note', onPress: () => router.push({ pathname: '/note', params: { bookId: passage.bookId, bookName: bookById(passage.bookId).name, chapter: passage.chapter, verse: passage.verse } }) },
    { icon: 'color-wand-outline', label: 'Highlight', onPress: () => setPicking((value) => !value) },
    { icon: 'copy-outline', label: 'Copy', onPress: () => guard(async () => { await Clipboard.setStringAsync(quote); say('Copied'); }) },
    { icon: 'share-social-outline', label: 'Share', onPress: () => guard(async () => { await Share.share({ message: quote }); }) },
    { icon: 'albums-outline', label: 'Memorize', onPress: () => say(addMemory(passage) ? 'Added to Memorize' : 'Already in Memorize') },
  ];

  return <View style={[styles.bar, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
    <View style={styles.top}>
      <Text style={[styles.ref, { color: palette.accent }]}>{reference}</Text>
      <Text style={[styles.flash, { color: palette.mutedText }]} numberOfLines={1}>{flash}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close verse options"><Ionicons name="close" size={18} color={palette.mutedText} /></TouchableOpacity>
    </View>
    {picking ? <View style={styles.colors}>
      {HIGHLIGHT_COLORS.map((swatch) => <TouchableOpacity key={swatch} onPress={() => guard(async () => { await saveHighlight(passage.bookId, passage.chapter, passage.verse, swatch); onColor(swatch); setPicking(false); say('Highlighted'); })} style={[styles.swatch, { backgroundColor: withAlpha(swatch, 0.9), borderColor: color === swatch ? palette.text : 'transparent' }]} accessibilityLabel={`Highlight ${swatch}`} />)}
      {color ? <TouchableOpacity onPress={() => guard(async () => { await removeHighlight(passage.bookId, passage.chapter, passage.verse); onColor(null); setPicking(false); })} style={[styles.clear, { borderColor: palette.border }]}><Text style={[styles.clearText, { color: palette.text }]}>Remove</Text></TouchableOpacity> : null}
    </View> : <View style={styles.row}>
      {items.map((item) => <TouchableOpacity key={item.label} onPress={item.onPress} style={styles.action} accessibilityLabel={item.label}><Ionicons name={item.icon} size={20} color={palette.text} /><Text style={[styles.label, { color: palette.mutedText }]}>{item.label}</Text></TouchableOpacity>)}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  bar: { marginHorizontal: 14, marginBottom: 8, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 }, ref: { fontSize: 12, fontWeight: '700' }, flash: { flex: 1, fontSize: 11, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, action: { flex: 1, alignItems: 'center', paddingVertical: 7, gap: 4 }, label: { fontSize: 9, fontWeight: '600' },
  colors: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4 }, swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 }, clear: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 }, clearText: { fontSize: 11, fontWeight: '600' },
});
