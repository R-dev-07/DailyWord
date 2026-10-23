import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nextChapter, TOTAL_CHAPTERS, type Passage } from './bible';

/**
 * Everything the user actually does, stored on the device. Nothing here is pre-filled:
 * a fresh install has no streak, no completed practice, and no reading history.
 */
export type PracticeItem = 'read' | 'verse' | 'prayer';
export type DayLog = Partial<Record<PracticeItem, boolean>>;
export type Reminder = { enabled: boolean; hour: number; minute: number };

export const START_PASSAGE: Passage = { bookId: 1, chapter: 1, verse: 1 };

/** A verse being memorised, reviewed on a Leitner schedule: the higher the box, the longer until it is due again. */
export type MemoryCard = { id: string; bookId: number; chapter: number; verse: number; box: number; due: string; added: string; reviews: number };
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export type QuizStats = { played: number; answered: number; correct: number; bestPercent: number };

export const memoryId = (passage: Passage) => `${passage.bookId}:${passage.chapter}:${passage.verse}`;

type ProgressState = {
  days: Record<string, DayLog>;
  /** Distinct chapters finished, as `bookId:chapter`. */
  chaptersRead: string[];
  lastRead: Passage | null;
  reminder: Reminder;
  memory: Record<string, MemoryCard>;
  quiz: QuizStats;
  addMemory: (passage: Passage) => boolean;
  removeMemory: (id: string) => void;
  reviewMemory: (id: string, result: ReviewResult) => void;
  recordQuiz: (correct: number, total: number) => void;
  markChapterRead: (bookId: number, chapter: number) => void;
  markPractice: (item: PracticeItem, done?: boolean) => void;
  togglePractice: (item: PracticeItem) => void;
  setLastRead: (passage: Passage) => void;
  setReminder: (patch: Partial<Reminder>) => void;
};

/** Local calendar day as YYYY-MM-DD. */
export const dateKey = (date: Date = new Date()) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const dayNumber = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86400000);
};

const isActive = (log?: DayLog) => !!log && (!!log.read || !!log.verse || !!log.prayer);

export function computeStreak(days: Record<string, DayLog>, today: Date = new Date()) {
  const active = new Set(Object.keys(days).filter((key) => isActive(days[key])).map(dayNumber));
  const todayNumber = dayNumber(dateKey(today));
  let cursor = active.has(todayNumber) ? todayNumber : todayNumber - 1;
  let current = 0;
  while (active.has(cursor)) { current += 1; cursor -= 1; }
  const sorted = [...active].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  sorted.forEach((value, index) => {
    run = index > 0 && value === sorted[index - 1] + 1 ? run + 1 : 1;
    if (run > best) best = run;
  });
  return { current, best };
}

/** Monday-first week containing `today`, with whether each day had any practice. */
export function weekStatus(days: Record<string, DayLog>, today: Date = new Date()) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const todayKey = dateKey(today);
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const key = dateKey(date);
    return { label, key, done: isActive(days[key]), isToday: key === todayKey, isFuture: key > todayKey };
  });
}

/** Where "continue reading" should open: the last place read, or the next chapter if that one is finished. */
export function resumePassage(lastRead: Passage | null, chaptersRead: string[]): Passage {
  if (!lastRead) return START_PASSAGE;
  if (chaptersRead.includes(`${lastRead.bookId}:${lastRead.chapter}`)) return nextChapter(lastRead.bookId, lastRead.chapter) ?? lastRead;
  return lastRead;
}

export const progressPercent = (chaptersRead: string[]) => Math.round((chaptersRead.length / TOTAL_CHAPTERS) * 100);

export const addDays = (key: string, count: number) => {
  const [year, month, day] = key.split('-').map(Number);
  return dateKey(new Date(year, month - 1, day + count));
};

/** Where a card goes after a review: wrong answers drop back to box 0, right ones climb (easy climbs two). */
export function reviewedCard(card: MemoryCard, result: ReviewResult, today = dateKey()): MemoryCard {
  const top = REVIEW_INTERVAL_DAYS.length - 1;
  const box = result === 'again' ? 0 : result === 'hard' ? Math.max(0, card.box - 1) : Math.min(top, card.box + (result === 'easy' ? 2 : 1));
  return { ...card, box, reviews: card.reviews + 1, due: addDays(today, REVIEW_INTERVAL_DAYS[box]) };
}

export const dueCards = (memory: Record<string, MemoryCard>, today = dateKey()) =>
  Object.values(memory).filter((card) => card.due <= today).sort((a, b) => a.box - b.box || a.added.localeCompare(b.added));

const setDay = (days: Record<string, DayLog>, item: PracticeItem, done: boolean) => {
  const key = dateKey();
  return { ...days, [key]: { ...days[key], [item]: done } };
};

export const useProgress = create<ProgressState>()(persist((set) => ({
  days: {},
  chaptersRead: [],
  lastRead: null,
  reminder: { enabled: false, hour: 8, minute: 0 },
  memory: {},
  quiz: { played: 0, answered: 0, correct: 0, bestPercent: 0 },
  addMemory: (passage) => {
    const id = memoryId(passage);
    if (useProgress.getState().memory[id]) return false;
    const today = dateKey();
    set((state) => ({ memory: { ...state.memory, [id]: { id, bookId: passage.bookId, chapter: passage.chapter, verse: passage.verse, box: 0, due: today, added: today, reviews: 0 } } }));
    return true;
  },
  removeMemory: (id) => set((state) => { const memory = { ...state.memory }; delete memory[id]; return { memory }; }),
  reviewMemory: (id, result) => set((state) => {
    const card = state.memory[id];
    if (!card) return state;
    const days = state.days[dateKey()]?.read || state.days[dateKey()]?.verse || state.days[dateKey()]?.prayer ? state.days : setDay(state.days, 'verse', true);
    return { memory: { ...state.memory, [id]: reviewedCard(card, result) }, days };
  }),
  recordQuiz: (correct, total) => set((state) => ({
    quiz: {
      played: state.quiz.played + 1,
      answered: state.quiz.answered + total,
      correct: state.quiz.correct + correct,
      bestPercent: Math.max(state.quiz.bestPercent, total ? Math.round((correct / total) * 100) : 0),
    },
  })),
  markChapterRead: (bookId, chapter) => set((state) => {
    const id = `${bookId}:${chapter}`;
    const alreadyToday = !!state.days[dateKey()]?.read;
    const known = state.chaptersRead.includes(id);
    if (known && alreadyToday) return state;
    return {
      chaptersRead: known ? state.chaptersRead : [...state.chaptersRead, id],
      days: alreadyToday ? state.days : setDay(state.days, 'read', true),
    };
  }),
  markPractice: (item, done = true) => set((state) => (state.days[dateKey()]?.[item] === done ? state : { days: setDay(state.days, item, done) })),
  togglePractice: (item) => set((state) => ({ days: setDay(state.days, item, !state.days[dateKey()]?.[item]) })),
  setLastRead: (lastRead) => set((state) => (state.lastRead && state.lastRead.bookId === lastRead.bookId && state.lastRead.chapter === lastRead.chapter && state.lastRead.verse === lastRead.verse ? state : { lastRead })),
  setReminder: (patch) => set((state) => ({ reminder: { ...state.reminder, ...patch } })),
}), {
  name: 'dailyword-progress',
  storage: createJSONStorage(() => AsyncStorage),
}));
