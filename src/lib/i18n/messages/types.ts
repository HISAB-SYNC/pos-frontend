/** The three interface languages. */
export type Language = "en" | "am" | "om";

/**
 * One area's text. English is the source of truth and defines the keys; Amharic
 * (am) and Afaan Oromo (om) must use the same keys. A key missing from am or om
 * falls back to English, so `npm run i18n:check` lists what is still untranslated.
 */
export type Area<E extends Record<string, string>> = {
  en: E;
  am: Partial<Record<keyof E, string>>;
  om: Partial<Record<keyof E, string>>;
};
