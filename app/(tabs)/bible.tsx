import { useState } from 'react';
import { START_PASSAGE } from '@/src/progress';
import { ChapterView } from '@/src/ChapterView';
import type { Passage } from '@/src/bible';

/** The Bible always opens at the very beginning: Genesis 1:1. */
export default function BibleScreen() {
  const [passage, setPassage] = useState<Passage>(START_PASSAGE);
  const [autoplayKey, setAutoplayKey] = useState(0);
  return <ChapterView
    bookId={passage.bookId}
    chapter={passage.chapter}
    autoplayKey={autoplayKey}
    onNavigate={(next, options) => { setPassage(next); if (options?.autoplay) setAutoplayKey((key) => key + 1); }}
  />;
}
