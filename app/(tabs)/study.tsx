import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dueCards, useProgress } from '@/src/progress';
import { topics } from '@/src/studyContent';
import { usePalette } from '@/src/theme';
import { Hero, SectionLabel } from '@/src/ui';

const library = [
  { title: 'Bookmarks', subtitle: 'Your saved verses', icon: 'bookmark' },
  { title: 'Notes', subtitle: 'Thoughts and reflections', icon: 'create' },
  { title: 'Highlights', subtitle: 'Verses by colour', icon: 'color-wand' },
] as const;

export default function StudyScreen() {
  const palette = usePalette();
  const memory = useProgress((state) => state.memory);
  const dueCount = dueCards(memory).length;
  const explore = [
    { title: 'Topics', sub: `${topics.length} themes`, icon: 'compass', path: '/topics' },
    { title: 'Quiz', sub: 'Test yourself', icon: 'help-circle', path: '/quiz' },
    { title: 'Memorize', sub: dueCount ? `${dueCount} due` : `${Object.keys(memory).length} saved`, icon: 'albums', path: '/memorize' },
  ] as const;

  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
      <Hero kicker="GROW IN THE WORD" title="Study" subtitle="Your personal space for reflection." height={150} flip />
      <View style={styles.body}>
        <TouchableOpacity onPress={() => router.push('/search')} style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="search" size={18} color={palette.mutedText} /><Text style={[styles.searchText, { color: palette.mutedText }]}>Search verses, or type a reference</Text></TouchableOpacity>

        <SectionLabel>EXPLORE</SectionLabel>
        <View style={styles.explore}>{explore.map((item) => <TouchableOpacity key={item.title} activeOpacity={0.85} onPress={() => router.push(item.path)} style={[styles.exploreItem, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.exploreIcon, { backgroundColor: palette.elevated }]}><Ionicons name={item.icon} size={22} color={palette.accent} /></View>
          <Text style={[styles.exploreTitle, { color: palette.text }]}>{item.title}</Text>
          <Text style={[styles.exploreSub, { color: item.title === 'Memorize' && dueCount ? palette.accent : palette.mutedText }]}>{item.sub}</Text>
        </TouchableOpacity>)}</View>

        <SectionLabel>YOUR LIBRARY</SectionLabel>
        <View style={{ gap: 10 }}>{library.map((item) => <TouchableOpacity key={item.title} onPress={() => router.push({ pathname: '/study-items', params: { kind: item.title } })} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.icon, { backgroundColor: palette.elevated }]}><Ionicons name={item.icon} size={20} color={palette.accent} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: palette.text }]}>{item.title}</Text><Text style={[styles.cardSub, { color: palette.mutedText }]}>{item.subtitle}</Text></View>
          <Ionicons name="chevron-forward" size={17} color={palette.mutedText} />
        </TouchableOpacity>)}</View>

        <View style={[styles.quote, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.quoteText, { color: palette.text }]}>“Be still, and know that I am God.”</Text><Text style={[styles.quoteRef, { color: palette.accent }]}>PSALM 46:10</Text></View>
      </View>
    </ScrollView></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, body: { paddingHorizontal: 18 },
  search: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderRadius: 14, height: 48, paddingHorizontal: 14 }, searchText: { fontSize: 12 },
  explore: { flexDirection: 'row', gap: 10 }, exploreItem: { flex: 1, borderRadius: 17, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 }, exploreIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }, exploreTitle: { fontSize: 12, fontWeight: '700' }, exploreSub: { fontSize: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 13 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontWeight: '700', fontSize: 13 }, cardSub: { fontSize: 10, marginTop: 4 },
  quote: { marginTop: 26, borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center' }, quoteText: { fontFamily: 'Georgia', fontSize: 16, lineHeight: 24, textAlign: 'center' }, quoteRef: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 10 },
});
