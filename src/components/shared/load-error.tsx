"use client";

import { RotateCcw, WifiOff } from "lucide-react";

/**
 * Shown when a page's data couldn't be loaded. Pages show this instead of
 * demo data, so nobody mistakes sample numbers for their shop's.
 */
export function LoadError({
  what,
  onRetry,
  detail,
}: {
  /** e.g. "customers", "the dashboard" */
  what: string;
  onRetry: () => void;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center">
      <div className="flex size-9 items-center justify-center rounded-md bg-white text-rose-600 ring-1 ring-rose-200">
        <WifiOff className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-rose-900">Couldn&apos;t load {what}</p>
        <p className="mt-1 text-xs text-rose-800/80">
          {detail || "Check your internet connection, then try again. Nothing shown here is out of date or made up."}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-2xs transition-colors hover:bg-rose-50"
      >
        <RotateCcw className="size-3.5" />
        Try again
      </button>
    </div>
  );
}

/** Small inline error for a failed action (save, pay, suspend…). */
export function ActionError({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 font-semibold text-rose-900 hover:underline">
          Dismiss
        </button>
      )}
    </div>
  );
}

/** Readable message from an API error. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  const msg = (err as { message?: string } | null)?.message;
  return typeof msg === "string" && msg.trim() ? msg : fallback;
}
