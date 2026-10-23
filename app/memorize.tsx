import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getBookmarkedVerses } from '@/src/database';
import { maskVerse, dueLabel } from '@/src/memorize';
import { dateKey, dueCards, REVIEW_INTERVAL_DAYS, useProgress, type MemoryCard, type ReviewResult } from '@/src/progress';
import { useSettings } from '@/src/store';
import { usePalette } from '@/src/theme';
import { Card, EmptyState, PageHeader, PrimaryButton, SectionLabel } from '@/src/ui';
import { passageLabel, verseOfTheDay } from '@/src/verseOfTheDay';
import { getVerse } from '@/src/verses';
import { translationBadge } from '@/src/versions';

function useVerseText(card: MemoryCard | undefined) {
  const translation = useSettings((state) => state.selectedTranslation);
  const [state, setState] = useState<{ text: string; translationId: string } | null>(null);
  useEffect(() => {
    let active = true;
    setState(null);
    if (card) getVerse(card.bookId, card.chapter, card.verse, translation).then((found) => { if (active) setState(found ?? { text: '', translationId: translation }); }).catch(() => { if (active) setState({ text: '', translationId: translation }); });
    return () => { active = false; };
  }, [card?.id, translation]);
  return state;
}

const RATINGS: Array<{ result: ReviewResult; label: string; color: string }> = [
  { result: 'again', label: 'Missed it', color: '#d0675c' },
  { result: 'hard', label: 'Hard', color: '#d79b4b' },
  { result: 'good', label: 'Got it', color: '#3fae7a' },
  { result: 'easy', label: 'Easy', color: '#4b9ed6' },
];

function Practice({ ids, onDone }: { ids: string[]; onDone: (reviewed: number) => void }) {
  const palette = usePalette();
  const memory = useProgress((state) => state.memory);
  const review = useProgress((state) => state.reviewMemory);
  const [queue, setQueue] = useState(ids);
  const [reviewed, setReviewed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const retried = useMemo(() => new Set<string>(), []);
  const card = memory[queue[0]];
  const verse = useVerseText(card);

  if (!card) return <View style={styles.center}><Text style={[styles.muted, { color: palette.mutedText }]}>Nothing left to practise.</Text><PrimaryButton label="Done" onPress={() => onDone(reviewed)} style={{ marginTop: 16 }} /></View>;

  const rate = (result: ReviewResult) => {
    review(card.id, result);
    const rest = queue.slice(1);
    // A missed verse comes back once more at the end of this session.
    if (result === 'again' && !retried.has(card.id)) { retried.add(card.id); rest.push(card.id); }
    setReviewed((value) => value + 1); setRevealed(false); setQueue(rest);
    if (rest.length === 0) onDone(reviewed + 1);
  };
  const masked = verse?.text ? maskVerse(verse.text, card.box) : null;

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.counter, { color: palette.mutedText }]}>{queue.length} left · {reviewed} reviewed</Text>
    <Card style={{ marginTop: 12, paddingVertical: 22 }}>
      <Text style={[styles.ref, { color: palette.accent }]}>{passageLabel(card)}{verse ? ` · ${translationBadge(verse.translationId)}` : ''}</Text>
      <Text style={[styles.verse, { color: palette.text }]}>{!verse ? 'Loading…' : !verse.text ? 'This verse is not available in the selected version.' : revealed ? verse.text : masked?.masked}</Text>
      {!revealed && masked && <Text style={[styles.hint, { color: palette.mutedText }]}>Say the missing words aloud, then check yourself.</Text>}
    </Card>
    {!revealed ? <PrimaryButton label="Show verse" icon="eye-outline" onPress={() => setRevealed(true)} disabled={!verse?.text} style={{ marginTop: 16 }} />
      : <>
        <Text style={[styles.rateLabel, { color: palette.mutedText }]}>HOW DID YOU DO?</Text>
        <View style={styles.rates}>{RATINGS.map((item) => <TouchableOpacity key={item.result} onPress={() => rate(item.result)} style={[styles.rate, { borderColor: item.color, backgroundColor: item.color + '1f' }]}><Text style={[styles.rateText, { color: palette.text }]}>{item.label}</Text></TouchableOpacity>)}</View>
      </>}
  </ScrollView>;
}

function CardRow({ card, today, onRemove }: { card: MemoryCard; today: string; onRemove: () => void }) {
  const palette = usePalette();
  const verse = useVerseText(card);
  return <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}>
    <View style={{ flex: 1 }}>
      <View style={styles.rowTop}><Text style={[styles.rowRef, { color: palette.accent }]}>{passageLabel(card)}</Text><Text style={[styles.due, { color: card.due <= today ? palette.accent : palette.mutedText }]}>{dueLabel(card.due, today)}</Text></View>
      <Text style={[styles.rowText, { color: palette.text }]} numberOfLines={2}>{verse?.text ?? ' '}</Text>
      <View style={styles.dots}>{REVIEW_INTERVAL_DAYS.map((_, level) => <View key={level} style={[styles.dot, { backgroundColor: level <= card.box ? palette.accent : palette.border }]} />)}</View>
    </View>
    <TouchableOpacity onPress={onRemove} style={styles.remove} accessibilityLabel={`Remove ${passageLabel(card)} from Memorize`}><Ionicons name="trash-outline" size={17} color={palette.mutedText} /></TouchableOpacity>
  </View>;
}

export default function MemorizeScreen() {
  const palette = usePalette();
  const memory = useProgress((state) => state.memory);
  const addMemory = useProgress((state) => state.addMemory);
  const removeMemory = useProgress((state) => state.removeMemory);
  const [session, setSession] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<number | null>(null);
  const today = dateKey();
  const cards = useMemo(() => Object.values(memory).sort((a, b) => a.due.localeCompare(b.due) || a.added.localeCompare(b.added)), [memory]);
  const due = useMemo(() => dueCards(memory, today), [memory, today]);

  const addFromBookmarks = async () => {
    try {
      const rows = await getBookmarkedVerses();
      const added = rows.filter((row) => addMemory({ bookId: row.book_id, chapter: row.chapter, verse: row.verse })).length;
      Alert.alert(rows.length === 0 ? 'No bookmarks yet' : added ? 'Added' : 'Already added', rows.length === 0 ? 'Bookmark verses while you read, then add them here.' : added ? `${added} bookmarked ${added === 1 ? 'verse was' : 'verses were'} added to Memorize.` : 'All your bookmarked verses are already in Memorize.');
    } catch { Alert.alert('Something went wrong', 'Please try again.'); }
  };
  const addToday = () => { const verse = verseOfTheDay(); const added = addMemory(verse); Alert.alert(added ? 'Added' : 'Already added', `${passageLabel(verse)} is in Memorize.`); };

  const header = <PageHeader title="Memorize" subtitle={cards.length ? `${cards.length} ${cards.length === 1 ? 'verse' : 'verses'} · ${due.length} due today` : 'Keep God’s Word close to your heart'} onBack={() => (session ? setSession(null) : router.back())} />;

  if (session) return <View style={[styles.root, { backgroundColor: palette.background }]}>{header}<Practice ids={session} onDone={(count) => { setSession(null); setSummary(count); }} /></View>;

  const adders = <>
    <SectionLabel>ADD VERSES</SectionLabel>
    <View style={{ gap: 10 }}>
      {([['bookmark-outline', 'From my bookmarks', 'Verses you saved while reading', addFromBookmarks], ['sunny-outline', 'Today’s verse', passageLabel(verseOfTheDay()), addToday], ['compass-outline', 'Browse topics', 'Pick verses by theme', () => router.push('/topics')]] as const).map(([icon, title, sub, action]) => <TouchableOpacity key={title} onPress={action} style={[styles.add, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={[styles.addIcon, { backgroundColor: palette.elevated }]}><Ionicons name={icon} size={19} color={palette.accent} /></View><View style={{ flex: 1 }}><Text style={[styles.addTitle, { color: palette.text }]}>{title}</Text><Text style={[styles.addSub, { color: palette.mutedText }]}>{sub}</Text></View><Ionicons name="add-circle-outline" size={22} color={palette.accent} /></TouchableOpacity>)}
    </View>
    <Text style={[styles.tip, { color: palette.mutedText }]}>You can also tap any verse while reading and choose Memorize.</Text>
  </>;

  return <View style={[styles.root, { backgroundColor: palette.background }]}>{header}
    <ScrollView contentContainerStyle={styles.content}>
      {summary !== null && <Card style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Ionicons name="checkmark-circle" size={22} color="#3fae7a" /><Text style={{ color: palette.text, flex: 1, fontSize: 13 }}>Session complete. You reviewed {summary} {summary === 1 ? 'verse' : 'verses'}.</Text></Card>}
      {cards.length === 0 ? <>
        <EmptyState icon="albums-outline" title="Start your first verse" body="Choose a few verses and DailyWord will bring each one back at the right time, so it stays with you." />
        {adders}
      </> : <>
        {due.length > 0 ? <PrimaryButton label={`Practice ${due.length} ${due.length === 1 ? 'verse' : 'verses'} due today`} icon="play" onPress={() => { setSummary(null); setSession(due.map((card) => card.id)); }} />
          : <Card><Text style={{ color: palette.text, fontWeight: '700', fontSize: 14 }}>You’re all caught up</Text><Text style={{ color: palette.mutedText, fontSize: 12, marginTop: 5 }}>{dueLabel(cards[0].due, today)} · next review {passageLabel(cards[0])}</Text></Card>}
        <SectionLabel>YOUR VERSES</SectionLabel>
        {cards.map((card) => <CardRow key={card.id} card={card} today={today} onRemove={() => Alert.alert('Remove verse?', `${passageLabel(card)} will be removed from Memorize.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeMemory(card.id) }])} />)}
        {adders}
      </>}
    </ScrollView></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 18, paddingBottom: 44 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, muted: { fontSize: 12 },
  counter: { fontSize: 11, textAlign: 'center' }, ref: { fontSize: 12, fontWeight: '700' }, verse: { fontFamily: 'Georgia', fontSize: 20, lineHeight: 31, marginTop: 12 }, hint: { fontSize: 11, marginTop: 16 },
  rateLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 22, textAlign: 'center' }, rates: { flexDirection: 'row', gap: 8, marginTop: 12 }, rate: { flex: 1, borderWidth: 1.5, borderRadius: 13, paddingVertical: 14, alignItems: 'center' }, rateText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 9 }, rowTop: { flexDirection: 'row', justifyContent: 'space-between' }, rowRef: { fontSize: 12, fontWeight: '700' }, due: { fontSize: 10, fontWeight: '600' }, rowText: { fontFamily: 'Georgia', fontSize: 13, lineHeight: 19, marginTop: 6, minHeight: 38 },
  dots: { flexDirection: 'row', gap: 5, marginTop: 8 }, dot: { width: 14, height: 4, borderRadius: 2 }, remove: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  add: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 15, padding: 13 }, addIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, addTitle: { fontSize: 13, fontWeight: '700' }, addSub: { fontSize: 10, marginTop: 3 }, tip: { fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
