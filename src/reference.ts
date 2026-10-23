import { bibleBooks } from './bible';

/** "John 3:16", "ps 23", "1 cor 13" and similar become a direct link to that passage. */
export function parseReference(input: string) {
  const match = input.trim().toLowerCase().replace(/([a-z])\./g, '$1').match(/^((?:[1-3]\s*)?[a-z][a-z\s]*?)\s*(\d+)(?:\s*[:.]\s*(\d+))?$/);
  if (!match) return null;
  const name = match[1].replace(/\s+/g, '');
  const books = bibleBooks.filter((book) => book.name.toLowerCase().replace(/\s+/g, '').startsWith(name));
  const book = bibleBooks.find((entry) => entry.name.toLowerCase().replace(/\s+/g, '') === name) ?? (name.length >= 2 ? books[0] : undefined);
  const chapter = Number(match[2]);
  if (!book || chapter < 1 || chapter > book.chapters) return null;
  return { bookId: book.id, chapter, verse: match[3] ? Number(match[3]) : 1 };
}

