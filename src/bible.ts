export type BibleBook = { id: number; name: string; testament: 'Old Testament' | 'New Testament'; chapters: number };

// Canonical book order and chapter counts align with the supplied bundled KJV corpus.
export const bibleBooks: BibleBook[] = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34], ['Joshua', 24], ['Judges', 21], ['Ruth', 4], ['1 Samuel', 31], ['2 Samuel', 24], ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10], ['Nehemiah', 13], ['Esther', 10], ['Job', 42], ['Psalms', 150], ['Proverbs', 31], ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66], ['Jeremiah', 52], ['Lamentations', 5], ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14], ['Joel', 3], ['Amos', 9], ['Obadiah', 1], ['Jonah', 4], ['Micah', 7], ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14], ['Malachi', 4],
  ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28], ['Romans', 16], ['1 Corinthians', 16], ['2 Corinthians', 13], ['Galatians', 6], ['Ephesians', 6], ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5], ['2 Thessalonians', 3], ['1 Timothy', 6], ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1], ['Hebrews', 13], ['James', 5], ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1], ['3 John', 1], ['Jude', 1], ['Revelation', 22],
].map(([name, chapters], index) => ({ id: index + 1, name: name as string, chapters: chapters as number, testament: index < 39 ? 'Old Testament' : 'New Testament' }));

export const testaments = ['Old Testament', 'New Testament'] as const;


export const TOTAL_CHAPTERS = bibleBooks.reduce((sum, book) => sum + book.chapters, 0);

export const bookById = (id: number) => bibleBooks.find((book) => book.id === id) ?? bibleBooks[0];

/** Display label for a book: the Psalms are cited in the singular ("Psalm 23:1"). */
export const bookLabel = (id: number) => (id === 19 ? 'Psalm' : bookById(id).name);

export type Passage = { bookId: number; chapter: number; verse: number };

/** The chapter after the given one, crossing into the next book; null after Revelation. */
export function nextChapter(bookId: number, chapter: number): Passage | null {
  const book = bookById(bookId);
  if (chapter < book.chapters) return { bookId, chapter: chapter + 1, verse: 1 };
  const next = bibleBooks.find((entry) => entry.id === bookId + 1);
  return next ? { bookId: next.id, chapter: 1, verse: 1 } : null;
}

/** The chapter before the given one, crossing into the previous book; null before Genesis 1. */
export function previousChapter(bookId: number, chapter: number): Passage | null {
  if (chapter > 1) return { bookId, chapter: chapter - 1, verse: 1 };
  const previous = bibleBooks.find((entry) => entry.id === bookId - 1);
  return previous ? { bookId: previous.id, chapter: previous.chapters, verse: 1 } : null;
}

/** Route params for opening the reader at a passage. */
export const readerParams = (passage: Passage) => ({ bookId: passage.bookId, bookName: bookById(passage.bookId).name, chapter: passage.chapter, verse: passage.verse });
