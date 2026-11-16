"use client";

import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";

import type { FundsLine } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";
import { IN_LINES, type LineTotals, OUT_LINES, inOutNet } from "@/lib/utils/funds-period";

import { LINE_HINTS, LINE_LABELS, formatEtb } from "./funds-shared";

/**
 * Where the money of the chosen period came from and where it went, with a bar
 * per type so the biggest ones stand out. Tapping a type filters the activity.
 */
export function BreakdownPanel({
  lines,
  onOpenLine,
}: {
  lines: LineTotals;
  onOpenLine: (line: FundsLine) => void;
}) {
  const t = useT();
  const totals = inOutNet(lines);

  const block = (kind: "in" | "out", keys: FundsLine[], total: number) => {
    const isIn = kind === "in";
    const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
    const sorted = [...keys].sort((a, b) => lines[b] - lines[a]);
    return (
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-900">
            <span
              className={`flex size-7 items-center justify-center rounded-full ring-1 ${
                isIn ? "bg-emerald-50 text-emerald-600 ring-emerald-200/70" : "bg-rose-50 text-rose-600 ring-rose-200/70"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
            </span>
            {t(isIn ? "fundsPage.summary.in" : "fundsPage.summary.out")}
          </h3>
          <span className={`font-mono text-base font-bold tabular-nums ${isIn ? "text-emerald-700" : "text-rose-700"}`}>
            {isIn ? "+" : "−"}
            {formatEtb(total)}
          </span>
        </div>
        <ul className="space-y-1">
          {sorted.map((line) => {
            const value = lines[line];
            const share = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
            return (
              <li key={line}>
                <button
                  type="button"
                  onClick={() => onOpenLine(line)}
                  className={`group w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-zinc-50 ${
                    value === 0 ? "opacity-50" : ""
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0 text-sm font-medium text-zinc-800">{t(LINE_LABELS[line])}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold tabular-nums text-zinc-900">{formatEtb(value)}</span>
                      <ChevronRight className="size-3.5 text-zinc-300 group-hover:text-zinc-500" />
                    </span>
                  </span>
                  {LINE_HINTS[line] && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{t(LINE_HINTS[line])}</span>
                  )}
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <span
                      className={`block h-full rounded-full ${isIn ? "bg-emerald-500" : "bg-rose-400"}`}
                      style={{ width: `${share}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {block("in", IN_LINES, totals.in)}
        {block("out", OUT_LINES, totals.out)}
      </div>
      <details className="group rounded-xl border border-zinc-200/80 bg-white px-5 py-3 shadow-2xs">
        <summary className="cursor-pointer list-none text-xs font-semibold text-zinc-700">{t("fundsPage.summary.why")}</summary>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">{t("fundsPage.overview.fundsVsProfitBody")}</p>
      </details>
    </div>
  );
}
