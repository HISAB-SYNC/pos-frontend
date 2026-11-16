"use client";

import { ArrowDownLeft, ArrowUpRight, ChevronDown } from "lucide-react";

import { useT } from "@/lib/i18n/use-t";
import { type PeriodId, detectPeriod, inOutNet, periodRange, type LineTotals } from "@/lib/utils/funds-period";
import type { Direction } from "@/lib/utils/funds-activity";

import type { LedgerFilter } from "./activity-list";
import { formatEtb } from "./funds-shared";

const dateInput =
  "h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

/**
 * "How did it go?": choose a period and see money in, money out and the net for
 * it in three plain numbers. Tapping In or Out shows only those in the activity.
 */
export function PeriodBar({
  filter,
  onFilterChange,
  lines,
  isLoading,
  direction,
  onDirectionChange,
  breakdownOpen,
  onToggleBreakdown,
  customMode,
  onCustomMode,
}: {
  filter: LedgerFilter;
  onFilterChange: (filter: LedgerFilter) => void;
  lines: LineTotals | null;
  isLoading: boolean;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  breakdownOpen: boolean;
  onToggleBreakdown: () => void;
  /** True once "Custom" was chosen, so the date boxes stay visible while dates are typed */
  customMode: boolean;
  onCustomMode: (on: boolean) => void;
}) {
  const t = useT();
  const period: PeriodId = customMode ? "CUSTOM" : detectPeriod(filter);
  const totals = lines ? inOutNet(lines) : null;

  const choices: Array<{ id: PeriodId; label: string }> = [
    { id: "TODAY", label: t("fundsPage.filter.today") },
    { id: "WEEK", label: t("fundsPage.filter.week") },
    { id: "MONTH", label: t("fundsPage.filter.month") },
    { id: "ALL", label: t("fundsPage.period.all") },
    { id: "CUSTOM", label: t("fundsPage.filter.custom") },
  ];

  function choose(id: PeriodId) {
    if (id === "CUSTOM") {
      onCustomMode(true);
      return;
    }
    onCustomMode(false);
    onFilterChange({ ...filter, ...periodRange(id) });
  }

  const stat = (
    kind: "in" | "out" | "net",
    value: number | null,
    active: boolean,
    onClick?: () => void,
  ) => {
    const isIn = kind === "in";
    const label = t(kind === "in" ? "fundsPage.period.in" : kind === "out" ? "fundsPage.period.out" : "fundsPage.period.net");
    const color =
      kind === "in" ? "text-emerald-700" : kind === "out" ? "text-rose-700" : (value ?? 0) < 0 ? "text-rose-700" : "text-zinc-900";
    const sign = kind === "in" ? "+" : kind === "out" ? "−" : (value ?? 0) < 0 ? "−" : (value ?? 0) > 0 ? "+" : "";
    const body = (
      <>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
          {kind === "in" && <ArrowDownLeft className="size-3.5 text-emerald-600" strokeWidth={2.5} />}
          {kind === "out" && <ArrowUpRight className="size-3.5 text-rose-600" strokeWidth={2.5} />}
          {label}
        </span>
        <span className={`mt-1 block font-mono text-lg font-bold tabular-nums sm:text-xl ${color}`}>
          {value === null ? "—" : `${sign}${formatEtb(Math.abs(value))}`}
        </span>
      </>
    );
    const base = "rounded-xl border bg-white p-3 text-left shadow-2xs sm:p-4";
    if (!onClick) return <div className={`${base} border-zinc-200/80 ${isLoading ? "opacity-60" : ""}`}>{body}</div>;
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${base} transition-all ${
          active ? (isIn ? "border-emerald-400 ring-1 ring-emerald-300" : "border-rose-400 ring-1 ring-rose-300") : "border-zinc-200/80 hover:border-zinc-300"
        } ${isLoading ? "opacity-60" : ""}`}
      >
        {body}
      </button>
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => choose(c.id)}
              className={`rounded-md px-3 py-1.5 text-xs transition-all ${
                period === c.id
                  ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                  : "font-medium text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {period === "CUSTOM" && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="date"
              value={filter.from}
              onChange={(e) => onFilterChange({ ...filter, from: e.target.value })}
              aria-label={t("fundsPage.filter.from")}
              className={dateInput}
            />
            <span>–</span>
            <input
              type="date"
              value={filter.to}
              onChange={(e) => onFilterChange({ ...filter, to: e.target.value })}
              aria-label={t("fundsPage.filter.to")}
              className={dateInput}
            />
          </div>
        )}
        <button
          type="button"
          onClick={onToggleBreakdown}
          aria-expanded={breakdownOpen}
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
        >
          {breakdownOpen ? t("fundsPage.period.hideBreakdown") : t("fundsPage.period.showBreakdown")}
          <ChevronDown className={`size-3.5 transition-transform ${breakdownOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stat("in", totals?.in ?? null, direction === "IN", () => onDirectionChange(direction === "IN" ? "ALL" : "IN"))}
        {stat("out", totals?.out ?? null, direction === "OUT", () => onDirectionChange(direction === "OUT" ? "ALL" : "OUT"))}
        {stat("net", totals?.net ?? null, false)}
      </div>
      <p className="text-[11px] text-zinc-500">{isLoading ? t("fundsPage.period.loading") : t("fundsPage.period.tapHint")}</p>
    </section>
  );
}
