"use client";

import { FileSpreadsheet, Printer, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ListSkeleton } from "@/components/shared/skeletons";
import { LoadError } from "@/components/shared/load-error";
import { TablePagination, isOnPage, usePagination } from "@/components/shared/table-pagination";
import { getProductReport } from "@/lib/api/app-data";
import type { ProductReport as ProductReportData, ProductReportItem } from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { PRESETS, periodLabel, rangeFor, type Preset } from "@/lib/utils/report-range";
import { formatQuantity } from "@/lib/utils/units";
import { useShopStore } from "@/stores/shop-store";

import { downloadProductReportXlsx } from "./product-report-export";

type SortKey = "revenue" | "units" | "profit" | "restock";
type View = "ALL" | "SOLD" | "RESTOCKED";

function etb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

const SORTERS: Record<SortKey, (a: ProductReportItem, b: ProductReportItem) => number> = {
  revenue: (a, b) => b.sold.revenue - a.sold.revenue,
  units: (a, b) => b.sold.units - a.sold.units,
  profit: (a, b) => b.sold.profit - a.sold.profit,
  restock: (a, b) => b.restocked.cost - a.restocked.cost,
};

const inputClass =
  "h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

export function ProductReport({ shopId }: { shopId: string }) {
  const t = useT();
  const { formatDate, formatDateTime } = useFormat();
  const etbLabel = t("shared.etb");
  const shopName = useShopStore((state) => state.activeShopName) || "Shop";
  const [preset, setPreset] = useState<Preset>("MONTH");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [view, setView] = useState<View>("ALL");
  const [result, setResult] = useState<{ key: string; data: ProductReportData | null; error: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const requestKey = `${JSON.stringify(range)}|${reloadKey}`;

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
  const label = periodLabel(preset, range, t, formatDate);

  const rows = useMemo(() => {
    if (!report) return [];
    const q = search.trim().toLowerCase();
    return report.items
      .filter((i) => view === "ALL" || (view === "SOLD" ? i.sold.units > 0 : i.restocked.units > 0))
      .filter((i) => !q || i.name.toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q))
      .sort(SORTERS[sortKey]);
  }, [report, search, view, sortKey]);

  async function handleExcel() {
    if (!report) return;
    setIsExporting(true);
    try {
      await downloadProductReportXlsx(
        { ...report, items: rows },
        { shopName, periodLabel: label, t, generatedAt: formatDateTime(new Date()) },
      );
    } finally {
      setIsExporting(false);
    }
  }

  const totals = report?.totals;
  // Footer totals follow the rows shown (search and filter applied).
  const shown = useMemo(() => {
    const add = (f: (i: ProductReportItem) => number, digits = 100) =>
      Math.round(rows.reduce((sum, i) => sum + f(i), 0) * digits) / digits;
    return {
      products: rows.length,
      soldUnits: add((i) => i.sold.units, 1000),
      revenue: add((i) => i.sold.revenue),
      cogs: add((i) => i.sold.cogs),
      profit: add((i) => i.sold.profit),
      restockedUnits: add((i) => i.restocked.units, 1000),
      restockCost: add((i) => i.restocked.cost),
      restockOnCredit: add((i) => i.restocked.onCredit),
    };
  }, [rows]);
  const isFiltered = !!search.trim() || view !== "ALL";

  const pager = usePagination(rows, 20);

  return (
    <div id="product-report" className="space-y-5">
      {/* Only the report prints: hide the app around it */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #product-report, #product-report * { visibility: visible !important; }
          #product-report { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 0; }
          #product-report table { font-size: 9px; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-lg font-bold">{t("reports.product.printHeader", { shop: shopName })}</h1>
        <p className="text-xs text-zinc-600">
          {t("reports.printMeta", { period: label, date: formatDateTime(new Date()) })}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
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
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          {preset === "CUSTOM" && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass} />
              <span>{t("reports.to")}</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={inputClass} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!report}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50"
          >
            <Printer className="size-3.5 text-zinc-500" />
            {t("reports.printPdf")}
          </button>
          <button
            type="button"
            onClick={handleExcel}
            disabled={!report || isExporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" />
            {isExporting ? t("reports.preparing") : t("reports.excel")}
          </button>
        </div>
      </div>

      {result?.error && !isLoading ? (
        <LoadError what={t("reports.what.productReport")} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : (
        <>
          {/* Summary */}
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {t("reports.product.periodCaption", { period: label })}
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: t("reports.product.cardSalesValue"),
                value: totals?.revenue,
                hint: totals ? t("reports.product.hintUnitsSold", { count: formatQuantity(totals.soldUnits) }) : "",
              },
              { label: t("reports.product.cardCogs"), value: totals?.cogs, hint: t("reports.product.hintCogs") },
              {
                label: t("reports.product.cardProfit"),
                value: totals?.profit,
                hint:
                  totals && totals.revenue > 0
                    ? t("reports.product.hintMargin", { pct: ((totals.profit / totals.revenue) * 100).toFixed(1) })
                    : "",
              },
              {
                label: t("reports.product.cardRestock"),
                value: totals?.restockCost,
                hint: totals
                  ? t("reports.product.hintRestock", { paid: etb(totals.restockPaidNow), credit: etb(totals.restockOnCredit) })
                  : "",
              },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{card.label}</p>
                <p className={`mt-1.5 font-mono text-xl font-bold tabular-nums text-zinc-900 ${isLoading ? "opacity-40" : ""}`}>
                  {card.value !== undefined ? etb(card.value) : "—"} <span className="text-xs font-semibold text-zinc-500">{etbLabel}</span>
                </p>
                <p className="mt-1 truncate text-[11px] text-zinc-500">{card.hint}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3 print:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("reports.product.searchPlaceholder")}
                  className={`${inputClass} w-56 pl-8`}
                />
              </div>
              <select value={view} onChange={(e) => setView(e.target.value as View)} className={inputClass}>
                <option value="ALL">{t("reports.product.viewAll")}</option>
                <option value="SOLD">{t("reports.product.viewSold")}</option>
                <option value="RESTOCKED">{t("reports.product.viewRestocked")}</option>
              </select>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={inputClass}>
                <option value="revenue">{t("reports.product.sortRevenue")}</option>
                <option value="units">{t("reports.product.sortUnits")}</option>
                <option value="profit">{t("reports.product.sortProfit")}</option>
                <option value="restock">{t("reports.product.sortRestock")}</option>
              </select>
              <span className="ml-auto text-xs text-zinc-500">
                {t.n("reports.product.periodCount", rows.length, { period: label })}
              </span>
            </div>

            {isLoading ? (
              <ListSkeleton rows={6} />
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-xs text-zinc-500">{t("reports.product.empty")}</p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[900px] text-left text-xs print:min-w-0">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-2.5 font-bold">{t("reports.product.colProduct")}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{t("reports.product.colSold")}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{t("reports.product.colSalesValue")}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{t("reports.product.colCogs")}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{t("reports.product.colProfit")}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{t("reports.product.colRestocked")}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{t("reports.product.colRestockCost")}</th>
                      <th className="px-4 py-2.5 text-right font-bold">{t("reports.product.colStockNow")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((i, index) => (
                      <tr
                        key={i.productId ?? i.name}
                        className={`break-inside-avoid ${isOnPage(pager, index) ? "" : "hidden print:table-row"}`}
                      >
                        <td className="px-4 py-2">
                          <p className="font-medium text-zinc-900">{i.name}</p>
                          <p className="font-mono text-[10px] text-zinc-400">
                            {[i.sku, i.category].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{formatQuantity(i.sold.units, i.unit)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-zinc-900">{etb(i.sold.revenue)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-600">{etb(i.sold.cogs)}</td>
                        <td className={`px-3 py-2 text-right font-mono tabular-nums ${i.sold.profit < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                          {etb(i.sold.profit)}
                          {i.sold.marginPct !== null && <span className="ml-1 text-[10px] text-zinc-400">{i.sold.marginPct}%</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{formatQuantity(i.restocked.units, i.unit)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-600">
                          {etb(i.restocked.cost)}
                          {i.restocked.onCredit > 0 && (
                            <span className="block text-[10px] text-amber-700">{t("reports.product.onCredit", { amount: etb(i.restocked.onCredit) })}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-zinc-600">
                          {i.stock ? formatQuantity(i.stock.onHand, i.unit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-zinc-900 font-semibold text-zinc-900">
                        <td className="px-4 py-2.5">
                          {isFiltered
                            ? t.n("reports.product.totalRowShown", shown.products)
                            : t.n("reports.product.totalRow", shown.products)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{formatQuantity(shown.soldUnits)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{etb(shown.revenue)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{etb(shown.cogs)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{etb(shown.profit)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{formatQuantity(shown.restockedUnits)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{etb(shown.restockCost)}</td>
                        <td className="px-4 py-2.5" />
                      </tr>
                    </tfoot>
                  )}
                </table>
                <TablePagination pagination={pager} noun={t("reports.product.productsNoun")} />
                {isFiltered && (
                  <p className="border-t border-zinc-100 px-4 py-2 text-[11px] text-zinc-500 print:hidden">
                    {t("reports.product.totalNote")}
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
