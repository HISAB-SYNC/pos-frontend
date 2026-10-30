"use client";

import { useEffect } from "react";

import { useT } from "@/lib/i18n/use-t";
import { type Language, useLanguageStore } from "@/stores/language-store";

/** EN / አማ switch. Also keeps <html lang> in sync for screen readers and fonts. */
export function LanguageSwitch() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const options: Array<{ id: Language; label: string }> = [
    { id: "en", label: t("language.en") },
    { id: "am", label: t("language.am") },
  ];

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className="flex h-9 items-center gap-0.5 rounded-md border border-zinc-200/90 bg-zinc-50 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setLanguage(o.id)}
          aria-pressed={language === o.id}
          className={`h-full rounded px-2 text-[11px] font-semibold transition-all ${
            language === o.id ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
