import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookById, nextChapter, previousChapter, type Passage } from './bible';
import { getChapterHighlights, getChapterVerses } from './database';
import { PassageNavigator } from './PassageNavigator';
import { useProgress } from './progress';
import { SpeechPlayer } from './SpeechPlayer';
import { useSettings } from './store';
import { usePalette } from './theme';
import { Hero, IconButton, withAlpha } from './ui';
import { useChapterSpeech } from './useChapterSpeech';
import { useReachedEnd } from './useReachedEnd';
import { VerseActions } from './VerseActions';
import { translationBadge, translationName, versionForTranslation } from './versions';

type Verse = { verse: number; text: string };

type Props = {
  bookId: number;
  chapter: number;
  /** Verse to scroll to and select when the chapter opens. */
  verse?: number;
  /** Increase to start reading aloud as soon as the chapter has loaded. */
  autoplayKey?: number;
  onNavigate: (passage: Passage, options?: { autoplay?: boolean }) => void;
  onBack?: () => void;
  /** True when shown full-screen (no tab bar below), so the bottom bar clears the gesture area itself. */
  standalone?: boolean;
};

/** The reading page, shared by the Bible tab and the full-screen reader. */
export function ChapterView({ bookId, chapter, verse, autoplayKey = 0, onNavigate, onBack, standalone }: Props) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const fontSize = useSettings((state) => state.fontSize);
  const fontStyle = useSettings((state) => state.fontStyle);
  const translation = useSettings((state) => state.selectedTranslation);
  const autoContinue = useSettings((state) => state.speechAutoContinue);
  const markChapterRead = useProgress((state) => state.markChapterRead);
  const setLastRead = useProgress((state) => state.setLastRead);

  const book = bookById(bookId);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number | null>(verse && verse > 1 ? verse : null);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<number, number>>({});
  const pendingAutoplay = useRef(false);
  const pendingScroll = useRef<number | null>(verse && verse > 1 ? verse : null);

  const previous = previousChapter(bookId, chapter);
  const next = nextChapter(bookId, chapter);
  const reachedEnd = useReachedEnd(verses.length > 0, () => markChapterRead(bookId, chapter));

  const speech = useChapterSpeech({
    lines: verses,
    heading: `${book.name}, chapter ${chapter}`,
    translationId: translation,
    resetKey: `${bookId}:${chapter}:${translation}`,
    onFinished: () => {
      markChapterRead(bookId, chapter);
      if (autoContinue && next) onNavigate(next, { autoplay: true });
    },
    onFailed: (message) => Alert.alert('Read aloud unavailable', `${message}\n\nMake sure a text-to-speech voice for this language is installed on your device.`, [{ text: 'Voice settings', onPress: () => router.push('/read-aloud') }, { text: 'OK' }]),
  });

  useEffect(() => { if (autoplayKey > 0) pendingAutoplay.current = true; }, [autoplayKey]);

  // Load the chapter (and its highlights) whenever the passage or version changes.
  useEffect(() => {
    let active = true;
    offsets.current = {};
    reachedEnd.reset();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setVerses([]);
    setSelected(verse && verse > 1 ? verse : null);
    pendingScroll.current = verse && verse > 1 ? verse : null;
    getChapterVerses(bookId, chapter, translation).then((rows) => { if (active) setVerses(rows); }).catch(() => { if (active) setVerses([]); });
    getChapterHighlights(bookId, chapter).then((rows) => { if (active) setHighlights(rows); }).catch(() => undefined);
    return () => { active = false; };
  }, [bookId, chapter, translation, verse]);

  useEffect(() => {
    if (!verses.length) return;
    if (pendingAutoplay.current) { pendingAutoplay.current = false; speech.start(); }
    if (pendingScroll.current != null) {
      const target = pendingScroll.current;
      pendingScroll.current = null;
      setTimeout(() => { const y = offsets.current[target]; if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true }); }, 250);
    }
  }, [verses, speech.start]);

  // Remember where the reader was, so Home and Habits can offer "continue reading".
  useEffect(() => {
    const timer = setTimeout(() => setLastRead({ bookId, chapter, verse: selected ?? 1 }), 600);
    return () => clearTimeout(timer);
  }, [bookId, chapter, selected, setLastRead]);

  // Follow the verse being read aloud.
  useEffect(() => {
    if (speech.currentVerse == null) return;
    const y = offsets.current[speech.currentVerse];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }, [speech.currentVerse]);

  const go = useCallback((passage: Passage | null) => { if (passage) onNavigate(passage); }, [onNavigate]);
  const togglePlayback = () => {
    if (!verses.length && speech.status === 'idle') { Alert.alert('Passage unavailable', 'No verse text was found for this chapter in the selected version.'); return; }
    speech.toggle(selected ?? undefined);
  };

  const selectedText = verses.find((row) => row.verse === selected)?.text ?? '';
  const version = versionForTranslation(translation);
  const serif = fontStyle === 'Serif' ? 'Georgia' : undefined;
  const bottomPad = standalone ? insets.bottom : 0;

  return <View style={[styles.root, { backgroundColor: palette.background }]}>
    <Hero
      height={176}
      kicker={book.testament.toUpperCase()}
      title={`${book.name} ${chapter}`}
      left={onBack ? <IconButton icon="chevron-back" label="Go back" onPress={onBack} /> : undefined}
      right={<IconButton icon="text" label="Reading appearance" onPress={() => router.push('/appearance')} />}
    >
      <View style={styles.pills}>
        <TouchableOpacity onPress={() => setNavigatorOpen(true)} style={[styles.pill, { backgroundColor: palette.accent }]} accessibilityLabel="Choose a passage"><Ionicons name="list" size={14} color={palette.background} /><Text style={[styles.pillText, { color: palette.background }]}>Choose passage</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/versions')} style={[styles.pill, { backgroundColor: withAlpha(palette.background, 0.6), borderWidth: 1, borderColor: palette.border }]} accessibilityLabel="Change Bible version"><Text style={[styles.pillText, { color: palette.accent }]}>{translationBadge(translation)}</Text><Text style={[styles.pillMeta, { color: palette.text }]} numberOfLines={1}>{version?.language ?? 'English'}</Text><Ionicons name="chevron-down" size={13} color={palette.text} /></TouchableOpacity>
      </View>
    </Hero>

    <ScrollView ref={scrollRef} style={styles.reading} contentContainerStyle={styles.readingContent} showsVerticalScrollIndicator={false} {...reachedEnd.props}>
      {verses.length ? <>
        {verses.map(({ verse: number, text }) => {
          const color = highlights[number];
          const speaking = speech.currentVerse === number;
          return <TouchableOpacity key={number} activeOpacity={0.8} onLayout={(event) => { offsets.current[number] = event.nativeEvent.layout.y; }} onPress={() => setSelected(selected === number ? null : number)}
            style={[styles.verse, color ? { backgroundColor: withAlpha(color, 0.22) } : null, speaking ? { backgroundColor: palette.elevated } : null, selected === number ? { borderLeftColor: palette.accent } : { borderLeftColor: 'transparent' }]}>
            <Text style={[styles.text, { color: palette.text, fontSize, lineHeight: fontSize * 1.65, fontFamily: serif }]}><Text style={[styles.number, { color: palette.accent, fontSize: Math.max(11, fontSize * 0.62) }]}>{number}  </Text>{text}</Text>
          </TouchableOpacity>;
        })}
        {!selected && <Text style={[styles.tip, { color: palette.mutedText }]}>Tap any verse to save, highlight, copy or share it.</Text>}
        {next && <TouchableOpacity onPress={() => go(next)} style={[styles.nextCard, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={{ flex: 1 }}><Text style={[styles.nextKicker, { color: palette.mutedText }]}>NEXT</Text><Text style={[styles.nextTitle, { color: palette.text }]}>{bookById(next.bookId).name} {next.chapter}</Text></View><Ionicons name="arrow-forward" size={20} color={palette.accent} /></TouchableOpacity>}
      </> : <View style={[styles.empty, { backgroundColor: palette.surface }]}><Ionicons name="book-outline" size={28} color={palette.accent} /><Text style={[styles.emptyTitle, { color: palette.text }]}>Loading…</Text><Text style={[styles.emptyText, { color: palette.mutedText }]}>If this stays empty, {translationName(translation)} has no text for this chapter. Try another version or chapter.</Text></View>}
    </ScrollView>

    {selected != null && selectedText ? <VerseActions passage={{ bookId, chapter, verse: selected }} text={selectedText} translationId={translation} color={highlights[selected]} onColor={(color) => setHighlights((current) => { const copy = { ...current }; if (color) copy[selected] = color; else delete copy[selected]; return copy; })} onClose={() => setSelected(null)} /> : null}
    <SpeechPlayer speech={speech} title={`${book.name} ${chapter}`} />

    <View style={[styles.bar, { backgroundColor: palette.surface, borderTopColor: palette.border, paddingBottom: 10 + bottomPad }]}>
      <TouchableOpacity onPress={() => go(previous)} disabled={!previous} style={styles.step} accessibilityLabel="Previous chapter"><Ionicons name="chevron-back" size={22} color={previous ? palette.text : palette.border} /></TouchableOpacity>
      <TouchableOpacity onPress={togglePlayback} style={[styles.listen, { backgroundColor: palette.accent }]} accessibilityLabel={speech.status === 'playing' ? 'Pause read aloud' : speech.status === 'paused' ? 'Resume read aloud' : 'Read this chapter aloud'}>
        <Ionicons name={speech.status === 'playing' ? 'pause' : 'play'} size={18} color={palette.background} />
        <Text style={[styles.listenText, { color: palette.background }]}>{speech.status === 'playing' ? 'Pause' : speech.status === 'paused' ? 'Resume' : 'Listen'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => go(next)} disabled={!next} style={styles.step} accessibilityLabel="Next chapter"><Ionicons name="chevron-forward" size={22} color={next ? palette.text : palette.border} /></TouchableOpacity>
    </View>

    <PassageNavigator visible={navigatorOpen} bookId={bookId} chapter={chapter} onClose={() => setNavigatorOpen(false)} onPick={(pickedBook, pickedChapter) => { setNavigatorOpen(false); onNavigate({ bookId: pickedBook, chapter: pickedChapter, verse: 1 }); }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pills: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 9, maxWidth: 190 }, pillText: { fontSize: 12, fontWeight: '700' }, pillMeta: { fontSize: 11, flexShrink: 1 },
  reading: { flex: 1 }, readingContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 24 },
  verse: { paddingVertical: 7, paddingHorizontal: 8, borderLeftWidth: 3, borderRadius: 8, marginVertical: 1 }, text: {}, number: { fontWeight: '700' },
  tip: { textAlign: 'center', fontSize: 11, marginTop: 18 },
  nextCard: { marginTop: 22, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 16 }, nextKicker: { fontSize: 9, letterSpacing: 1.4, fontWeight: '700' }, nextTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  empty: { margin: 10, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 }, emptyTitle: { fontSize: 15, fontWeight: '700' }, emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 14, borderTopWidth: 1, gap: 10 },
  step: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  listen: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 24, height: 48 }, listenText: { fontSize: 14, fontWeight: '700' },
});
