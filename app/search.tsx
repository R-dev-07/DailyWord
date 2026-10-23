import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { bookById, bookLabel, readerParams } from '@/src/bible';
import { parseReference } from '@/src/reference';
import { searchVerses } from '@/src/database';
import { useSettings } from '@/src/store';
import { usePalette } from '@/src/theme';
import { EmptyState, PageHeader } from '@/src/ui';
import { translationName } from '@/src/versions';

type Result = { book_id: number; chapter: number; verse: number; text: string };

export default function SearchScreen() {
  const palette = usePalette();
  const translation = useSettings((state) => state.selectedTranslation);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const reference = useMemo(() => parseReference(query), [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) { setResults([]); setSearched(false); return; }
      setSearched(true);
      searchVerses(query, translation).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, translation]);

  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <PageHeader title="Search" subtitle={translationName(translation)} />
    <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="search" size={18} color={palette.mutedText} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search words, or type John 3:16" placeholderTextColor={palette.mutedText} style={[styles.input, { color: palette.text }]} returnKeyType="search" autoCorrect={false} />{query ? <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear"><Ionicons name="close-circle" size={18} color={palette.mutedText} /></TouchableOpacity> : null}</View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {reference && <TouchableOpacity onPress={() => router.push({ pathname: '/reader', params: readerParams(reference) })} style={[styles.go, { backgroundColor: palette.accent }]}><Ionicons name="arrow-forward-circle" size={22} color={palette.background} /><Text style={[styles.goText, { color: palette.background }]}>Go to {bookLabel(reference.bookId)} {reference.chapter}{reference.verse > 1 ? `:${reference.verse}` : ''}</Text></TouchableOpacity>}
      {results.map((item) => <TouchableOpacity key={`${item.book_id}:${item.chapter}:${item.verse}`} onPress={() => router.push({ pathname: '/reader', params: { bookId: item.book_id, bookName: bookById(item.book_id).name, chapter: item.chapter, verse: item.verse } })} style={[styles.result, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.ref, { color: palette.accent }]}>{bookLabel(item.book_id)} {item.chapter}:{item.verse}</Text><Text style={[styles.verse, { color: palette.text }]}>{item.text}</Text></TouchableOpacity>)}
      {!query.trim() && <EmptyState icon="search-outline" title="Find a verse" body="Search for a word or phrase, or jump straight to a passage by typing its reference, like Psalm 23 or Romans 8:28." />}
      {searched && results.length === 0 && !reference && <EmptyState icon="alert-circle-outline" title="No matches" body={`Nothing found for “${query.trim()}” in ${translationName(translation)}. Try a different word.`} />}
    </ScrollView></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, search: { marginHorizontal: 16, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, height: 49, paddingHorizontal: 14 }, input: { flex: 1, fontSize: 13 }, content: { padding: 16, paddingBottom: 40 },
  go: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 15, marginBottom: 12 }, goText: { fontSize: 14, fontWeight: '700' },
  result: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 9 }, ref: { fontSize: 11, fontWeight: '700' }, verse: { fontFamily: 'Georgia', fontSize: 14, lineHeight: 21, marginTop: 6 },
});
