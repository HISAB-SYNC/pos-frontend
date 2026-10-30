"use client";

import { ArrowDownRight, ArrowUpRight, CircleDollarSign, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getDashboardPeriod } from "@/lib/api/app-data";
import type { DashboardPeriod } from "@/lib/api/types";

type Preset = "TODAY" | "WEEK" | "MONTH" | "ALL";

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "TODAY", label: "Today" },
  { id: "WEEK", label: "7 days" },
  { id: "MONTH", label: "This month" },
  { id: "ALL", label: "All time" },
];

const COMPARE_LABEL: Record<Preset, string> = {
  TODAY: "vs yesterday",
  WEEK: "vs previous 7 days",
  MONTH: "vs same time last month",
  ALL: "",
};

/** Local-time ranges for a preset, with the period it is compared against. */
function rangeFor(preset: Preset) {
  const now = new Date();
  if (preset === "TODAY") {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - 1);
    return { from, to: now, prevFrom, prevTo: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
  }
  if (preset === "WEEK") {
    const day = 24 * 60 * 60 * 1000;
    const from = new Date(now.getTime() - 7 * day);
    return { from, to: now, prevFrom: new Date(now.getTime() - 14 * day), prevTo: from };
  }
  // Month to date, compared with the same days of last month.
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const prevTo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    Math.min(now.getDate(), lastDayPrev),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  );
  return { from, to: now, prevFrom, prevTo };
}

function formatEtb(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (previous <= 0) {
    return <span className="text-[11px] text-zinc-500">{current > 0 ? `No sales ${label.replace("vs ", "")}` : label}</span>;
  }
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono font-semibold ${
          up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        }`}
      >
        <Icon className="size-3" />
        {Math.abs(change).toFixed(change !== 0 && Math.abs(change) < 10 ? 1 : 0)}%
      </span>
      {label}
    </span>
  );
}

export function KpiPeriodCards({
  shopId,
  allTime,
  outstandingDebt,
  debtorsCount,
}: {
  shopId: string;
  /** All-time totals already loaded with the dashboard (used for "All time"). */
  allTime: { revenue: number; salesCount: number; cogs: number; expenses: number };
  outstandingDebt: number;
  debtorsCount: number;
}) {
  const [preset, setPreset] = useState<Preset>("MONTH");
  const [period, setPeriod] = useState<DashboardPeriod | null>(null);
  const [loadedPreset, setLoadedPreset] = useState<Preset | null>(null);

  useEffect(() => {
    if (preset === "ALL") return;
    let mounted = true;
    getDashboardPeriod(shopId, rangeFor(preset))
      .then((p) => {
        if (!mounted) return;
        setPeriod(p);
        setLoadedPreset(preset);
      })
      .catch(() => {
        if (!mounted) return;
        setPeriod(null);
        setLoadedPreset(preset);
      });
    return () => {
      mounted = false;
    };
  }, [shopId, preset]);

  const isAll = preset === "ALL";
  const isLoading = !isAll && loadedPreset !== preset;
  // Older backends without period support fall back to all-time numbers.
  const current = isAll || !period ? allTime : period;
  const previous = !isAll ? period?.previous ?? null : null;
  const showsAllTime = isAll || (!isLoading && !period);
  const periodLabel = showsAllTime ? "All time" : PRESETS.find((p) => p.id === preset)?.label;

  const netProfit = current.revenue - current.cogs - current.expenses;
  const avgSale = current.salesCount > 0 ? current.revenue / current.salesCount : 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Performance · {periodLabel}
        </h2>
        <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                preset === p.id
                  ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4 ${isLoading ? "opacity-60" : ""}`}>
        {/* Revenue */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Revenue</span>
            <div className="flex size-8 items-center justify-center rounded-md bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
              {formatEtb(current.revenue)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </div>
            <div className="mt-2 min-h-5">
              {previous ? (
                <Delta current={current.revenue} previous={previous.revenue} label={COMPARE_LABEL[preset]} />
              ) : (
                <span className="text-[11px] text-zinc-500">Value of sales made, incl. credit sales</span>
              )}
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xs transition-all hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Profit</span>
            <div className="flex size-8 items-center justify-center rounded-md bg-slate-800 text-indigo-300">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${netProfit < 0 ? "text-rose-300" : "text-white"}`}>
              {formatEtb(netProfit)} <span className="text-xs font-semibold text-slate-400">ETB</span>
            </div>
            <p className="mt-2 truncate text-[11px] text-slate-400">
              Cost of goods {formatEtb(current.cogs)} · Expenses {formatEtb(current.expenses)}
            </p>
          </div>
        </div>

        {/* Outstanding customer debt (always current) */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Outstanding Debt</span>
            <div className="flex size-8 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-400/30">
              <CircleDollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight tabular-nums text-amber-900">
              {formatEtb(outstandingDebt)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-800">
                {debtorsCount} accounts · now
              </span>
              <Link href="/debts" className="inline-flex items-center gap-1 font-semibold text-zinc-900 hover:underline">
                <span>Ledger</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sales count and average sale */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sales</span>
            <div className="flex size-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-800">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
              {current.salesCount.toLocaleString("en-US")} <span className="text-xs font-semibold text-zinc-500">sales</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                Avg {formatEtb(avgSale)} ETB
              </span>
              <span>per sale</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
