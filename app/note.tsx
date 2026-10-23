import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { bookById, bookLabel } from '@/src/bible';
import { saveNote } from '@/src/database';
import { usePalette } from '@/src/theme';
import { PageHeader } from '@/src/ui';

export default function NoteScreen() {
  const palette = usePalette();
  const params = useLocalSearchParams<{ bookId?: string; chapter?: string; verse?: string }>();
  const bookId = bookById(Number(params.bookId ?? 1)).id;
  const chapter = Number(params.chapter ?? 1);
  const verse = Number(params.verse ?? 1);
  const [body, setBody] = useState('');
  const save = async () => {
    if (!body.trim()) { Alert.alert('Add a note', 'Write a reflection before saving.'); return; }
    try {
      await saveNote(bookId, chapter, verse, body.trim());
      Alert.alert('Note saved', 'Your note is stored on this device.', [{ text: 'Done', onPress: () => router.back() }]);
    } catch { Alert.alert('Could not save', 'Please try again.'); }
  };
  return <KeyboardAvoidingView style={[styles.root, { backgroundColor: palette.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <PageHeader title="New note" subtitle={`${bookLabel(bookId)} ${chapter}:${verse}`} close right={<TouchableOpacity onPress={save} style={[styles.save, { backgroundColor: palette.accent }]}><Text style={[styles.saveText, { color: palette.background }]}>Save</Text></TouchableOpacity>} />
    <View style={styles.body}><TextInput value={body} onChangeText={setBody} multiline autoFocus placeholder="Write a thought or reflection…" placeholderTextColor={palette.mutedText} style={[styles.input, { backgroundColor: palette.surface, color: palette.text, borderColor: palette.border }]} textAlignVertical="top" /></View>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, body: { flex: 1, padding: 16 }, input: { flex: 1, fontSize: 16, lineHeight: 25, padding: 15, borderRadius: 16, borderWidth: 1 },
  save: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 9 }, saveText: { fontSize: 13, fontWeight: '700' },
});
