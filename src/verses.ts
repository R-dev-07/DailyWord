import { getChapterVerses } from './database';

const cache = new Map<string, string | null>();

/**
 * Text of one verse in the given version, falling back to the bundled KJV if that version is not installed
 * or numbers its verses differently. Returns the version that actually supplied the text.
 */
export async function getVerse(bookId: number, chapter: number, verse: number, translationId: string) {
  for (const id of translationId === 'KJV' ? ['KJV'] : [translationId, 'KJV']) {
    const key = `${id}:${bookId}:${chapter}`;
    let chapterKey = key + ':loaded';
    if (!cache.has(chapterKey)) {
      const rows = await getChapterVerses(bookId, chapter, id).catch(() => []);
      rows.forEach((row) => cache.set(`${key}:${row.verse}`, row.text));
      cache.set(chapterKey, null);
    }
    const text = cache.get(`${key}:${verse}`);
    if (text) return { text, translationId: id };
  }
  return null;
}
