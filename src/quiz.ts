import { bibleBooks, bookById, bookLabel, type Passage } from './bible';
import { allTopicPassages, knowledgeBank } from './studyContent';

export type QuizMode = 'mixed' | 'knowledge' | 'book' | 'finish';
export type Question = { id: string; kind: 'knowledge' | 'book' | 'finish'; prompt: string; quote?: string; options: string[]; answer: number; explain: string };
export type VerseFetcher = (passage: Passage) => Promise<{ text: string; translationId: string } | null>;
type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

const withAnswerPlaced = (correct: string, wrong: string[], rng: Rng) => {
  const options = shuffle([correct, ...wrong], rng);
  return { options, answer: options.indexOf(correct) };
};

export function knowledgeQuestions(count: number, rng: Rng = Math.random): Question[] {
  return shuffle(knowledgeBank, rng).slice(0, count).map((item, index) => ({
    id: `knowledge-${index}`, kind: 'knowledge' as const, prompt: item.prompt, explain: item.explain,
    ...withAnswerPlaced(item.answer, [...item.wrong], rng),
  }));
}

export async function bookQuestions(count: number, fetchVerse: VerseFetcher, rng: Rng = Math.random): Promise<Question[]> {
  const questions: Question[] = [];
  for (const passage of shuffle(allTopicPassages(), rng)) {
    if (questions.length >= count) break;
    const found = await fetchVerse(passage);
    if (!found) continue;
    const correct = bookById(passage.bookId);
    const sameTestament = bibleBooks.filter((book) => book.testament === correct.testament && book.id !== correct.id);
    const wrong = shuffle(sameTestament, rng).slice(0, 3).map((book) => book.name);
    questions.push({
      id: `book-${questions.length}`, kind: 'book', prompt: 'Which book of the Bible is this verse from?', quote: found.text,
      explain: `${bookLabel(passage.bookId)} ${passage.chapter}:${passage.verse}`, ...withAnswerPlaced(correct.name, wrong, rng),
    });
  }
  return questions;
}

const coreOf = (word: string) => word.replace(/[^\p{L}]/gu, '');
const matchCase = (word: string, like: string) => (like[0] && like[0] === like[0].toUpperCase() && like[0] !== like[0].toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word);

export async function finishQuestions(count: number, fetchVerse: VerseFetcher, rng: Rng = Math.random): Promise<Question[]> {
  const loaded: Array<{ passage: Passage; text: string }> = [];
  for (const passage of shuffle(allTopicPassages(), rng).slice(0, count * 2 + 6)) {
    const found = await fetchVerse(passage);
    if (found) loaded.push({ passage, text: found.text });
  }
  const wordPool = [...new Set(loaded.flatMap(({ text }) => text.split(/\s+/).map(coreOf).filter((word) => word.length >= 4).map((word) => word.toLowerCase())))];

  const questions: Question[] = [];
  for (const { passage, text } of loaded) {
    if (questions.length >= count) break;
    const words = text.split(/\s+/);
    const candidates = words.map((word, index) => ({ index, core: coreOf(word) })).filter(({ index, core }) => core.length >= 5 && index >= Math.floor(words.length * 0.3));
    if (!candidates.length) continue;
    const target = candidates[Math.floor(rng() * candidates.length)];
    const lower = target.core.toLowerCase();
    const wrong = shuffle(wordPool.filter((word) => word !== lower && Math.abs(word.length - lower.length) <= 2 && !text.toLowerCase().includes(word)), rng).slice(0, 3);
    if (wrong.length < 3) continue;
    const blanked = words.map((word, index) => (index === target.index ? word.replace(target.core, '_____') : word)).join(' ');
    questions.push({
      id: `finish-${questions.length}`, kind: 'finish', prompt: 'Which word completes this verse?', quote: blanked,
      explain: `${bookLabel(passage.bookId)} ${passage.chapter}:${passage.verse} — ${text}`,
      ...withAnswerPlaced(target.core, wrong.map((word) => matchCase(word, target.core)), rng),
    });
  }
  return questions;
}

export async function buildQuiz(mode: QuizMode, count: number, fetchVerse: VerseFetcher, rng: Rng = Math.random): Promise<Question[]> {
  let questions: Question[];
  if (mode === 'knowledge') questions = knowledgeQuestions(count, rng);
  else if (mode === 'book') questions = await bookQuestions(count, fetchVerse, rng);
  else if (mode === 'finish') questions = await finishQuestions(count, fetchVerse, rng);
  else {
    const verseShare = Math.floor(count * 0.3);
    questions = shuffle([...knowledgeQuestions(count - 2 * verseShare, rng), ...(await bookQuestions(verseShare, fetchVerse, rng)), ...(await finishQuestions(verseShare, fetchVerse, rng))], rng);
  }
  // If verse text was unavailable, top up with general questions so a quiz is never empty or short.
  if (questions.length < count) {
    const used = new Set(questions.map((question) => question.prompt));
    questions = [...questions, ...knowledgeQuestions(count + questions.length, rng).filter((question) => !used.has(question.prompt)).slice(0, count - questions.length)];
  }
  return questions.map((question, index) => ({ ...question, id: `${question.kind}-${index}` }));
}
