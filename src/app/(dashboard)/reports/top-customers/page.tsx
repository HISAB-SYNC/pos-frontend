"use client";

import { ArrowLeft, Download, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PeriodBar, ReportSortTh, reportInputClass } from "@/components/reports/report-controls";
import { LoadError } from "@/components/shared/load-error";
import { RouteGuard } from "@/components/shared/route-guard";
import { getSales } from "@/lib/api/app-data";
import type { Sale } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { periodLabel, rangeFor, type Preset } from "@/lib/utils/report-range";
import { useShopStore } from "@/stores/shop-store";

type SortKey = "name" | "orders" | "spent" | "average" | "last";

type CustomerRow = {
  customerId: string;
  name: string;
  contact: string;
  orders: number;
  spent: number;
  average: number;
  last: number;
};

const EXCLUDED_STATUSES = new Set(["CANCELLED", "VOIDED", "REFUNDED", "RETURNED"]);

function etb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Groups completed sales by customer (walk-in sales have no customer and are skipped). */
function buildRows(sales: Sale[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  for (const sale of sales) {
    if (!sale.customerId) continue;
    if (EXCLUDED_STATUSES.has((sale.status || "COMPLETED").toUpperCase())) continue;
    const amount = parseFloat(sale.totalAmount || "0") || 0;
    const when = new Date(sale.createdAt).getTime() || 0;
    const row = map.get(sale.customerId) ?? {
      customerId: sale.customerId,
      name: sale.customer?.name || "Unknown customer",
      contact: sale.customer?.phone || sale.customer?.email || "",
      orders: 0,
      spent: 0,
      average: 0,
      last: 0,
    };
    row.orders += 1;
    row.spent += amount;
    row.last = Math.max(row.last, when);
    map.set(sale.customerId, row);
  }
  return [...map.values()].map((r) => ({ ...r, spent: Math.round(r.spent * 100) / 100, average: r.orders ? r.spent / r.orders : 0 }));
}

export default function TopCustomersReportPage() {
  const shopId = useShopStore((state) => state.activeShopId) ?? MOCK_IDS.shop;

  const [preset, setPreset] = useState<Preset>("MONTH");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spent");
  const [sortDesc, setSortDesc] = useState(true);
  const [result, setResult] = useState<{ key: string; sales: Sale[]; error: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const requestKey = `${JSON.stringify(range)}|${reloadKey}`;
  const label = periodLabel(preset, range);

  useEffect(() => {
    let mounted = true;
    const startDate = range.from ? new Date(`${range.from}T00:00:00`).toISOString() : undefined;
    const endDate = range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : undefined;
    getSales(shopId, { startDate, endDate })
      .then((sales) => {
        if (!mounted) return;
        // Also filter locally: mock mode and some backends ignore the date params.
        const from = startDate ? new Date(startDate).getTime() : -Infinity;
        const to = endDate ? new Date(endDate).getTime() : Infinity;
        const inRange = sales.filter((s) => {
          const t = new Date(s.createdAt).getTime();
          return !isNaN(t) && t >= from && t <= to;
        });
        setResult({ key: requestKey, sales: inRange, error: false });
      })
      .catch(() => {
        if (mounted) setResult({ key: requestKey, sales: [], error: true });
      });
    return () => {
      mounted = false;
    };
  }, [shopId, range, requestKey]);

  const isLoading = result?.key !== requestKey;

  const rows = useMemo(() => {
    if (isLoading || !result) return [];
    const q = search.trim().toLowerCase();
    return buildRows(result.sales)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.contact.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = sortKey === "name" ? a.name.toLowerCase() : a[sortKey];
        const vb = sortKey === "name" ? b.name.toLowerCase() : b[sortKey];
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDesc ? -cmp : cmp;
      });
  }, [result, isLoading, search, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(key !== "name");
    }
  }

  function handleCsv() {
    exportToCsv(
      `top-customers-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      rows.map((r, index) => ({ ...r, rank: index + 1 })),
      [
        { header: "Rank", key: "rank" },
        { header: "Customer", key: "name" },
        { header: "Contact", key: "contact" },
        { header: "Orders", key: "orders" },
        { header: "Total spent (ETB)", key: "spent" },
        { header: "Average order (ETB)", formatter: (r) => Math.round(r.average * 100) / 100 },
        { header: "Last purchase", formatter: (r) => (r.last ? new Date(r.last).toISOString().slice(0, 10) : "") },
      ],
    );
  }

  const sortProps = { activeField: sortKey, desc: sortDesc, onSort: toggleSort };

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN"]}>
      <div className="space-y-5">
        <div className="space-y-3">
          <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950">
            <ArrowLeft className="size-3.5" />
            Back to reports
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">Top Customers</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Every customer who bought in the period, ranked by spending · {label}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PeriodBar
            preset={preset}
            onPreset={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFrom={setCustomFrom}
            onCustomTo={setCustomTo}
          />
          <button
            type="button"
            onClick={handleCsv}
            disabled={rows.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50"
          >
            <Download className="size-3.5 text-zinc-500" />
            Export CSV
          </button>
        </div>

        {result?.error && !isLoading ? (
          <LoadError what="the customer report" onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone or email"
                  className={`${reportInputClass} w-60 pl-8`}
                />
              </div>
              <span className="ml-auto text-xs text-zinc-500">{rows.length} customers</span>
            </div>

            {isLoading ? (
              <p className="py-12 text-center text-xs text-zinc-400">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-xs text-zinc-500">No customer purchases found in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="w-12 px-4 py-2.5 font-bold">#</th>
                      <ReportSortTh label="Customer" field="name" {...sortProps} />
                      <ReportSortTh label="Orders" field="orders" right {...sortProps} />
                      <ReportSortTh label="Total spent" field="spent" right {...sortProps} />
                      <ReportSortTh label="Avg. order" field="average" right {...sortProps} />
                      <ReportSortTh label="Last purchase" field="last" right {...sortProps} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((r, index) => (
                      <tr key={r.customerId} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 font-mono font-bold text-zinc-400">{index + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-zinc-900">{r.name}</p>
                          <p className="font-mono text-[11px] text-zinc-500">{r.contact || "—"}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-zinc-700 tabular-nums">{r.orders}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {etb(r.spent)} ETB
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-600 tabular-nums">{etb(r.average)}</td>
                        <td className="px-4 py-2.5 text-right text-zinc-600">
                          {r.last
                            ? new Date(r.last).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </RouteGuard>
  );
}
