import * as SQLite from 'expo-sqlite';
import { bibleBooks } from './bible';
import type { ParsedVerse } from './upstreamBible';
import kjvJson from '../assets/content/en_kjv.json';

let database: SQLite.SQLiteDatabase | undefined;
let databaseInitialization: Promise<SQLite.SQLiteDatabase> | undefined;

type BundledBook = { chapters: string[][] };
const BUNDLED_KJV = kjvJson as BundledBook[];
const BUNDLED_KJV_VERSE_COUNT = 31102;

async function initializeDatabaseInternal() {
  database = await SQLite.openDatabaseAsync('dailyword.db');
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS translations (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, name TEXT NOT NULL, testament TEXT NOT NULL, chapters INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS verses (translation_id TEXT NOT NULL, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL, PRIMARY KEY (translation_id, book_id, chapter, verse));
    CREATE TABLE IF NOT EXISTS bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS highlights (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, color TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  await database.runAsync('INSERT OR IGNORE INTO translations (id, name, kind) VALUES (?, ?, ?)', 'KJV', 'King James Version', 'translation');
  await database.runAsync('INSERT OR IGNORE INTO translations (id, name, kind) VALUES (?, ?, ?)', 'MODERN_MEDIUM', 'Modern (Medium)', 'paraphrase');
  for (const book of bibleBooks) {
    await database.runAsync('INSERT OR IGNORE INTO books (id, name, testament, chapters) VALUES (?, ?, ?, ?)', book.id, book.name, book.testament, book.chapters);
  }
  const existingCount = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM verses WHERE translation_id = 'KJV'",
  );
  const importMarker = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'bundled_kjv_version'",
  );
  if (existingCount?.count !== BUNDLED_KJV_VERSE_COUNT || importMarker?.value !== 'en_kjv_v1') {
    if (BUNDLED_KJV.length !== bibleBooks.length) throw new Error('Bundled KJV must contain all 66 canonical books.');
    let actualCount = 0;
    for (let bookIndex = 0; bookIndex < bibleBooks.length; bookIndex += 1) {
      if (BUNDLED_KJV[bookIndex].chapters.length !== bibleBooks[bookIndex].chapters) {
        throw new Error(`Bundled KJV chapter count mismatch for ${bibleBooks[bookIndex].name}.`);
      }
      actualCount += BUNDLED_KJV[bookIndex].chapters.reduce((count, verses) => count + verses.length, 0);
    }
    if (actualCount !== BUNDLED_KJV_VERSE_COUNT) throw new Error(`Bundled KJV contains ${actualCount} verses; expected ${BUNDLED_KJV_VERSE_COUNT}.`);

    await database.withTransactionAsync(async () => {
      await database!.runAsync("DELETE FROM verses WHERE translation_id = 'KJV'");
      const batchSize = 150;
      const rows: Array<{ bookId: number; chapter: number; verse: number; text: string }> = [];
      for (let bookIndex = 0; bookIndex < bibleBooks.length; bookIndex += 1) {
        const bookChapters = BUNDLED_KJV[bookIndex].chapters;
        for (let chapterIndex = 0; chapterIndex < bookChapters.length; chapterIndex += 1) {
          for (let verseIndex = 0; verseIndex < bookChapters[chapterIndex].length; verseIndex += 1) {
            const text = bookChapters[chapterIndex][verseIndex];
            if (!text.trim()) throw new Error(`Empty KJV text at ${bibleBooks[bookIndex].name} ${chapterIndex + 1}:${verseIndex + 1}.`);
            rows.push({ bookId: bibleBooks[bookIndex].id, chapter: chapterIndex + 1, verse: verseIndex + 1, text });
          }
        }
      }
      for (let offset = 0; offset < rows.length; offset += batchSize) {
        const batch = rows.slice(offset, offset + batchSize);
        const values = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const params = batch.flatMap((row) => ['KJV', row.bookId, row.chapter, row.verse, row.text]);
        await database!.runAsync(
          `INSERT INTO verses (translation_id, book_id, chapter, verse, text) VALUES ${values}`,
          params,
        );
      }
      await database!.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('bundled_kjv_version', 'en_kjv_v1')");
    });
  }
  // Installed-version marker: downloaded versions add their own `installed:<id>` row when they finish.
  await database.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('installed:KJV', ?)", String(BUNDLED_KJV_VERSE_COUNT));
  return database;
}

export function initializeDatabase() {
  if (!databaseInitialization) {
    databaseInitialization = initializeDatabaseInternal().catch((error: unknown) => {
      database = undefined;
      databaseInitialization = undefined;
      throw error;
    });
  }
  return databaseInitialization;
}

export async function getChapterVerses(bookId: number, chapter: number, translationId = 'KJV') {
  const db = await initializeDatabase();
  if (!db) return [];
  return db.getAllAsync<{ verse: number; text: string }>(
    'SELECT verse, text FROM verses WHERE translation_id = ? AND book_id = ? AND chapter = ? ORDER BY verse',
    translationId, bookId, chapter,
  );
}

export async function saveBookmark(bookId: number, chapter: number, verse: number) {
  const db = await initializeDatabase();
  if (!db) return;
  await db.runAsync('INSERT INTO bookmarks (book_id, chapter, verse) VALUES (?, ?, ?)', bookId, chapter, verse);
}

export async function saveNote(bookId: number, chapter: number, verse: number, body: string) {
  const db = await initializeDatabase();
  if (!db) return;
  await db.runAsync('INSERT INTO notes (book_id, chapter, verse, body) VALUES (?, ?, ?, ?)', bookId, chapter, verse, body);
}

export async function getStudyItems(kind: 'Bookmarks' | 'Notes' | 'Highlights', translationId = 'KJV') {
  const db = await initializeDatabase();
  if (!db) return [];
  if (kind === 'Bookmarks') return db.getAllAsync<{ id: number; book_id: number; chapter: number; verse: number; body: string }>(
    `SELECT bookmarks.id, bookmarks.book_id, bookmarks.chapter, bookmarks.verse,
      COALESCE(verses.text, '') AS body FROM bookmarks
      LEFT JOIN verses ON verses.book_id = bookmarks.book_id AND verses.chapter = bookmarks.chapter
        AND verses.verse = bookmarks.verse AND verses.translation_id = ?
      ORDER BY bookmarks.created_at DESC`,
    translationId,
  );
  if (kind === 'Notes') return db.getAllAsync<{ id: number; book_id: number; chapter: number; verse: number; body: string }>(
    'SELECT id, book_id, chapter, verse, body FROM notes ORDER BY created_at DESC',
  );
  return db.getAllAsync<{ id: number; book_id: number; chapter: number; verse: number; body: string; color: string }>(
    `SELECT highlights.id, highlights.book_id, highlights.chapter, highlights.verse, highlights.color AS color,
      COALESCE(verses.text, '') AS body FROM highlights
      LEFT JOIN verses ON verses.book_id = highlights.book_id AND verses.chapter = highlights.chapter
        AND verses.verse = highlights.verse AND verses.translation_id = ?
      ORDER BY highlights.created_at DESC`,
    translationId,
  );
}

export async function searchVerses(query: string, translationId = 'KJV') {
  const db = await initializeDatabase();
  const trimmed = query.trim();
  if (!db || !trimmed) return [];
  return db.getAllAsync<{ book_id: number; chapter: number; verse: number; text: string }>(
    'SELECT book_id, chapter, verse, text FROM verses WHERE translation_id = ? AND text LIKE ? ORDER BY book_id, chapter, verse LIMIT 100',
    translationId, `%${trimmed}%`,
  );
}

/** Ids of every translation whose text is fully installed on this device (KJV is always one). */
export async function getInstalledTranslationIds() {
  const db = await initializeDatabase();
  if (!db) return [] as string[];
  const rows = await db.getAllAsync<{ key: string }>("SELECT key FROM settings WHERE key LIKE 'installed:%'");
  return rows.map((row) => row.key.slice('installed:'.length));
}

/**
 * Replace a translation's text with freshly downloaded verses. Runs in an exclusive transaction on its own
 * connection, so reading keeps working while a large version installs, and the `installed:` marker is only
 * written if every row went in (a failed or interrupted install leaves nothing half-installed).
 */
export async function installTranslationRows(
  translationId: string,
  name: string,
  rows: ParsedVerse[],
  onProgress?: (done: number, total: number) => void,
) {
  const db = await initializeDatabase();
  if (!db) throw new Error('Local storage is unavailable on this platform.');
  const batchSize = 150;
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('INSERT OR REPLACE INTO translations (id, name, kind) VALUES (?, ?, ?)', translationId, name, 'translation');
    await txn.runAsync('DELETE FROM verses WHERE translation_id = ?', translationId);
    for (let offset = 0; offset < rows.length; offset += batchSize) {
      const batch = rows.slice(offset, offset + batchSize);
      const values = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const params = batch.flatMap((row) => [translationId, row.bookId, row.chapter, row.verse, row.text]);
      await txn.runAsync(`INSERT INTO verses (translation_id, book_id, chapter, verse, text) VALUES ${values}`, params);
      onProgress?.(Math.min(offset + batch.length, rows.length), rows.length);
    }
    await txn.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', `installed:${translationId}`, String(rows.length));
  });
}

/** Remove a downloaded translation. The bundled KJV can never be removed. */
export async function removeTranslation(translationId: string) {
  if (translationId === 'KJV') throw new Error('The bundled King James Version cannot be removed.');
  const db = await initializeDatabase();
  if (!db) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM verses WHERE translation_id = ?', translationId);
    await txn.runAsync('DELETE FROM translations WHERE id = ?', translationId);
    await txn.runAsync('DELETE FROM settings WHERE key = ?', `installed:${translationId}`);
  });
}

export async function getBookmarkedVerses() {
  const db = await initializeDatabase();
  if (!db) return [] as Array<{ book_id: number; chapter: number; verse: number }>;
  return db.getAllAsync<{ book_id: number; chapter: number; verse: number }>('SELECT DISTINCT book_id, chapter, verse FROM bookmarks ORDER BY created_at DESC');
}

export async function deleteStudyItem(kind: 'Bookmarks' | 'Notes' | 'Highlights', id: number) {
  const db = await initializeDatabase();
  if (!db) return;
  const table = kind === 'Bookmarks' ? 'bookmarks' : kind === 'Notes' ? 'notes' : 'highlights';
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
}

/** Highlight a verse in one of the palette colours, replacing any earlier highlight on that verse. */
export async function saveHighlight(bookId: number, chapter: number, verse: number, color: string) {
  const db = await initializeDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM highlights WHERE book_id = ? AND chapter = ? AND verse = ?', bookId, chapter, verse);
  await db.runAsync('INSERT INTO highlights (book_id, chapter, verse, color) VALUES (?, ?, ?, ?)', bookId, chapter, verse, color);
}

export async function removeHighlight(bookId: number, chapter: number, verse: number) {
  const db = await initializeDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM highlights WHERE book_id = ? AND chapter = ? AND verse = ?', bookId, chapter, verse);
}

export async function getChapterHighlights(bookId: number, chapter: number) {
  const db = await initializeDatabase();
  const colors: Record<number, string> = {};
  if (!db) return colors;
  const rows = await db.getAllAsync<{ verse: number; color: string }>('SELECT verse, color FROM highlights WHERE book_id = ? AND chapter = ?', bookId, chapter);
  rows.forEach((row) => { colors[row.verse] = row.color; });
  return colors;
}
