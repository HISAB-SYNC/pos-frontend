"use client";

import { useCallback } from "react";

import { useLanguageStore } from "@/stores/language-store";

import { messages, type MessageKey } from "./messages";

/**
 * Returns `t(key, vars)` for the current interface language. `{name}` in a
 * message is replaced with `vars.name`. Missing Amharic text falls back to English.
 */
export function useT() {
  const language = useLanguageStore((state) => state.language);
  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      let text: string = messages[language]?.[key] ?? messages.en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [language],
  );
}
