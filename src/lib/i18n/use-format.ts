"use client";

import { useMemo } from "react";

import { type Language, useLanguageStore } from "@/stores/language-store";

/** Locale used for month and day names. Digits stay 0-9 in every language. */
const LOCALES: Record<Language, string> = {
  en: "en-US",
  am: "am-ET",
  om: "om-ET",
};

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function localeFor(language: Language) {
  return LOCALES[language] ?? LOCALES.en;
}

/**
 * Date and number formatting in the active interface language: month and day
 * names are translated, the calendar stays the normal (Gregorian) one so dates
 * match the records, exports and bank statements.
 */
export function useFormat() {
  const language = useLanguageStore((state) => state.language);
  return useMemo(() => {
    const locale = localeFor(language);
    return {
      locale,
      /** 15 Nov 2026 */
      formatDate: (value: DateInput, options?: Intl.DateTimeFormatOptions) => {
        const d = toDate(value);
        return d ? d.toLocaleDateString(locale, options ?? { day: "numeric", month: "short", year: "numeric" }) : "";
      },
      /** 15 Nov 2026, 14:05 */
      formatDateTime: (value: DateInput, options?: Intl.DateTimeFormatOptions) => {
        const d = toDate(value);
        return d
          ? d.toLocaleString(
              locale,
              options ?? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
            )
          : "";
      },
      /** 14:05 */
      formatTime: (value: DateInput, options?: Intl.DateTimeFormatOptions) => {
        const d = toDate(value);
        return d ? d.toLocaleTimeString(locale, options ?? { hour: "2-digit", minute: "2-digit" }) : "";
      },
      /** 1,234.5 */
      formatNumber: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => {
        const n = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
        return (isNaN(n) ? 0 : n).toLocaleString("en-US", { maximumFractionDigits: 2, ...options });
      },
    };
  }, [language]);
}
