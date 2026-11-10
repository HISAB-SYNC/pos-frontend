"use client";

import { FileSpreadsheet, Printer, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoadError } from "@/components/shared/load-error";
import { getProductReport } from "@/lib/api/app-data";
import type { ProductReport as ProductReportData, ProductReportItem } from "@/lib/api/types";
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
  const label = periodLabel(preset, range);

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
      await downloadProductReportXlsx({ ...report, items: rows }, { shopName, periodLabel: label });
    } finally {
      setIsExporting(false);
    }
  }

  const t = report?.totals;
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
        <h1 className="text-lg font-bold">{shopName} — Product report</h1>
        <p className="text-xs text-zinc-600">
          Period: {label} · Generated {new Date().toLocaleString("en-GB")}
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
                {p.label}
              </button>
            ))}
          </div>
          {preset === "CUSTOM" && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass} />
              <span>to</span>
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
            Print / PDF
          </button>
          <button
            type="button"
            onClick={handleExcel}
            disabled={!report || isExporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" />
            {isExporting ? "Preparing…" : "Excel"}
          </button>
        </div>
      </div>

      {result?.error && !isLoading ? (
        <LoadError what="the product report" onRetry={() => setReloadKey((k) => k + 1)} />
      ) : (
        <>
          {/* Summary */}
          <p className="-mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {label} · all products
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Sales value", value: t?.revenue, hint: t ? `${formatQuantity(t.soldUnits)} units sold` : "" },
              { label: "Cost of goods", value: t?.cogs, hint: "At buying price when sold" },
              { label: "Gross profit", value: t?.profit, hint: t && t.revenue > 0 ? `${((t.profit / t.revenue) * 100).toFixed(1)}% margin` : "" },
              {
                label: "Restock cost",
                value: t?.restockCost,
                hint: t ? `Paid ${etb(t.restockPaidNow)} · On credit ${etb(t.restockOnCredit)}` : "",
              },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{card.label}</p>
                <p className={`mt-1.5 font-mono text-xl font-bold tabular-nums text-zinc-900 ${isLoading ? "opacity-40" : ""}`}>
                  {card.value !== undefined ? etb(card.value) : "—"} <span className="text-xs font-semibold text-zinc-500">ETB</span>
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
                  placeholder="Search product or SKU"
                  className={`${inputClass} w-56 pl-8`}
                />
              </div>
              <select value={view} onChange={(e) => setView(e.target.value as View)} className={inputClass}>
                <option value="ALL">Sold or restocked</option>
                <option value="SOLD">Sold only</option>
                <option value="RESTOCKED">Restocked only</option>
              </select>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={inputClass}>
                <option value="revenue">Sort: sales value</option>
                <option value="units">Sort: units sold</option>
                <option value="profit">Sort: profit</option>
                <option value="restock">Sort: restock cost</option>
              </select>
              <span className="ml-auto text-xs text-zinc-500">
                {label} · {rows.length} products
              </span>
            </div>

            {isLoading ? (
              <p className="py-12 text-center text-xs text-zinc-400">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-xs text-zinc-500">No products were sold or restocked in this period.</p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[900px] text-left text-xs print:min-w-0">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-2.5 font-bold">Product</th>
                      <th className="px-3 py-2.5 text-right font-bold">Sold</th>
                      <th className="px-3 py-2.5 text-right font-bold">Sales value</th>
                      <th className="px-3 py-2.5 text-right font-bold">Cost of goods</th>
                      <th className="px-3 py-2.5 text-right font-bold">Profit</th>
                      <th className="px-3 py-2.5 text-right font-bold">Restocked</th>
                      <th className="px-3 py-2.5 text-right font-bold">Restock cost</th>
                      <th className="px-4 py-2.5 text-right font-bold">Stock now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((i) => (
                      <tr key={i.productId ?? i.name} className="break-inside-avoid">
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
                            <span className="block text-[10px] text-amber-700">{etb(i.restocked.onCredit)} on credit</span>
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
                        <td className="px-4 py-2.5">Total ({shown.products} {shown.products === 1 ? "product" : "products"}{isFiltered ? " shown" : ""})</td>
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
                {isFiltered && (
                  <p className="border-t border-zinc-100 px-4 py-2 text-[11px] text-zinc-500 print:hidden">
                    The total row covers the products shown. The cards at the top cover every product in the period.
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
