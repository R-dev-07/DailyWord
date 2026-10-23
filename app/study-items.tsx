import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { bookById, bookLabel } from '@/src/bible';
import { deleteStudyItem, getStudyItems } from '@/src/database';
import { useSettings } from '@/src/store';
import { usePalette } from '@/src/theme';
import { EmptyState, PageHeader, PrimaryButton, withAlpha } from '@/src/ui';

type Item = { id: number; book_id: number; chapter: number; verse: number; body: string; color?: string };
type Kind = 'Bookmarks' | 'Notes' | 'Highlights';
const EMPTY: Record<Kind, { icon: 'bookmark-outline' | 'create-outline' | 'color-wand-outline'; title: string; body: string }> = {
  Bookmarks: { icon: 'bookmark-outline', title: 'No bookmarks yet', body: 'Tap a verse while reading and choose Save. Your saved verses will appear here.' },
  Notes: { icon: 'create-outline', title: 'No notes yet', body: 'Tap a verse while reading and choose Note to write a thought or reflection.' },
  Highlights: { icon: 'color-wand-outline', title: 'No highlights yet', body: 'Tap a verse while reading and choose Highlight to mark it in a colour.' },
};

export default function StudyItemsScreen() {
  const palette = usePalette();
  const { kind = 'Bookmarks' } = useLocalSearchParams<{ kind?: Kind }>();
  const translation = useSettings((state) => state.selectedTranslation);
  const [items, setItems] = useState<Item[] | null>(null);
  const load = useCallback(() => getStudyItems(kind, translation).then((rows) => setItems(rows as Item[])).catch(() => setItems([])), [kind, translation]);
  useEffect(() => { void load(); }, [load]);

  const remove = (item: Item) => Alert.alert(`Delete this ${kind === 'Bookmarks' ? 'bookmark' : kind === 'Notes' ? 'note' : 'highlight'}?`, `${bookLabel(item.book_id)} ${item.chapter}:${item.verse}`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteStudyItem(kind, item.id); await load(); } catch { Alert.alert('Could not delete', 'Please try again.'); } } },
  ]);

  const empty = EMPTY[kind];
  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <PageHeader title={kind} subtitle={items ? `${items.length} saved` : undefined} />
    <ScrollView contentContainerStyle={styles.content}>
      {items === null ? null : items.length === 0 ? <EmptyState icon={empty.icon} title={empty.title} body={empty.body} action={<PrimaryButton label="Open the Bible" icon="book-outline" onPress={() => router.push('/(tabs)/bible')} style={{ marginTop: 20 }} />} />
        : items.map((item) => <TouchableOpacity key={item.id} activeOpacity={0.85} onPress={() => router.push({ pathname: '/reader', params: { bookId: item.book_id, bookName: bookById(item.book_id).name, chapter: item.chapter, verse: item.verse } })} style={[styles.item, { backgroundColor: item.color ? withAlpha(item.color, 0.16) : palette.surface, borderColor: item.color ?? palette.border }]}>
          <View style={styles.top}><Text style={[styles.reference, { color: palette.accent }]}>{bookLabel(item.book_id)} {item.chapter}:{item.verse}</Text><TouchableOpacity onPress={() => remove(item)} hitSlop={10} accessibilityLabel="Delete"><Ionicons name="trash-outline" size={17} color={palette.mutedText} /></TouchableOpacity></View>
          {item.body ? <Text style={[styles.body, { color: palette.text }]} numberOfLines={4}>{item.body}</Text> : null}
        </TouchableOpacity>)}
    </ScrollView></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 40 }, item: { padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 10 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontWeight: '700', fontSize: 12 }, body: { fontFamily: 'Georgia', fontSize: 15, lineHeight: 22, marginTop: 8 },
});
