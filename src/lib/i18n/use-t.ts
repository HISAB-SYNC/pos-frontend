"use client";

import { useCallback } from "react";

import { useLanguageStore } from "@/stores/language-store";

import { messages, type MessageKey, type PluralKey } from "./messages";

type Vars = Record<string, string | number>;

function fill(text: string, vars?: Vars) {
  if (!vars) return text;
  let out = text;
  for (const [name, value] of Object.entries(vars)) {
    out = out.split(`{${name}}`).join(String(value));
  }
  return out;
}

/**
 * Returns `t(key, vars)` for the current interface language. `{name}` in a
 * message is replaced with `vars.name`. Text missing in Amharic or Afaan Oromo
 * falls back to English.
 *
 * `tn(base, count, vars)` picks the `<base>_one` or `<base>_other` text by
 * count and fills `{count}` automatically, e.g. "1 customer" / "2 customers".
 */
export function useT() {
  const language = useLanguageStore((state) => state.language);

  const t = useCallback(
    (key: MessageKey, vars?: Vars) => fill(messages[language]?.[key] ?? messages.en[key] ?? key, vars),
    [language],
  );

  const tn = useCallback(
    (base: PluralKey, count: number, vars?: Vars) => {
      const key = `${base}_${count === 1 ? "one" : "other"}` as MessageKey;
      return fill(messages[language]?.[key] ?? messages.en[key] ?? key, { count, ...vars });
    },
    [language],
  );

  // Callable like before (`t("key")`), with `t.n` for plurals.
  return Object.assign(t, { n: tn });
}
