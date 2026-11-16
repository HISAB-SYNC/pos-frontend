import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Language } from "@/lib/i18n/messages/types";

export type { Language };

export const LANGUAGES: readonly Language[] = ["en", "am", "om"];

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

/** The interface language, remembered on this device. */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "andalus-language",
      // An unknown saved value (for example from an older version) falls back to English.
      merge: (saved, current) => {
        const language = (saved as Partial<LanguageState> | undefined)?.language;
        return { ...current, language: language && LANGUAGES.includes(language) ? language : current.language };
      },
    },
  ),
);
