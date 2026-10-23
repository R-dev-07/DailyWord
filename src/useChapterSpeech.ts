import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { useSettings } from './store';
import { cleanForSpeech, pickVoice, speechLanguage, SPEED_STEPS } from './speech';

export type SpeechStatus = 'idle' | 'playing' | 'paused';
export type SpeechLine = { verse: number; text: string };

type Options = {
  lines: SpeechLine[];
  /** Spoken before verse 1 of a chapter, e.g. "Genesis, chapter 1". */
  heading: string;
  translationId: string;
  /** Changing this (e.g. a new chapter) stops any playback. */
  resetKey: string;
  /** The whole chapter was read to the end. */
  onFinished?: () => void;
  onFailed?: (message: string) => void;
};

// Only one screen may speak at a time. A screen that starts speaking pre-empts the others,
// and a screen that unmounts only silences the device if it is the one currently speaking.
let nextOwnerId = 1;
let activeOwner = 0;
const preemptors = new Map<number, () => void>();

/**
 * Read a chapter aloud, verse by verse.
 *
 * - The whole chapter is queued with the system engine, so playback is continuous (no gaps between verses).
 * - `onStart` of each verse reports which verse is being read, so the UI can highlight and scroll to it.
 * - iOS can pause and resume natively. Android's engine cannot, so there pausing stops and resuming restarts the current verse.
 * - Every callback is tied to a "run" number; callbacks from a run that was stopped, skipped or replaced are ignored.
 */
export function useChapterSpeech(options: Options) {
  const speechRate = useSettings((state) => state.speechRate);
  const speechPitch = useSettings((state) => state.speechPitch);
  const speechVoices = useSettings((state) => state.speechVoices);
  const announceChapter = useSettings((state) => state.speechAnnounceChapter);
  const verseNumbers = useSettings((state) => state.speechVerseNumbers);
  const setSpeech = useSettings((state) => state.setSpeech);

  const [ownerId] = useState(() => nextOwnerId++);
  const [status, setStatusState] = useState<SpeechStatus>('idle');
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const settingsRef = useRef({ speechRate, speechPitch, speechVoices, announceChapter, verseNumbers });
  settingsRef.current = { speechRate, speechPitch, speechVoices, announceChapter, verseNumbers };

  const runRef = useRef(0);
  const indexRef = useRef(0);
  const statusRef = useRef<SpeechStatus>('idle');
  const nativePausedRef = useRef(false);
  // True from the moment playback is requested until the chapter has been handed to the speech engine.
  const settingUpRef = useRef(false);

  const setStatus = useCallback((next: SpeechStatus) => { statusRef.current = next; setStatusState(next); }, []);

  const finish = useCallback((run: number) => {
    if (runRef.current !== run) return;
    runRef.current += 1;
    setStatus('idle');
    setCurrentVerse(null);
    optionsRef.current.onFinished?.();
  }, [setStatus]);

  const begin = useCallback(async (fromIndex: number, rateOverride?: number) => {
    const { lines, heading, translationId } = optionsRef.current;
    if (!lines.length) return;
    const first = Math.min(Math.max(fromIndex, 0), lines.length - 1);
    const run = ++runRef.current;

    settingUpRef.current = true;
    activeOwner = ownerId;
    preemptors.forEach((preempt, id) => { if (id !== ownerId) preempt(); });
    nativePausedRef.current = false;
    indexRef.current = first;
    setStatus('playing');
    setCurrentVerse(lines[first].verse);

    await Speech.stop().catch(() => undefined);
    if (runRef.current !== run) return;
    const language = speechLanguage(translationId);
    const settings = settingsRef.current;
    const voice = await pickVoice(language, settings.speechVoices[language]);
    if (runRef.current !== run) return;

    const phrases = lines.map((line, index) => {
      const spoken = cleanForSpeech(line.text);
      if (!spoken) return '';
      const intro = index === 0 && settings.announceChapter && language === 'en' ? `${heading}. ` : '';
      return `${intro}${settings.verseNumbers ? `${line.verse}. ` : ''}${spoken}`;
    });
    let last = -1;
    phrases.forEach((phrase, index) => { if (phrase) last = index; });
    if (last < first) { settingUpRef.current = false; finish(run); return; }

    let failed = false;
    const fail = (error: Error) => {
      if (failed || runRef.current !== run) return;
      failed = true;
      runRef.current += 1;
      void Speech.stop();
      setStatus('idle');
      setCurrentVerse(null);
      optionsRef.current.onFailed?.(error?.message || 'Text-to-speech is not available on this device.');
    };

    settingUpRef.current = false;
    for (let index = first; index <= last; index += 1) {
      if (!phrases[index]) continue;
      Speech.speak(phrases[index], {
        language,
        voice,
        rate: rateOverride ?? settings.speechRate,
        pitch: settings.speechPitch,
        onStart: () => {
          if (runRef.current !== run) return;
          indexRef.current = index;
          setCurrentVerse(lines[index].verse);
        },
        onDone: () => { if (index === last) finish(run); },
        onError: fail,
      });
    }
  }, [finish, ownerId, setStatus]);

  const start = useCallback((fromVerse?: number) => {
    const { lines } = optionsRef.current;
    if (!lines.length) return false;
    const index = fromVerse ? lines.findIndex((line) => line.verse >= fromVerse) : 0;
    void begin(index < 0 ? 0 : index);
    return true;
  }, [begin]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    // iOS can pause mid-sentence, but only once speech has actually been queued.
    if (Platform.OS === 'ios' && !settingUpRef.current) {
      nativePausedRef.current = true;
      setStatus('paused');
      void Speech.pause();
    } else {
      runRef.current += 1; // ignore callbacks from the utterances we are about to cancel
      void Speech.stop();
      setStatus('paused');
    }
  }, [setStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    if (nativePausedRef.current) {
      nativePausedRef.current = false;
      setStatus('playing');
      void Speech.resume();
    } else {
      void begin(indexRef.current);
    }
  }, [begin, setStatus]);

  const stop = useCallback(() => {
    runRef.current += 1;
    nativePausedRef.current = false;
    settingUpRef.current = false;
    if (activeOwner === ownerId) void Speech.stop();
    setStatus('idle');
    setCurrentVerse(null);
  }, [ownerId, setStatus]);

  /** Jump to the next (+1) or previous (-1) verse and keep playing. */
  const skip = useCallback((delta: 1 | -1) => {
    const { lines } = optionsRef.current;
    const target = indexRef.current + delta;
    if (target >= lines.length) { runRef.current += 1; void Speech.stop(); finish(runRef.current); return; }
    void begin(Math.max(0, target));
  }, [begin, finish]);

  const toggle = useCallback((fromVerse?: number) => {
    if (statusRef.current === 'playing') pause();
    else if (statusRef.current === 'paused') resume();
    else start(fromVerse);
  }, [pause, resume, start]);

  /** Step to the next speaking speed; if something is being read, carry on from the current verse at the new speed. */
  const cycleSpeed = useCallback(() => {
    const current = settingsRef.current.speechRate;
    const next = SPEED_STEPS.find((step) => step > current + 0.001) ?? SPEED_STEPS[0];
    setSpeech({ speechRate: next });
    if (statusRef.current === 'playing') void begin(indexRef.current, next);
    return next;
  }, [begin, setSpeech]);

  useEffect(() => {
    preemptors.set(ownerId, () => {
      runRef.current += 1;
      nativePausedRef.current = false;
      setStatus('idle');
      setCurrentVerse(null);
    });
    return () => {
      preemptors.delete(ownerId);
      runRef.current += 1;
      if (activeOwner === ownerId) { activeOwner = 0; void Speech.stop(); }
    };
  }, [ownerId, setStatus]);

  useEffect(() => { stop(); }, [options.resetKey, stop]);

  return { status, currentVerse, start, toggle, pause, resume, stop, skip, cycleSpeed };
}

/** Silence the device and reset every screen's playback state (used before previewing a voice). */
export function stopAllChapterSpeech() {
  preemptors.forEach((preempt) => preempt());
  activeOwner = 0;
  return Speech.stop();
}
