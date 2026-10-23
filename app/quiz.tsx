import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProgress } from '@/src/progress';
import { buildQuiz, type Question, type QuizMode } from '@/src/quiz';
import { useSettings } from '@/src/store';
import { usePalette } from '@/src/theme';
import { Card, PageHeader, PrimaryButton, SectionLabel } from '@/src/ui';
import { getVerse } from '@/src/verses';

const MODES: Array<{ mode: QuizMode; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { mode: 'mixed', title: 'Mixed quiz', sub: 'A bit of everything · 10 questions', icon: 'shuffle-outline' },
  { mode: 'knowledge', title: 'Bible knowledge', sub: 'People, places and stories', icon: 'school-outline' },
  { mode: 'book', title: 'Which book?', sub: 'Name the book a verse comes from', icon: 'library-outline' },
  { mode: 'finish', title: 'Finish the verse', sub: 'Fill in the missing word', icon: 'pencil-outline' },
];

export default function QuizScreen() {
  const palette = usePalette();
  const translation = useSettings((state) => state.selectedTranslation);
  const stats = useProgress((state) => state.quiz);
  const recordQuiz = useProgress((state) => state.recordQuiz);
  const [phase, setPhase] = useState<'menu' | 'loading' | 'play' | 'done'>('menu');
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const start = async (next: QuizMode) => {
    setMode(next); setPhase('loading');
    try {
      const built = await buildQuiz(next, 10, async (passage) => getVerse(passage.bookId, passage.chapter, passage.verse, translation));
      if (!built.length) throw new Error('empty');
      setQuestions(built); setIndex(0); setPicked(null); setScore(0); setPhase('play');
    } catch { setPhase('menu'); Alert.alert('Could not start the quiz', 'Please try again.'); }
  };
  const choose = (option: number) => {
    if (picked !== null) return;
    setPicked(option);
    if (option === questions[index].answer) setScore((value) => value + 1);
  };
  const next = () => {
    if (index + 1 < questions.length) { setIndex(index + 1); setPicked(null); return; }
    recordQuiz(score, questions.length); setPhase('done');
  };

  const header = <PageHeader title="Quiz" subtitle={phase === 'play' ? `Question ${index + 1} of ${questions.length}` : 'Test what you know'} onBack={() => (phase === 'play' ? Alert.alert('Leave this quiz?', 'Your progress in this quiz will be lost.', [{ text: 'Keep playing', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: () => setPhase('menu') }]) : router.back())} />;

  if (phase === 'loading') return <View style={[styles.root, { backgroundColor: palette.background }]}>{header}<View style={styles.center}><ActivityIndicator color={palette.accent} /><Text style={[styles.muted, { color: palette.mutedText }]}>Preparing your questions…</Text></View></View>;

  if (phase === 'play') {
    const question = questions[index];
    const answered = picked !== null;
    return <View style={[styles.root, { backgroundColor: palette.background }]}>{header}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.track, { backgroundColor: palette.border }]}><View style={[styles.fill, { backgroundColor: palette.accent, width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }]} /></View>
        <Text style={[styles.prompt, { color: palette.text }]}>{question.prompt}</Text>
        {question.quote ? <Card style={{ marginTop: 14 }}><Text style={[styles.quote, { color: palette.text }]}>“{question.quote}”</Text></Card> : null}
        <View style={{ marginTop: 16, gap: 10 }}>
          {question.options.map((option, optionIndex) => {
            const correct = optionIndex === question.answer;
            const wrong = answered && picked === optionIndex && !correct;
            const border = answered && correct ? '#3fae7a' : wrong ? '#d0675c' : palette.border;
            return <TouchableOpacity key={option} disabled={answered} onPress={() => choose(optionIndex)} activeOpacity={0.8} style={[styles.option, { backgroundColor: answered && correct ? '#3fae7a26' : wrong ? '#d0675c26' : palette.surface, borderColor: border }]}>
              <Text style={[styles.optionText, { color: palette.text }]}>{option}</Text>
              {answered && correct ? <Ionicons name="checkmark-circle" size={20} color="#3fae7a" /> : wrong ? <Ionicons name="close-circle" size={20} color="#d0675c" /> : null}
            </TouchableOpacity>;
          })}
        </View>
        {answered && <>
          <Card style={{ marginTop: 16 }}><Text style={[styles.feedback, { color: picked === question.answer ? '#3fae7a' : '#d0675c' }]}>{picked === question.answer ? 'Correct!' : 'Not quite'}</Text><Text style={[styles.explain, { color: palette.mutedText }]}>{question.explain}</Text></Card>
          <PrimaryButton label={index + 1 < questions.length ? 'Next question' : 'See my score'} onPress={next} style={{ marginTop: 16 }} />
        </>}
      </ScrollView></View>;
  }

  if (phase === 'done') {
    const percent = Math.round((score / questions.length) * 100);
    return <View style={[styles.root, { backgroundColor: palette.background }]}>{header}
      <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center' }]}>
        <View style={[styles.badge, { backgroundColor: palette.elevated, borderColor: palette.accent }]}><Text style={[styles.badgeScore, { color: palette.text }]}>{score}/{questions.length}</Text></View>
        <Text style={[styles.prompt, { color: palette.text, textAlign: 'center', marginTop: 18 }]}>{percent >= 90 ? 'Outstanding!' : percent >= 70 ? 'Well done!' : percent >= 40 ? 'Good effort' : 'Keep going'}</Text>
        <Text style={[styles.muted, { color: palette.mutedText, textAlign: 'center' }]}>You answered {percent}% correctly. {percent < 70 ? 'Reading a little each day will help these stick.' : 'Your Bible knowledge is growing.'}</Text>
        <PrimaryButton label="Play again" icon="refresh" onPress={() => start(mode)} style={{ alignSelf: 'stretch', marginTop: 24 }} />
        <TouchableOpacity onPress={() => setPhase('menu')} style={styles.link}><Text style={[styles.linkText, { color: palette.accent }]}>Choose a different quiz</Text></TouchableOpacity>
      </ScrollView></View>;
  }

  return <View style={[styles.root, { backgroundColor: palette.background }]}>{header}
    <ScrollView contentContainerStyle={styles.content}>
      <Card><View style={styles.statRow}>
        {([['Quizzes', stats.played], ['Best score', `${stats.bestPercent}%`], ['Accuracy', stats.answered ? `${Math.round((stats.correct / stats.answered) * 100)}%` : '–']] as const).map(([label, value]) => <View key={label} style={styles.stat}><Text style={[styles.statValue, { color: palette.text }]}>{value}</Text><Text style={[styles.statLabel, { color: palette.mutedText }]}>{label}</Text></View>)}
      </View></Card>
      <SectionLabel>CHOOSE A QUIZ</SectionLabel>
      <View style={{ gap: 10 }}>{MODES.map((item) => <TouchableOpacity key={item.mode} onPress={() => start(item.mode)} activeOpacity={0.85} style={[styles.mode, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.modeIcon, { backgroundColor: palette.elevated }]}><Ionicons name={item.icon} size={20} color={palette.accent} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.modeTitle, { color: palette.text }]}>{item.title}</Text><Text style={[styles.modeSub, { color: palette.mutedText }]}>{item.sub}</Text></View>
        <Ionicons name="play-circle" size={26} color={palette.accent} />
      </TouchableOpacity>)}</View>
    </ScrollView></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 18, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, muted: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: 5, borderRadius: 3 }, prompt: { fontSize: 19, fontWeight: '700', lineHeight: 26, marginTop: 18 }, quote: { fontFamily: 'Georgia', fontSize: 16, lineHeight: 25 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16 }, optionText: { flex: 1, fontSize: 14, fontWeight: '600' },
  feedback: { fontSize: 14, fontWeight: '700' }, explain: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  badge: { width: 128, height: 128, borderRadius: 64, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginTop: 24 }, badgeScore: { fontSize: 32, fontWeight: '800' }, link: { padding: 16 }, linkText: { fontSize: 13, fontWeight: '700' },
  statRow: { flexDirection: 'row' }, stat: { flex: 1, alignItems: 'center' }, statValue: { fontSize: 20, fontWeight: '800' }, statLabel: { fontSize: 10, marginTop: 3 },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 }, modeIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, modeTitle: { fontSize: 14, fontWeight: '700' }, modeSub: { fontSize: 11, marginTop: 3 },
});
