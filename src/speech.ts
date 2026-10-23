import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Language code used to pick a text-to-speech voice for a Bible version.
 * Catalog ids look like `pt_nvi` (language first); the bundled KJV is English.
 * Android's engine only understands the bare language code, so we never pass a region.
 */
export const speechLanguage = (translationId: string) => (translationId === 'KJV' ? 'en' : translationId.split('_')[0].toLowerCase());

/** Make verse text sound natural: no stray spaces before punctuation, small-caps LORD read as a word. */
export function cleanForSpeech(text: string) {
  const cleaned = text
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\bLORD\b/g, 'Lord')
    .replace(/\s+/g, ' ')
    .trim();
  return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned.slice(0, Speech.maxSpeechInputLength) : '';
}

let voicesPromise: Promise<Speech.Voice[]> | null = null;

/** Installed system voices. An empty answer is not cached, because Android can report none while its engine is still starting. */
export function loadVoices(): Promise<Speech.Voice[]> {
  if (!voicesPromise) {
    voicesPromise = Speech.getAvailableVoicesAsync().then((voices) => {
      if (!voices.length) voicesPromise = null;
      return voices;
    }).catch(() => { voicesPromise = null; return [] as Speech.Voice[]; });
  }
  return voicesPromise;
}

const languageOf = (voice: Speech.Voice) => voice.language.toLowerCase().replace('_', '-').split('-')[0];

export function voicesForLanguage(voices: Speech.Voice[], language: string) {
  return voices
    .filter((voice) => languageOf(voice) === language)
    .sort((a, b) => Number(b.quality === Speech.VoiceQuality.Enhanced) - Number(a.quality === Speech.VoiceQuality.Enhanced) || a.name.localeCompare(b.name));
}

/**
 * The voice to use: the user's choice if it is still installed; otherwise on iOS an enhanced voice when one is
 * downloaded; otherwise undefined so the system picks its default voice for the language.
 */
export async function pickVoice(language: string, savedId?: string) {
  const forLanguage = voicesForLanguage(await loadVoices(), language);
  const saved = savedId ? forLanguage.find((voice) => voice.identifier === savedId) : undefined;
  if (saved) return saved.identifier;
  if (Platform.OS === 'ios') return forLanguage.find((voice) => voice.quality === Speech.VoiceQuality.Enhanced)?.identifier;
  return undefined;
}

export const SPEED_STEPS = [0.7, 0.85, 1, 1.15, 1.3] as const;
export const formatSpeed = (rate: number) => `${Number(rate.toFixed(2))}×`;
