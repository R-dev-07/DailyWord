import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

type Appearance = 'Dark' | 'Light' | 'Sepia' | 'Ocean';
type SettingsState = {
  appearance: Appearance;
  fontSize: number;
  fontStyle: 'Serif' | 'Sans';
  selectedTranslation: string;
  /** Read-aloud: 1 is the normal speaking rate. */
  speechRate: number;
  speechPitch: number;
  /** Chosen voice identifier per language code (e.g. `{ en: 'en-us-x-tpd-local' }`). Missing = automatic. */
  speechVoices: Record<string, string>;
  /** Keep reading into the next chapter when a chapter finishes. */
  speechAutoContinue: boolean;
  /** Say the verse number before each verse. */
  speechVerseNumbers: boolean;
  /** Say "Genesis, chapter 1" before a chapter starts (English versions only). */
  speechAnnounceChapter: boolean;
  setAppearance: (appearance: Appearance) => void;
  setFontSize: (fontSize: number) => void;
  setFontStyle: (fontStyle: 'Serif' | 'Sans') => void;
  setSelectedTranslation: (translation: string) => void;
  setSpeech: (patch: Partial<Pick<SettingsState, 'speechRate' | 'speechPitch' | 'speechAutoContinue' | 'speechVerseNumbers' | 'speechAnnounceChapter'>>) => void;
  setSpeechVoice: (language: string, voiceId: string | null) => void;
};

export const useSettings = create<SettingsState>()(persist((set) => ({
    appearance: 'Dark',
    fontSize: 20,
    fontStyle: 'Serif',
    selectedTranslation: 'KJV',
    speechRate: 0.9,
    speechPitch: 1,
    speechVoices: {},
    speechAutoContinue: true,
    speechVerseNumbers: false,
    speechAnnounceChapter: true,
    setAppearance: (appearance) => set({ appearance }),
    setFontSize: (fontSize) => set({ fontSize }),
    setFontStyle: (fontStyle) => set({ fontStyle }),
    setSelectedTranslation: (selectedTranslation) => set({ selectedTranslation }),
    setSpeech: (patch) => set(patch),
    setSpeechVoice: (language, voiceId) => set((state) => {
      const speechVoices = { ...state.speechVoices };
      if (voiceId) speechVoices[language] = voiceId; else delete speechVoices[language];
      return { speechVoices };
    }),
  }), {
    name: 'dailyword-settings',
    storage: createJSONStorage(() => AsyncStorage),
  }));
