import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { readerParams } from '@/src/bible';
import { ChapterView } from '@/src/ChapterView';

/** Full-screen reading page opened from Home, Study, Habits or search results. */
export default function ReaderScreen() {
  const params = useLocalSearchParams<{ bookId?: string; chapter?: string; verse?: string; autoplay?: string }>();
  const autoplayKey = useRef(params.autoplay === '1' ? 1 : 0).current;
  return <ChapterView
    standalone
    bookId={Number(params.bookId ?? 1)}
    chapter={Number(params.chapter ?? 1)}
    verse={params.verse ? Number(params.verse) : undefined}
    autoplayKey={autoplayKey}
    onBack={() => router.back()}
    onNavigate={(passage, options) => router.replace({ pathname: '/reader', params: { ...readerParams(passage), ...(options?.autoplay ? { autoplay: '1' } : {}) } })}
  />;
}
