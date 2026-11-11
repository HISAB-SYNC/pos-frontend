"use client";

import { ArrowLeft, Download, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PeriodBar, ReportSortTh, reportInputClass } from "@/components/reports/report-controls";
import { LoadError } from "@/components/shared/load-error";
import { RouteGuard } from "@/components/shared/route-guard";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { getProductReport } from "@/lib/api/app-data";
import type { ProductReport, ProductReportItem } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { periodLabel, rangeFor, type Preset } from "@/lib/utils/report-range";
import { formatQuantity } from "@/lib/utils/units";
import { useShopStore } from "@/stores/shop-store";

type SortKey = "name" | "units" | "revenue" | "profit" | "margin" | "stock";

function etb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function sortValue(item: ProductReportItem, key: SortKey): string | number {
  switch (key) {
    case "name":
      return item.name.toLowerCase();
    case "units":
      return item.sold.units;
    case "revenue":
      return item.sold.revenue;
    case "profit":
      return item.sold.profit;
    case "margin":
      return item.sold.marginPct ?? -1;
    default:
      return item.stock?.onHand ?? 0;
  }
}

export default function TopSellingReportPage() {
  const shopId = useShopStore((state) => state.activeShopId) ?? MOCK_IDS.shop;

  const [preset, setPreset] = useState<Preset>("MONTH");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("units");
  const [sortDesc, setSortDesc] = useState(true);
  const [result, setResult] = useState<{ key: string; data: ProductReport | null; error: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const requestKey = `${JSON.stringify(range)}|${reloadKey}`;
  const label = periodLabel(preset, range);

  useEffect(() => {
    let mounted = true;
    getProductReport(shopId, range)
      .then((data) => {
        if (mounted) setResult({ key: requestKey, data, error: false });
      })
      .catch(() => {
        if (mounted) setResult({ key: requestKey, data: null, error: true });
      });
    return () => {
      mounted = false;
    };
  }, [shopId, range, requestKey]);

  const isLoading = result?.key !== requestKey;
  const report = !isLoading ? result?.data ?? null : null;

  const rows = useMemo(() => {
    if (!report) return [];
    const q = search.trim().toLowerCase();
    return report.items
      .filter((i) => i.sold.units > 0)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const va = sortValue(a, sortKey);
        const vb = sortValue(b, sortKey);
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDesc ? -cmp : cmp;
      });
  }, [report, search, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(key !== "name");
    }
  }

  function handleCsv() {
    exportToCsv(
      `top-selling-products-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      rows.map((item, index) => ({ ...item, rank: index + 1 })),
      [
        { header: "Rank", key: "rank" },
        { header: "Product", key: "name" },
        { header: "SKU", formatter: (i) => i.sku ?? "" },
        { header: "Category", formatter: (i) => i.category ?? "" },
        { header: "Units sold", formatter: (i) => i.sold.units },
        { header: "Sales value (ETB)", formatter: (i) => i.sold.revenue },
        { header: "Cost of goods (ETB)", formatter: (i) => i.sold.cogs },
        { header: "Profit (ETB)", formatter: (i) => i.sold.profit },
        { header: "Margin (%)", formatter: (i) => (i.sold.marginPct === null ? "" : i.sold.marginPct) },
        { header: "Stock now", formatter: (i) => i.stock?.onHand ?? "" },
      ],
    );
  }

  const pager = usePagination(rows, 20);
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
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">Top Selling Products</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Every product sold in the period with revenue, cost and profit · {label}
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
          <LoadError what="the top selling products" onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product or SKU"
                  className={`${reportInputClass} w-56 pl-8`}
                />
              </div>
              <span className="ml-auto text-xs text-zinc-500">{rows.length} products</span>
            </div>

            {isLoading ? (
              <p className="py-12 text-center text-xs text-zinc-400">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-xs text-zinc-500">No products were sold in this period.</p>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="w-12 px-4 py-2.5 font-bold">#</th>
                      <ReportSortTh label="Product" field="name" {...sortProps} />
                      <ReportSortTh label="Units sold" field="units" right {...sortProps} />
                      <ReportSortTh label="Sales value" field="revenue" right {...sortProps} />
                      <ReportSortTh label="Profit" field="profit" right {...sortProps} />
                      <ReportSortTh label="Margin" field="margin" right {...sortProps} />
                      <ReportSortTh label="Stock now" field="stock" right {...sortProps} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pager.pageItems.map((i, index) => (
                      <tr key={i.productId ?? i.name} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-4 py-2.5 font-mono font-bold text-zinc-400">{pager.from + index}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-zinc-900">{i.name}</p>
                          <p className="font-mono text-[11px] text-zinc-500">{[i.sku, i.category].filter(Boolean).join(" · ") || "—"}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-900 tabular-nums">
                          {formatQuantity(i.sold.units, i.unit)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-900 tabular-nums">{etb(i.sold.revenue)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                          {etb(i.sold.profit)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-600 tabular-nums">
                          {i.sold.marginPct === null ? "—" : `${i.sold.marginPct.toFixed(1)}%`}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-600 tabular-nums">
                          {i.stock ? formatQuantity(i.stock.onHand, i.unit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination pagination={pager} noun="products" />
              </>
            )}
          </section>
        )}
      </div>
    </RouteGuard>
  );
}
