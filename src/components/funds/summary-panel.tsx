"use client";

import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";

import type { FundsLine, FundsSummary } from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";

import { IN_LINES, LINE_HINTS, LINE_LABELS, OUT_LINES, formatEtb } from "./funds-shared";

/**
 * Where the money came from and where it went, with a bar per source so the
 * biggest ones stand out. Tapping a line opens the matching activity.
 */
export function SummaryPanel({
  funds,
  onOpenLine,
}: {
  funds: FundsSummary;
  onOpenLine: (line: FundsLine) => void;
}) {
  const t = useT();
  const { formatDate } = useFormat();

  const block = (kind: "in" | "out", lines: FundsLine[], total: number) => {
    const isIn = kind === "in";
    const Icon = isIn ? ArrowDownLeft : ArrowUpRight;
    const sorted = [...lines].sort((a, b) => funds.lines[b] - funds.lines[a]);
    return (
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-900">
            <span
              className={`flex size-7 items-center justify-center rounded-full ring-1 ${
                isIn ? "bg-emerald-50 text-emerald-600 ring-emerald-200/70" : "bg-rose-50 text-rose-600 ring-rose-200/70"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
            </span>
            {t(isIn ? "fundsPage.summary.in" : "fundsPage.summary.out")}
          </h2>
          <span className={`font-mono text-base font-bold tabular-nums ${isIn ? "text-emerald-700" : "text-rose-700"}`}>
            {isIn ? "+" : "−"}
            {formatEtb(total)}
          </span>
        </div>
        <ul className="space-y-1">
          {sorted.map((line) => {
            const value = funds.lines[line];
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
                  {LINE_HINTS[line] && <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{t(LINE_HINTS[line])}</span>}
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
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        {funds.since ? `${t("fundsPage.summary.since", { date: formatDate(funds.since) })} · ` : ""}
        {t("fundsPage.summary.tap")}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {block("in", IN_LINES, funds.moneyIn)}
        {block("out", OUT_LINES, funds.moneyOut)}
      </div>

      {/* In − Out = Left */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-zinc-200/80 bg-white px-5 py-4 shadow-2xs">
        <div className="text-center">
          <p className="text-[11px] font-semibold text-zinc-500">{t("fundsPage.summary.in")}</p>
          <p className="font-mono text-lg font-bold tabular-nums text-emerald-700">+{formatEtb(funds.moneyIn)}</p>
        </div>
        <span className="text-lg font-bold text-zinc-300">−</span>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-zinc-500">{t("fundsPage.summary.out")}</p>
          <p className="font-mono text-lg font-bold tabular-nums text-rose-700">{formatEtb(funds.moneyOut)}</p>
        </div>
        <span className="text-lg font-bold text-zinc-300">=</span>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-zinc-500">{t("fundsPage.summary.left")}</p>
          <p className={`font-mono text-xl font-bold tabular-nums ${funds.moneyLeft < 0 ? "text-rose-700" : "text-zinc-900"}`}>
            {formatEtb(funds.moneyLeft)} <span className="text-xs font-semibold text-zinc-500">{t("shared.etb")}</span>
          </p>
        </div>
      </div>

      <details className="group rounded-xl border border-zinc-200/80 bg-white px-5 py-3 shadow-2xs">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-zinc-700">
          {t("fundsPage.summary.why")}
          <ChevronDown className="size-4 text-zinc-400 transition-transform group-open:rotate-180" />
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">{t("fundsPage.overview.fundsVsProfitBody")}</p>
      </details>
    </div>
  );
}
