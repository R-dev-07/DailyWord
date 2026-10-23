import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePalette } from '@/src/theme';
import { Hero } from '@/src/ui';
import { bibleVersions } from '@/src/versions';

const languageCount = new Set(bibleVersions.map((version) => version.language)).size;

export default function MoreScreen() {
  const palette = usePalette();
  const rows = [
    { title: 'Bible versions & languages', sub: `${bibleVersions.length} versions in ${languageCount} languages`, icon: 'globe-outline', action: () => router.push('/versions') },
    { title: 'Read aloud', sub: 'Voice, speed and playback options', icon: 'volume-high-outline', action: () => router.push('/read-aloud') },
    { title: 'Appearance', sub: 'Themes, text size and reading style', icon: 'color-palette-outline', action: () => router.push('/appearance') },
    { title: 'About DailyWord', sub: 'Content, privacy and app information', icon: 'information-circle-outline', action: () => router.push('/about') },
  ] as const;
  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
      <Hero kicker="YOUR APP" title="More" subtitle="Settings and information." height={150} />
      <View style={styles.body}>
        <View style={[styles.brand, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.brandIcon, { backgroundColor: palette.elevated }]}><Ionicons name="book" size={23} color={palette.accent} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.brandName, { color: palette.text }]}>DailyWord</Text><Text style={[styles.brandSub, { color: palette.mutedText }]}>Read · Grow · Live</Text></View>
          <Text style={[styles.version, { color: palette.mutedText }]}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
        <View style={[styles.list, { backgroundColor: palette.surface, borderColor: palette.border }]}>{rows.map((row, index) => <TouchableOpacity key={row.title} onPress={row.action} style={[styles.row, index < rows.length - 1 && { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={[styles.rowIcon, { backgroundColor: palette.elevated }]}><Ionicons name={row.icon} size={19} color={palette.accent} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: palette.text }]}>{row.title}</Text><Text style={[styles.rowSub, { color: palette.mutedText }]}>{row.sub}</Text></View>
          <Ionicons name="chevron-forward" size={17} color={palette.mutedText} />
        </TouchableOpacity>)}</View>
        <View style={[styles.privacy, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="lock-closed-outline" size={18} color={palette.accent} /><View style={{ flex: 1 }}><Text style={[styles.privacyTitle, { color: palette.text }]}>Private by design</Text><Text style={[styles.privacyText, { color: palette.mutedText }]}>Your reading, notes and progress stay on this device. No account needed.</Text></View></View>
      </View>
    </ScrollView></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, body: { paddingHorizontal: 18 },
  brand: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 17, borderWidth: 1 }, brandIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, brandName: { fontWeight: '700', fontSize: 15 }, brandSub: { fontSize: 10, marginTop: 4 }, version: { fontSize: 10 },
  list: { marginTop: 14, borderRadius: 17, borderWidth: 1, paddingHorizontal: 13 }, row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 }, rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, rowTitle: { fontSize: 13, fontWeight: '600' }, rowSub: { fontSize: 10, marginTop: 4 },
  privacy: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, borderWidth: 1 }, privacyTitle: { fontSize: 12, fontWeight: '700' }, privacyText: { fontSize: 11, marginTop: 4, lineHeight: 16 },
});
