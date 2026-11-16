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
import { auth } from "./auth";
import { landing } from "./landing";
import { inventory } from "./inventory";
import { orders } from "./orders";
import { customers } from "./customers";
import { debts } from "./debts";
import { suppliers } from "./suppliers";
import { expenses } from "./expenses";
import { funds } from "./funds";
import { reports } from "./reports";
import { users } from "./users";
import { notifications } from "./notifications";
import { settings } from "./settings";
import { shared } from "./shared";
import type { Language } from "./types";

export type { Language } from "./types";

const areas = [common, nav, dashboard, pos, auth, landing, inventory, orders, customers, debts, suppliers, expenses, funds, reports, users, notifications, settings, shared] as const;

export const en = {
  ...common.en,
  ...nav.en,
  ...dashboard.en,
  ...pos.en,
  ...auth.en,
  ...landing.en,
  ...inventory.en,
  ...orders.en,
  ...customers.en,
  ...debts.en,
  ...suppliers.en,
  ...expenses.en,
  ...funds.en,
  ...reports.en,
  ...users.en,
  ...notifications.en,
  ...settings.en,
  ...shared.en,
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
