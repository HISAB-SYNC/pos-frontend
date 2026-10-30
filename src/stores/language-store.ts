import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "am";

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
    { name: "andalus-language" },
  ),
);
