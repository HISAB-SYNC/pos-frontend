/**
 * Interface text in English, Amharic and Afaan Oromo, one file per area.
 *
 * To add text: put the English in the area's `en` object, then add the Amharic
 * and Afaan Oromo under the same key. A key missing in a language falls back to
 * English. Run `npm run i18n:check` to list what is missing and
 * `npm run i18n:export` to hand the text to a reviewer. To add an area, create
 * its file and add it to `areas` below.
 */
import { common } from "./common";
import { dashboard } from "./dashboard";
import { nav } from "./nav";
import { pos } from "./pos";
import type { Language } from "./types";

export type { Language } from "./types";

const areas = [common, nav, dashboard, pos] as const;

export const en = {
  ...common.en,
  ...nav.en,
  ...dashboard.en,
  ...pos.en,
} as const;

export type MessageKey = keyof typeof en;

type Dictionary = Partial<Record<MessageKey, string>>;

function merge(language: "am" | "om"): Dictionary {
  const out: Dictionary = {};
  for (const area of areas) Object.assign(out, area[language]);
  return out;
}

export const messages: Record<Language, Dictionary> = {
  en,
  am: merge("am"),
  om: merge("om"),
};

/** Keys that have `_one` and `_other` forms, used by `tn()` for plurals. */
export type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}_one` ? Base : never;
}[MessageKey];
