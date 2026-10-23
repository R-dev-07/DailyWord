import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { readerParams, type Passage } from '@/src/bible';
import { memoryId, useProgress } from '@/src/progress';
import { useSettings } from '@/src/store';
import { topicById } from '@/src/studyContent';
import { usePalette } from '@/src/theme';
import { EmptyState, PageHeader } from '@/src/ui';
import { passageLabel } from '@/src/verseOfTheDay';
import { getVerse } from '@/src/verses';
import { translationBadge } from '@/src/versions';

type Loaded = { passage: Passage; text: string; translationId: string };

export default function TopicScreen() {
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const topic = topicById(id ?? '');
  const translation = useSettings((state) => state.selectedTranslation);
  const memory = useProgress((state) => state.memory);
  const addMemory = useProgress((state) => state.addMemory);
  const [verses, setVerses] = useState<Loaded[] | null>(null);

  useEffect(() => {
    let active = true;
    setVerses(null);
    if (!topic) return;
    Promise.all(topic.refs.map(async (passage) => { const found = await getVerse(passage.bookId, passage.chapter, passage.verse, translation); return found ? { passage, ...found } : null; }))
      .then((rows) => { if (active) setVerses(rows.filter((row): row is Loaded => !!row)); })
      .catch(() => { if (active) setVerses([]); });
    return () => { active = false; };
  }, [topic, translation]);

  if (!topic) return <View style={[styles.root, { backgroundColor: palette.background }]}><PageHeader title="Topic" /><EmptyState icon="help-circle-outline" title="Topic not found" body="Go back and choose a topic from the list." /></View>;

  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <PageHeader title={topic.title} subtitle={topic.blurb} />
    <ScrollView contentContainerStyle={styles.content}>
      {verses === null ? <Text style={[styles.loading, { color: palette.mutedText }]}>Loading verses…</Text>
        : verses.length === 0 ? <EmptyState icon="book-outline" title="No verses available" body="The verse text for this topic could not be loaded. Try switching to the KJV in Bible versions." />
        : verses.map(({ passage, text, translationId }) => {
          const saved = !!memory[memoryId(passage)];
          return <View key={passageLabel(passage)} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.ref, { color: palette.accent }]}>{passageLabel(passage)} · {translationBadge(translationId)}</Text>
            <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/reader', params: readerParams(passage) })} style={styles.action}><Ionicons name="book-outline" size={16} color={palette.mutedText} /><Text style={[styles.actionText, { color: palette.mutedText }]}>Read in context</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => addMemory(passage)} disabled={saved} style={styles.action}><Ionicons name={saved ? 'checkmark-circle' : 'albums-outline'} size={16} color={saved ? palette.accent : palette.mutedText} /><Text style={[styles.actionText, { color: saved ? palette.accent : palette.mutedText }]}>{saved ? 'In Memorize' : 'Memorize'}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => Share.share({ message: `“${text}” — ${passageLabel(passage)} (${translationBadge(translationId)})` })} style={styles.action} accessibilityLabel="Share verse"><Ionicons name="share-social-outline" size={16} color={palette.mutedText} /></TouchableOpacity>
            </View>
          </View>;
        })}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 40 }, loading: { textAlign: 'center', marginTop: 40, fontSize: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 15, marginBottom: 11 }, ref: { fontSize: 11, fontWeight: '700' }, text: { fontFamily: 'Georgia', fontSize: 16, lineHeight: 25, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 18, marginTop: 13 }, action: { flexDirection: 'row', alignItems: 'center', gap: 6 }, actionText: { fontSize: 11, fontWeight: '600' },
});
