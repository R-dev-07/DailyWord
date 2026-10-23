import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bibleBooks, bookById, testaments, type BibleBook } from './bible';
import { usePalette } from './theme';

/** One simple sheet for choosing where to read: testament, then book, then chapter. */
export function PassageNavigator({ visible, bookId, chapter, onClose, onPick }: { visible: boolean; bookId: number; chapter: number; onClose: () => void; onPick: (bookId: number, chapter: number) => void }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const current = bookById(bookId);
  const [testament, setTestament] = useState<BibleBook['testament']>(current.testament);
  const [book, setBook] = useState<BibleBook | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { if (visible) { setBook(null); setSearch(''); setTestament(bookById(bookId).testament); } }, [visible, bookId]);

  const books = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bibleBooks.filter((entry) => (term ? entry.name.toLowerCase().includes(term) : entry.testament === testament));
  }, [search, testament]);

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={() => (book ? setBook(null) : onClose())} statusBarTranslucent navigationBarTranslucent>
    <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
    <View style={[styles.sheet, { backgroundColor: palette.background, borderColor: palette.border, paddingBottom: insets.bottom + 12 }]}>
      <View style={[styles.grab, { backgroundColor: palette.border }]} />
      <View style={styles.head}>
        {book ? <TouchableOpacity onPress={() => setBook(null)} style={styles.headButton} accessibilityLabel="Back to books"><Ionicons name="chevron-back" size={22} color={palette.text} /></TouchableOpacity> : <View style={styles.headButton} />}
        <Text style={[styles.title, { color: palette.text }]}>{book ? book.name : 'Choose a passage'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.headButton} accessibilityLabel="Close"><Ionicons name="close" size={22} color={palette.text} /></TouchableOpacity>
      </View>

      {book ? <>
        <Text style={[styles.hint, { color: palette.mutedText }]}>Pick a chapter · {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}</Text>
        <FlatList key="chapters" data={Array.from({ length: book.chapters }, (_, index) => index + 1)} keyExtractor={(item) => `${item}`} numColumns={5} contentContainerStyle={styles.grid}
          renderItem={({ item }) => { const active = book.id === bookId && item === chapter; return <TouchableOpacity onPress={() => onPick(book.id, item)} style={[styles.cell, { backgroundColor: active ? palette.accent : palette.surface, borderColor: active ? palette.accent : palette.border }]}><Text style={[styles.cellText, { color: active ? palette.background : palette.text }]}>{item}</Text></TouchableOpacity>; }} />
      </> : <>
        <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="search" size={16} color={palette.mutedText} /><TextInput value={search} onChangeText={setSearch} placeholder="Find a book" placeholderTextColor={palette.mutedText} style={[styles.input, { color: palette.text }]} autoCorrect={false} /></View>
        {!search && <View style={[styles.segment, { backgroundColor: palette.surface, borderColor: palette.border }]}>{testaments.map((name) => <TouchableOpacity key={name} onPress={() => setTestament(name)} style={[styles.segmentItem, testament === name && { backgroundColor: palette.accent }]}><Text style={[styles.segmentText, { color: testament === name ? palette.background : palette.mutedText }]}>{name}</Text></TouchableOpacity>)}</View>}
        <FlatList key="books" data={books} keyExtractor={(item) => `${item.id}`} numColumns={2} contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <TouchableOpacity onPress={() => (item.chapters === 1 ? onPick(item.id, 1) : setBook(item))} style={[styles.book, { backgroundColor: palette.surface, borderColor: item.id === bookId ? palette.accent : palette.border }]}><Text style={[styles.bookName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text><Text style={[styles.bookMeta, { color: palette.mutedText }]}>{item.chapters}</Text></TouchableOpacity>}
          ListEmptyComponent={<Text style={[styles.hint, { color: palette.mutedText, textAlign: 'center', marginTop: 24 }]}>No book matches “{search}”.</Text>} />
      </>}
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000a' },
  sheet: { height: '78%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 16 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: 9 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }, headButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 11, marginBottom: 8, marginTop: 2 },
  search: { height: 44, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, marginBottom: 10 }, input: { flex: 1, fontSize: 13 },
  segment: { flexDirection: 'row', borderRadius: 13, borderWidth: 1, padding: 3, marginBottom: 10 }, segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 }, segmentText: { fontSize: 12, fontWeight: '700' },
  grid: { gap: 8, paddingBottom: 20 }, book: { flex: 1, margin: 3, borderRadius: 13, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, bookName: { flex: 1, fontSize: 13, fontWeight: '600' }, bookMeta: { fontSize: 10 },
  cell: { flex: 1, margin: 4, aspectRatio: 1, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', maxWidth: '18.5%' }, cellText: { fontSize: 14, fontWeight: '700' },
});
