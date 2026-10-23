import type * as SQLite from 'expo-sqlite';
import { bibleBooks } from './bible';

export type VerseRecord = { bookId: number; chapter: number; verse: number; text: string };
export type TranslationPack = {
  id: string;
  name: string;
  kind: 'translation' | 'paraphrase';
  expectedVerseCount: number;
  verses: VerseRecord[];
};

/** Validate and install a local text pack. Paraphrases must match every KJV reference exactly. */
export async function importTranslationPack(db: SQLite.SQLiteDatabase, pack: TranslationPack) {
  if (!pack.id.trim() || !pack.name.trim() || pack.verses.length === 0) throw new Error('The content pack is missing required metadata or verses.');
  if (!Number.isInteger(pack.expectedVerseCount) || pack.verses.length !== pack.expectedVerseCount) {
    throw new Error(`Expected ${pack.expectedVerseCount} verse records, received ${pack.verses.length}.`);
  }
  const bookById = new Map(bibleBooks.map((book) => [book.id, book]));
  const seen = new Set<string>();
  for (const verse of pack.verses) {
    const book = bookById.get(verse.bookId);
    if (!book || !Number.isInteger(verse.chapter) || verse.chapter < 1 || verse.chapter > book.chapters || !Number.isInteger(verse.verse) || verse.verse < 1 || !verse.text.trim()) {
      throw new Error(`Invalid verse record: ${verse.bookId}:${verse.chapter}:${verse.verse}`);
    }
    const key = `${verse.bookId}:${verse.chapter}:${verse.verse}`;
    if (seen.has(key)) throw new Error(`Duplicate verse reference: ${key}`);
    seen.add(key);
  }

  if (pack.kind === 'paraphrase') {
    const kjv = await db.getAllAsync<{ book_id: number; chapter: number; verse: number }>(
      "SELECT book_id, chapter, verse FROM verses WHERE translation_id = 'KJV'",
    );
    const kjvKeys = new Set(kjv.map(({ book_id, chapter, verse }) => `${book_id}:${chapter}:${verse}`));
    if (kjvKeys.size === 0) throw new Error('Import the verified KJV base text before importing paraphrase content.');
    if (kjvKeys.size !== seen.size || [...kjvKeys].some((key) => !seen.has(key))) {
      throw new Error('The paraphrase must contain exactly one verse for every KJV reference, with no missing or extra verses.');
    }
  }

  if (pack.id === 'KJV') {
    for (const book of bibleBooks) {
      for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
        if (!seen.has(`${book.id}:${chapter}:1`)) throw new Error(`KJV pack is missing ${book.name} ${chapter}:1.`);
      }
    }
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT OR REPLACE INTO translations (id, name, kind) VALUES (?, ?, ?)', pack.id, pack.name, pack.kind);
    await db.runAsync('DELETE FROM verses WHERE translation_id = ?', pack.id);
    for (const verse of pack.verses) {
      await db.runAsync(
        'INSERT INTO verses (translation_id, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)',
        pack.id, verse.bookId, verse.chapter, verse.verse, verse.text,
      );
    }
  });
}
