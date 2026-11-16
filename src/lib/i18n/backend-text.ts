"use client";

import { useMemo } from "react";

import { translateBackendText } from "./backend-match";
import { useT } from "./use-t";

export { matchBackendText, translateBackendText } from "./backend-match";

/**
 * `text(message)` for API errors and `notification({ title, message })` for
 * notifications, both in the current interface language.
 */
export function useBackendText() {
  const t = useT();
  return useMemo(
    () => ({
      text: (message: string | null | undefined) => translateBackendText(message, t),
      notification: <N extends { title: string; message: string }>(n: N) => ({
        ...n,
        title: translateBackendText(n.title, t),
        message: translateBackendText(n.message, t),
      }),
    }),
    [t],
  );
}
