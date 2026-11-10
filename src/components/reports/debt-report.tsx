"use client";

import { FileSpreadsheet, Printer, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoadError } from "@/components/shared/load-error";
import { getDebts } from "@/lib/api/app-data";
import type { Debt } from "@/lib/api/types";
import {
  STATUS_LABEL,
  buildDebtRows,
  groupByCustomer,
  summarize,
  type DebtReportRow,
  type DebtRowStatus,
} from "@/lib/utils/debt-report";
import { periodLabel, rangeFor, type Preset } from "@/lib/utils/report-range";
import { useShopStore } from "@/stores/shop-store";

import { downloadDebtReportXlsx } from "./debt-report-export";
import { PeriodBar, ReportSortTh, reportInputClass } from "./report-controls";

type StatusFilter = "ALL" | "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE";
type View = "DEBT" | "CUSTOMER";
type SortKey = "customer" | "count" | "issuedAt" | "dueAt" | "issued" | "paid" | "remaining" | "status";

const STATUS_CHIPS: Array<{ id: StatusFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "PAID", label: "Fully paid" },
  { id: "PARTIAL", label: "Partially paid" },
  { id: "UNPAID", label: "Unpaid" },
  { id: "OVERDUE", label: "Overdue" },
];

const STATUS_RANK: Record<DebtRowStatus, number> = { UNPAID: 0, PARTIAL: 1, PAID: 2 };

const STATUS_STYLE: Record<DebtRowStatus, string> = {
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  UNPAID: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

function etb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function day(timestamp: number) {
  return timestamp
    ? new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

function sortValue(row: DebtReportRow, key: SortKey): string | number {
  switch (key) {
    case "customer":
      return row.customer.toLowerCase();
    case "status":
      return STATUS_RANK[row.status];
    default:
      return row[key];
  }
}

export function DebtReport({ shopId }: { shopId: string }) {
  const shopName = useShopStore((state) => state.activeShopName) || "Shop";
  const [preset, setPreset] = useState<Preset>("MONTH");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [view, setView] = useState<View>("DEBT");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("remaining");
  const [sortDesc, setSortDesc] = useState(true);
  const [result, setResult] = useState<{ key: string; debts: Debt[]; error: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const requestKey = `${shopId}|${reloadKey}`;

  useEffect(() => {
    let mounted = true;
    getDebts(shopId)
      .then((debts) => {
        if (mounted) setResult({ key: requestKey, debts, error: false });
      })
      .catch(() => {
        if (mounted) setResult({ key: requestKey, debts: [], error: true });
      });
    return () => {
      mounted = false;
    };
  }, [shopId, requestKey]);

  const isLoading = result?.key !== requestKey;
  const debts = useMemo(() => (!isLoading && result ? result.debts : []), [isLoading, result]);

  const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const label = periodLabel(preset, range);

  // Everything issued in the period, before status/search filters: the KPIs describe this set.
  const periodRows = useMemo(() => buildDebtRows(debts, range), [debts, range]);
  const totals = useMemo(() => summarize(debts, periodRows, range), [debts, periodRows, range]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = view === "CUSTOMER" ? groupByCustomer(periodRows) : periodRows;
    return base
      .filter((r) => {
        if (statusFilter === "OVERDUE") return r.overdue;
        return statusFilter === "ALL" || r.status === statusFilter;
      })
      .filter((r) => !q || r.customer.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = sortValue(a, sortKey);
        const vb = sortValue(b, sortKey);
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDesc ? -cmp : cmp;
      });
  }, [periodRows, view, statusFilter, search, sortKey, sortDesc]);

  const shown = useMemo(
    () => ({
      issued: rows.reduce((s, r) => s + r.issued, 0),
      paid: rows.reduce((s, r) => s + r.paid, 0),
      remaining: rows.reduce((s, r) => s + r.remaining, 0),
    }),
    [rows],
  );

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(key !== "customer");
    }
  }

  async function handleExcel() {
    setIsExporting(true);
    try {
      await downloadDebtReportXlsx(rows, totals, { shopName, periodLabel: label, byCustomer: view === "CUSTOMER" });
    } finally {
      setIsExporting(false);
    }
  }

  const byCustomer = view === "CUSTOMER";
  const sortProps = { activeField: sortKey, desc: sortDesc, onSort: toggleSort };
  const collectedPct = totals.issued > 0 ? Math.round((totals.paid / totals.issued) * 100) : 0;

  return (
    <div id="debt-report" className="space-y-5">
      {/* Only the report prints: hide the app around it */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #debt-report, #debt-report * { visibility: visible !important; }
          #debt-report { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0; }
          #debt-report table { font-size: 9px; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-lg font-bold">{shopName} — Debt report</h1>
        <p className="text-xs text-zinc-600">
          Period: {label} · Filter: {STATUS_CHIPS.find((c) => c.id === statusFilter)?.label} · Generated{" "}
          {new Date().toLocaleString("en-GB")}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <PeriodBar
          preset={preset}
          onPreset={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFrom={setCustomFrom}
          onCustomTo={setCustomTo}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={isLoading || rows.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50"
          >
            <Printer className="size-3.5 text-zinc-500" />
            Print / PDF
          </button>
          <button
            type="button"
            onClick={handleExcel}
            disabled={isLoading || rows.length === 0 || isExporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" />
            {isExporting ? "Preparing…" : "Excel"}
          </button>
        </div>
      </div>

      {result?.error && !isLoading ? (
        <LoadError what="the debt report" onRetry={() => setReloadKey((k) => k + 1)} />
      ) : (
        <>
          <p className="-mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {label} · debts issued in this period
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Debt issued", value: totals.issued, hint: `${totals.debts} debts · ${totals.customers} customers` },
              {
                label: "Repaid",
                value: totals.paid,
                hint: `${collectedPct}% of issued · received in period ${etb(totals.collectedInPeriod)}`,
              },
              { label: "Outstanding", value: totals.remaining, hint: `${totals.debtors} customers still owe` },
              { label: "Overdue", value: totals.overdueAmount, hint: `${totals.overdueCount} debts past due date` },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{card.label}</p>
                <p className={`mt-1.5 font-mono text-xl font-bold tabular-nums text-zinc-900 ${isLoading ? "opacity-40" : ""}`}>
                  {isLoading ? "—" : etb(card.value)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
                </p>
                <p className="mt-1 truncate text-[11px] text-zinc-500">{isLoading ? "" : card.hint}</p>
              </div>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3 print:hidden">
              <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
                {STATUS_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setStatusFilter(chip.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      statusFilter === chip.id
                        ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                        : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <select value={view} onChange={(e) => setView(e.target.value as View)} className={reportInputClass}>
                <option value="DEBT">One row per debt</option>
                <option value="CUSTOMER">One row per customer</option>
              </select>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer or phone"
                  className={`${reportInputClass} w-52 pl-8`}
                />
              </div>
              <span className="ml-auto text-xs text-zinc-500">
                {rows.length} {byCustomer ? "customers" : "debts"}
              </span>
            </div>

            {isLoading ? (
              <p className="py-12 text-center text-xs text-zinc-400">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-xs text-zinc-500">No debts match this period and filter.</p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[860px] text-left text-xs print:min-w-0">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <ReportSortTh label="Customer" field="customer" {...sortProps} />
                      {byCustomer ? (
                        <ReportSortTh label="Debts" field="count" right {...sortProps} />
                      ) : (
                        <th className="px-3 py-2.5 font-bold">Ref</th>
                      )}
                      <ReportSortTh label={byCustomer ? "Latest" : "Issued"} field="issuedAt" {...sortProps} />
                      <ReportSortTh label="Due" field="dueAt" {...sortProps} />
                      <ReportSortTh label="Debt issued" field="issued" right {...sortProps} />
                      <ReportSortTh label="Repaid" field="paid" right {...sortProps} />
                      <ReportSortTh label="Remaining" field="remaining" right {...sortProps} />
                      <ReportSortTh label="Status" field="status" {...sortProps} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((r) => (
                      <tr key={r.key} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-zinc-900">{r.customer}</p>
                          {r.phone && <p className="font-mono text-[11px] text-zinc-500">{r.phone}</p>}
                        </td>
                        {byCustomer ? (
                          <td className="px-4 py-2.5 text-right font-mono text-zinc-700 tabular-nums">{r.count}</td>
                        ) : (
                          <td className="px-3 py-2.5 font-mono text-zinc-500">#{r.reference}</td>
                        )}
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{day(r.issuedAt)}</td>
                        <td className={`whitespace-nowrap px-4 py-2.5 ${r.overdue ? "font-semibold text-rose-600" : "text-zinc-600"}`}>
                          {r.remaining > 0.001 ? day(r.dueAt) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-900 tabular-nums">{etb(r.issued)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-700 tabular-nums">{etb(r.paid)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-900 tabular-nums">
                          {etb(r.remaining)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[r.status]}`}
                            >
                              {STATUS_LABEL[r.status]}
                            </span>
                            {r.overdue && (
                              <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-zinc-200 bg-zinc-50/60 font-bold text-zinc-900">
                      <td className="px-4 py-2.5" colSpan={4}>
                        Total ({rows.length})
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{etb(shown.issued)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{etb(shown.paid)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{etb(shown.remaining)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
