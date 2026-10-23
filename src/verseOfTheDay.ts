import { bookLabel, type Passage } from './bible';

// A fixed rotation of well-known passages; the day of the year picks one. Text is read from the installed Bible.
const PASSAGES: Passage[] = [
  [19, 23, 1], [43, 3, 16], [45, 8, 28], [50, 4, 13], [20, 3, 5], [23, 41, 10], [24, 29, 11], [6, 1, 9],
  [40, 11, 28], [19, 46, 10], [25, 3, 23], [48, 2, 20], [49, 2, 8], [58, 11, 1], [46, 13, 13], [19, 119, 105],
  [40, 6, 33], [45, 12, 2], [55, 1, 7], [19, 27, 1], [23, 40, 31], [33, 6, 8], [40, 5, 16], [43, 14, 6],
  [19, 121, 1], [60, 5, 7], [45, 5, 8], [19, 37, 4], [51, 3, 23], [59, 1, 5], [19, 34, 8],
].map(([bookId, chapter, verse]) => ({ bookId, chapter, verse }));

export function verseOfTheDay(date: Date = new Date()): Passage {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return PASSAGES[dayNumber % PASSAGES.length];
}

export const passageLabel = ({ bookId, chapter, verse }: Passage) => `${bookLabel(bookId)} ${chapter}:${verse}`;
