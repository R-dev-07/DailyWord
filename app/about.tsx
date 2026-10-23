import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePalette } from '@/src/theme';
import { PageHeader } from '@/src/ui';

async function openContact(url: string) {
  try { await Linking.openURL(url); }
  catch { Alert.alert('Unable to open contact', 'Please try again or use the contact details shown.'); }
}

export default function AboutScreen() {
  const palette = usePalette();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return <View style={[styles.safe, { backgroundColor: palette.background }]}><PageHeader title="About DailyWord" /><ScrollView contentContainerStyle={styles.content}><View style={[styles.logo, { backgroundColor: palette.elevated }]}><Ionicons name="book" size={30} color={palette.accent} /></View><Text style={[styles.name, { color: palette.text }]}>DailyWord</Text><Text style={[styles.tagline, { color: palette.accent }]}>Read · Grow · Live</Text>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.cardTitle, { color: palette.text }]}>App version</Text><Text style={[styles.body, { color: palette.mutedText }]}>DailyWord {version}</Text></View>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.cardTitle, { color: palette.text }]}>Privacy</Text><Text style={[styles.body, { color: palette.mutedText }]}>Your reading and study data stays on this device. DailyWord has no account, analytics, or app backend.</Text></View>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.cardTitle, { color: palette.text }]}>Copyright</Text><Text style={[styles.body, { color: palette.mutedText }]}>© {new Date().getFullYear()} DailyWord. All rights reserved. Bible texts and other third-party materials remain subject to their respective rights holders and regional distribution terms.</Text></View>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.cardTitle, { color: palette.text }]}>Help & contact</Text><TouchableOpacity onPress={() => openContact('mailto:ryan.43.temp@gmail.com')} style={styles.contact}><Ionicons name="mail-outline" size={18} color={palette.accent} /><Text style={[styles.contactText, { color: palette.text }]}>ryan.43.temp@gmail.com</Text><Ionicons name="open-outline" size={15} color={palette.mutedText} /></TouchableOpacity><TouchableOpacity onPress={() => openContact('https://wa.me/260964701027')} style={styles.contact}><Ionicons name="logo-whatsapp" size={18} color="#36b77a" /><Text style={[styles.contactText, { color: palette.text }]}>WhatsApp · +260 964 701 027</Text><Ionicons name="open-outline" size={15} color={palette.mutedText} /></TouchableOpacity></View>
  </ScrollView></View>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, back: { width: 38 }, title: { fontSize: 17, fontWeight: '700' }, content: { padding: 21, alignItems: 'center', paddingBottom: 30 }, logo: { marginTop: 12, width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 23, fontWeight: '700', marginTop: 12 }, tagline: { fontSize: 12, marginTop: 4 }, card: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 13 }, cardTitle: { fontWeight: '700', fontSize: 13 }, body: { fontSize: 12, lineHeight: 19, marginTop: 8 }, contact: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#75807340', marginTop: 8 }, contactText: { flex: 1, fontSize: 11, fontWeight: '600' } });
