import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { topics } from '@/src/studyContent';
import { usePalette } from '@/src/theme';
import { PageHeader } from '@/src/ui';

export default function TopicsScreen() {
  const palette = usePalette();
  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <PageHeader title="Topics" subtitle="Verses gathered by what is on your heart" />
    <ScrollView contentContainerStyle={styles.grid}>
      {topics.map((topic) => <TouchableOpacity key={topic.id} activeOpacity={0.85} onPress={() => router.push({ pathname: '/topic', params: { id: topic.id } })} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.icon, { backgroundColor: palette.elevated }]}><Ionicons name={topic.icon} size={21} color={palette.accent} /></View>
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>{topic.title}</Text>
        <Text style={[styles.blurb, { color: palette.mutedText }]} numberOfLines={2}>{topic.blurb}</Text>
        <Text style={[styles.count, { color: palette.accent }]}>{topic.refs.length} verses</Text>
      </TouchableOpacity>)}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingBottom: 40 },
  card: { width: '47%', margin: '1.5%', borderRadius: 17, borderWidth: 1, padding: 14, minHeight: 148 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 14, fontWeight: '700', marginTop: 12 }, blurb: { fontSize: 10.5, lineHeight: 15, marginTop: 5, flex: 1 }, count: { fontSize: 10, fontWeight: '700', marginTop: 8 },
});
