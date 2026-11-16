import type { Area } from "./types";

/**
 * GLOSSARY: keep these words the same everywhere so the app reads consistently.
 * English | Amharic | Afaan Oromo
 *   Sale / sales        | ሽያጭ                | Gurgurtaa
 *   Product / item      | ምርት / እቃ            | Meeshaa
 *   Stock / inventory   | ክምችት               | Kuusaa
 *   Restock             | እቃ መሙላት / ግዢ        | Meeshaa guuti / Bitannaa
 *   Customer            | ደንበኛ               | Maamila
 *   Supplier            | አቅራቢ               | Dhiyeessaa
 *   Debt / credit       | ዕዳ / ብድር            | Liqii
 *   Expense             | ወጪ                 | Baasii
 *   Report              | ሪፖርት               | Gabaasa
 *   Cash Till           | ካዝና                | Kaashii
 *   Bank                | ባንክ                | Baankii
 *   Money / funds       | ገንዘብ               | Maallaqa
 *   Currency (ETB)      | ብር                 | Birrii
 * Amharic and Afaan Oromo wording should be reviewed by a native speaker.
 */
const en = {
  // Language switch
  "language.label": "Language",
  "language.en": "EN",
  "language.am": "አማ",
  "language.om": "OM",

  // Errors
  "error.couldNotLoad": "Couldn't load {what}",
  "error.tryAgain": "Try again",
} as const;

export const common: Area<typeof en> = {
  en,
  am: {
    "language.label": "ቋንቋ",
    "language.en": "EN",
    "language.am": "አማ",
    "language.om": "OM",
    "error.couldNotLoad": "{what} መጫን አልተቻለም",
    "error.tryAgain": "እንደገና ሞክር",
  },
  om: {
    "language.label": "Afaan",
    "language.en": "EN",
    "language.am": "አማ",
    "language.om": "OM",
    "error.couldNotLoad": "{what} fe'uun hin danda'amne",
    "error.tryAgain": "Irra deebi'ii yaali",
  },
};
