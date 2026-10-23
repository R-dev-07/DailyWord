import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themeArt } from '@/src/art';
import { bookById, readerParams, TOTAL_CHAPTERS } from '@/src/bible';
import { getChapterVerses } from '@/src/database';
import { computeStreak, dueCards, resumePassage, useProgress } from '@/src/progress';
import { useSettings } from '@/src/store';
import { usePalette } from '@/src/theme';
import { Hero, SectionLabel, withAlpha } from '@/src/ui';
import { passageLabel, verseOfTheDay } from '@/src/verseOfTheDay';
import { translationBadge } from '@/src/versions';

export default function HomeScreen() {
  const palette = usePalette();
  const appearance = useSettings((state) => state.appearance);
  const translation = useSettings((state) => state.selectedTranslation);
  const days = useProgress((state) => state.days);
  const chaptersRead = useProgress((state) => state.chaptersRead);
  const lastRead = useProgress((state) => state.lastRead);
  const memory = useProgress((state) => state.memory);
  const markPractice = useProgress((state) => state.markPractice);

  const greeting = useMemo(() => { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'; }, []);
  const streak = useMemo(() => computeStreak(days), [days]);
  const resume = resumePassage(lastRead, chaptersRead);
  const votd = useMemo(() => verseOfTheDay(), []);
  const [votdText, setVotdText] = useState('');
  const [votdBadge, setVotdBadge] = useState(translationBadge(translation));
  const due = dueCards(memory).length;

  useEffect(() => {
    let active = true;
    const find = async (id: string) => (await getChapterVerses(votd.bookId, votd.chapter, id)).find((row) => row.verse === votd.verse)?.text;
    find(translation)
      .then(async (text) => (text ? { text, id: translation } : { text: await find('KJV'), id: 'KJV' }))
      .then(({ text, id }) => { if (active) { setVotdText(text ?? ''); setVotdBadge(translationBadge(id)); } })
      .catch(() => { if (active) setVotdText(''); });
    return () => { active = false; };
  }, [votd, translation]);

  const open = (passage = resume) => router.push({ pathname: '/reader', params: readerParams(passage) });
  const resumeBook = bookById(resume.bookId);
  const onImage = '#fffaf0';

  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
      <Hero kicker="DAILYWORD" title={greeting} subtitle="His mercies are new every morning." height={150} />
      <View style={styles.body}>
        <ImageBackground source={themeArt[appearance]} resizeMode="cover" style={styles.verseCard} imageStyle={{ borderRadius: 22 }}>
          <View style={[StyleSheet.absoluteFill, { borderRadius: 22, backgroundColor: appearance === 'Light' ? 'rgba(28, 52, 42, 0.86)' : 'rgba(4, 12, 12, 0.5)' }]} />
          <View style={styles.verseHead}><Ionicons name="sparkles" size={15} color="#e7b65e" /><Text style={styles.verseLabel}>VERSE OF THE DAY</Text></View>
          <Text style={[styles.reference, { color: onImage }]}>{passageLabel(votd)}</Text>
          <Text style={[styles.verseText, { color: onImage }]}>{votdText ? `“${votdText}”` : 'Open the passage to read today’s verse.'}</Text>
          <View style={styles.verseBottom}>
            <TouchableOpacity onPress={() => { markPractice('verse'); open(votd); }} style={styles.readPill}><Text style={styles.readPillText}>Read passage</Text><Ionicons name="arrow-forward" size={13} color="#10221d" /></TouchableOpacity>
            {votdText ? <TouchableOpacity onPress={() => Share.share({ message: `“${votdText}” — ${passageLabel(votd)} (${votdBadge})` })} accessibilityLabel="Share verse of the day"><Ionicons name="share-social-outline" size={21} color={onImage} /></TouchableOpacity> : null}
          </View>
        </ImageBackground>

        <TouchableOpacity activeOpacity={0.88} onPress={() => open()} style={[styles.continue, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.continueIcon, { backgroundColor: palette.elevated }]}><Ionicons name="book" size={20} color={palette.accent} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: palette.mutedText }]}>{lastRead ? 'CONTINUE READING' : 'START READING'}</Text><Text style={[styles.continueTitle, { color: palette.text }]}>{resumeBook.name} {resume.chapter}{resume.verse > 1 ? `  ·  verse ${resume.verse}` : ''}</Text></View>
          <View style={[styles.play, { backgroundColor: palette.accent }]}><Ionicons name="play" size={15} color={palette.background} /></View>
        </TouchableOpacity>

        <View style={styles.statRow}>
          <TouchableOpacity style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => router.push('/(tabs)/habits')}><Ionicons name="flame" size={19} color={palette.accent} /><Text style={[styles.statValue, { color: palette.text }]}>{streak.current}</Text><Text style={[styles.statLabel, { color: palette.mutedText }]}>{streak.current === 1 ? 'day streak' : 'day streak'}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => router.push('/(tabs)/habits')}><Ionicons name="checkmark-done" size={19} color={palette.accent} /><Text style={[styles.statValue, { color: palette.text }]}>{chaptersRead.length}</Text><Text style={[styles.statLabel, { color: palette.mutedText }]}>of {TOTAL_CHAPTERS.toLocaleString()} chapters</Text></TouchableOpacity>
        </View>

        <SectionLabel>QUICK ACCESS</SectionLabel>
        <View style={styles.quickRow}>{([
          ['book-outline', 'Bible', () => router.push('/(tabs)/bible')],
          ['compass-outline', 'Topics', () => router.push('/topics')],
          ['help-circle-outline', 'Quiz', () => router.push('/quiz')],
          ['albums-outline', due ? `Memorize · ${due}` : 'Memorize', () => router.push('/memorize')],
        ] as const).map(([icon, label, action]) => <TouchableOpacity key={label} style={[styles.quick, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={action}><Ionicons name={icon} size={21} color={palette.accent} /><Text style={[styles.quickLabel, { color: palette.text }]} numberOfLines={1}>{label}</Text></TouchableOpacity>)}</View>
      </View>
    </ScrollView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, body: { paddingHorizontal: 18 },
  verseCard: { borderRadius: 22, padding: 20, overflow: 'hidden', marginTop: 4 }, verseHead: { flexDirection: 'row', alignItems: 'center', gap: 8 }, verseLabel: { color: '#e7b65e', fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  reference: { fontSize: 22, fontWeight: '700', marginTop: 12 }, verseText: { fontFamily: 'Georgia', fontSize: 17, lineHeight: 26, marginTop: 10 }, verseBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  readPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#f3e6c4', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 }, readPillText: { color: '#10221d', fontSize: 12, fontWeight: '700' },
  continue: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14 }, continueIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4 }, continueTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 }, play: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, gap: 3 }, statValue: { fontSize: 24, fontWeight: '800', marginTop: 4 }, statLabel: { fontSize: 10 },
  quickRow: { flexDirection: 'row', gap: 9 }, quick: { flex: 1, alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 15, paddingVertical: 14, paddingHorizontal: 4 }, quickLabel: { fontSize: 10, fontWeight: '600' },
});
