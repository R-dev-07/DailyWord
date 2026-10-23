import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, usePalette } from '@/src/theme';
import { bookById, readerParams, TOTAL_CHAPTERS } from '@/src/bible';
import { computeStreak, dateKey, resumePassage, useProgress, weekStatus, type PracticeItem } from '@/src/progress';
import { Hero } from '@/src/ui';
import { passageLabel, verseOfTheDay } from '@/src/verseOfTheDay';

export default function HabitsScreen() {
  const palette = usePalette();
  const days = useProgress((state) => state.days);
  const chaptersRead = useProgress((state) => state.chaptersRead);
  const lastRead = useProgress((state) => state.lastRead);
  const togglePractice = useProgress((state) => state.togglePractice);
  const markPractice = useProgress((state) => state.markPractice);

  const log = days[dateKey()] ?? {};
  const streak = useMemo(() => computeStreak(days), [days]);
  const week = useMemo(() => weekStatus(days), [days]);
  const resume = resumePassage(lastRead, chaptersRead);
  const votd = useMemo(() => verseOfTheDay(), []);
  const fraction = chaptersRead.length / TOTAL_CHAPTERS;
  const percentLabel = chaptersRead.length === 0 ? '0%' : fraction < 0.01 ? '<1%' : `${Math.round(fraction * 100)}%`;

  const practice: Array<{ key: PracticeItem; title: string; sub: string; open?: () => void }> = [
    { key: 'read', title: 'Read the Bible', sub: log.read ? 'Done for today' : `${bookById(resume.bookId).name} ${resume.chapter}`, open: () => router.push({ pathname: '/reader', params: readerParams(resume) }) },
    { key: 'verse', title: 'Verse of the Day', sub: passageLabel(votd), open: () => { markPractice('verse'); router.push({ pathname: '/reader', params: readerParams(votd) }); } },
    { key: 'prayer', title: 'Prayer', sub: 'Take a quiet moment' },
  ];

  return <View style={[styles.safe, { backgroundColor: palette.background }]}>
    <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
      <Hero kicker="SMALL STEPS, EVERY DAY" title="Your rhythm" subtitle="Build a little space for the Word." height={150} flip />
      <View style={styles.content}>
      <View style={[styles.streak, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.streakHead}>
          <View>
            <Text style={[styles.streakLabel, { color: palette.mutedText }]}>CURRENT STREAK</Text>
            <Text style={[styles.streakNum, { color: palette.text }]}>{streak.current} <Text style={[styles.days, { color: palette.accent }]}>{streak.current === 1 ? 'day' : 'days'}</Text></Text>
            <Text style={[styles.best, { color: palette.mutedText }]}>{streak.best > 0 ? `Personal best · ${streak.best} ${streak.best === 1 ? 'day' : 'days'}` : 'Complete any practice today to begin your streak.'}</Text>
          </View>
          <View style={[styles.flame, { backgroundColor: palette.elevated }]}><Ionicons name="flame" size={28} color={palette.accent} /></View>
        </View>
        <View style={styles.week}>{week.map((day) => <View key={day.key} style={styles.day}><View style={[styles.dayDot, { borderColor: day.isToday ? palette.accent : palette.mutedText, opacity: day.isFuture ? 0.4 : 1 }, day.done && { backgroundColor: palette.accent, borderColor: palette.accent }]}>{day.done && <Ionicons name="checkmark" size={13} color={palette.background} />}</View><Text style={[styles.dayText, { color: day.isToday ? palette.accent : palette.mutedText }]}>{day.label}</Text></View>)}</View>
      </View>

      <Text style={[styles.section, { color: palette.mutedText }]}>TODAY'S PRACTICE</Text>
      <View style={[styles.practice, { backgroundColor: palette.surface }]}>{practice.map((item, index) => {
        const done = !!log[item.key];
        return <View key={item.key} style={[styles.practiceRow, index < practice.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
          <TouchableOpacity onPress={() => togglePractice(item.key)} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`${item.title}, ${done ? 'done' : 'not done'}`} style={[styles.check, { borderColor: palette.mutedText }, done && { backgroundColor: colors.green, borderColor: colors.green }]}>{done && <Ionicons name="checkmark" size={14} color="#f7f1e6" />}</TouchableOpacity>
          <TouchableOpacity style={styles.practiceBody} onPress={item.open ?? (() => togglePractice(item.key))} activeOpacity={0.7}>
            <View style={{ flex: 1 }}><Text style={[styles.practiceTitle, { color: palette.text }]}>{item.title}</Text><Text style={[styles.practiceSub, { color: palette.mutedText }]}>{item.sub}</Text></View>
            <Ionicons name={item.open ? 'chevron-forward' : 'checkmark-circle-outline'} size={16} color={palette.mutedText} />
          </TouchableOpacity>
        </View>;
      })}</View>

      <View style={styles.planHead}><Text style={[styles.section, { color: palette.mutedText }]}>READING PLAN</Text><TouchableOpacity onPress={() => router.push({ pathname: '/reader', params: readerParams(resume) })}><Text style={[styles.seeAll, { color: palette.accent }]}>{chaptersRead.length ? 'Open next reading' : 'Start with Genesis 1'}</Text></TouchableOpacity></View>
      <View style={[styles.plan, { backgroundColor: palette.surface }]}>
        <View style={[styles.planIcon, { backgroundColor: palette.elevated }]}><Ionicons name="map-outline" size={20} color={palette.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.planTitle, { color: palette.text }]}>Read through the Bible</Text>
          <Text style={[styles.planSub, { color: palette.mutedText }]}>{chaptersRead.length} of {TOTAL_CHAPTERS.toLocaleString()} chapters read</Text>
          <View style={[styles.track, { backgroundColor: palette.border }]}><View style={[styles.fill, { backgroundColor: palette.accent, width: `${Math.min(100, fraction * 100)}%` }]} /></View>
        </View>
        <Text style={[styles.percent, { color: palette.accent }]}>{percentLabel}</Text>
      </View>

      </View>
    </ScrollView>

  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { paddingHorizontal: 21 },
  kicker: { marginTop: 14, letterSpacing: 1.5, fontWeight: '700', fontSize: 9 }, title: { fontSize: 31, fontWeight: '700', marginTop: 4 }, sub: { marginTop: 5, fontSize: 13 },
  streak: { marginTop: 21, borderRadius: 19, padding: 17, borderWidth: 1 }, streakHead: { flexDirection: 'row', justifyContent: 'space-between' }, streakLabel: { letterSpacing: 1.3, fontSize: 9, fontWeight: '700' },
  streakNum: { fontSize: 35, fontWeight: '700', marginTop: 3 }, days: { fontSize: 14 }, best: { fontSize: 10, marginTop: 2, maxWidth: 230 }, flame: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 }, day: { alignItems: 'center', gap: 5 }, dayDot: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, dayText: { fontSize: 9 },
  section: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginTop: 23 },
  practice: { marginTop: 10, borderRadius: 15, paddingHorizontal: 13 }, practiceRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11 }, practiceBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 58 },
  check: { width: 23, height: 23, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, practiceTitle: { fontSize: 12, fontWeight: '600' }, practiceSub: { fontSize: 10, marginTop: 3 },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, seeAll: { fontSize: 10, marginTop: 20 }, plan: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginTop: 10, borderRadius: 15 },
  planIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, planTitle: { fontSize: 12, fontWeight: '700' }, planSub: { fontSize: 10, marginTop: 4 }, track: { height: 4, borderRadius: 3, marginTop: 9, overflow: 'hidden' }, fill: { height: 4, borderRadius: 3 }, percent: { fontWeight: '700', fontSize: 11 },
});
