import { bibleBooks } from './bible';

export type ParsedVerse = { bookId: number; chapter: number; verse: number; text: string };

/**
 * Book keys used by the thiagobodruk/bible JSON files. Almost every file uses the Portuguese-style
 * keys in STANDARD_KEYS; `en_bbe` and `fr_apee` use the English-style keys in ENGLISH_KEYS instead.
 * Both lists are in canonical order, so index + 1 is the book id used in src/bible.ts.
 */
const STANDARD_KEYS = [
  'gn', 'ex', 'lv', 'nm', 'dt', 'js', 'jz', 'rt', '1sm', '2sm', '1rs', '2rs', '1cr', '2cr', 'ed', 'ne', 'et', 'jó', 'sl', 'pv', 'ec', 'ct', 'is', 'jr', 'lm', 'ez', 'dn', 'os', 'jl', 'am', 'ob', 'jn', 'mq', 'na', 'hc', 'sf', 'ag', 'zc', 'ml',
  'mt', 'mc', 'lc', 'jo', 'atos', 'rm', '1co', '2co', 'gl', 'ef', 'fp', 'cl', '1ts', '2ts', '1tm', '2tm', 'tt', 'fm', 'hb', 'tg', '1pe', '2pe', '1jo', '2jo', '3jo', 'jd', 'ap',
];
const ENGLISH_KEYS = [
  'gn', 'ex', 'lv', 'nm', 'dt', 'js', 'jud', 'rt', '1sm', '2sm', '1kgs', '2kgs', '1ch', '2ch', 'ezr', 'ne', 'et', 'job', 'ps', 'prv', 'ec', 'so', 'is', 'jr', 'lm', 'ez', 'dn', 'ho', 'jl', 'am', 'ob', 'jn', 'mi', 'na', 'hk', 'zp', 'hg', 'zc', 'ml',
  'mt', 'mk', 'lk', 'jo', 'act', 'rm', '1co', '2co', 'gl', 'eph', 'ph', 'cl', '1ts', '2ts', '1tm', '2tm', 'tt', 'phm', 'hb', 'jm', '1pe', '2pe', '1jo', '2jo', '3jo', 'jd', 're',
];

const bookIdByKey = new Map<string, number>();
[STANDARD_KEYS, ENGLISH_KEYS].forEach((keys) => keys.forEach((key, index) => bookIdByKey.set(key, index + 1)));

/**
 * Convert one upstream file into verse rows. Unlike the strict bundled-KJV import, this accepts partial
 * Bibles (New-Testament-only, Old-Testament-only, 64-book editions) and editions whose chapter numbering
 * differs from the KJV (for example Malachi with 3 chapters). It still rejects anything malformed.
 */
export function parseUpstreamBible(raw: string): ParsedVerse[] {
  const json = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new Error('The download was incomplete or not a Bible text. Please try again.'); }
  if (!Array.isArray(data) || data.length === 0) throw new Error('The downloaded file is not a Bible text.');

  const rows: ParsedVerse[] = [];
  let previousBookId = 0;
  for (const entry of data as Array<{ abbrev?: unknown; chapters?: unknown }>) {
    const key = String(entry?.abbrev ?? '').toLowerCase();
    const bookId = bookIdByKey.get(key);
    if (!bookId) throw new Error(`Unrecognized book "${key}" in the downloaded file.`);
    if (bookId <= previousBookId) throw new Error(`Book "${key}" is duplicated or out of order.`);
    previousBookId = bookId;

    const chapters = entry.chapters;
    const book = bibleBooks[bookId - 1];
    if (!Array.isArray(chapters) || chapters.length === 0 || chapters.length > book.chapters) {
      throw new Error(`${book.name} has an invalid chapter list.`);
    }
    chapters.forEach((verses: unknown, chapterIndex: number) => {
      if (!Array.isArray(verses)) throw new Error(`${book.name} ${chapterIndex + 1} is malformed.`);
      verses.forEach((text: unknown, verseIndex: number) => {
        if (typeof text !== 'string') throw new Error(`${book.name} ${chapterIndex + 1}:${verseIndex + 1} is malformed.`);
        const trimmed = text.trim();
        // Verse numbers come from position, so a blank verse is skipped rather than renumbering the rest.
        if (trimmed) rows.push({ bookId, chapter: chapterIndex + 1, verse: verseIndex + 1, text: trimmed });
      });
    });
  }
  if (rows.length === 0) throw new Error('The downloaded file contains no verses.');
  return rows;
}
