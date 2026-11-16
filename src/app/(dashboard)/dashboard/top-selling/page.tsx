"use client";

import { ArrowLeft, ArrowUpDown, ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LoadError } from "@/components/shared/load-error";
import { RouteGuard } from "@/components/shared/route-guard";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { getProductReport } from "@/lib/api/app-data";
import type { ProductReport } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { MOCK_IDS } from "@/lib/mock/data";
import { PRESETS, rangeFor, type DateRange, type Preset } from "@/lib/utils/report-range";
import { formatQuantity } from "@/lib/utils/units";
import { useShopStore } from "@/stores/shop-store";

type SortKey = "name" | "units" | "revenue" | "stock";

const inputClass =
  "h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

const PRESET_LABELS: Record<Preset, MessageKey> = {
  TODAY: "kpi.today",
  WEEK: "kpi.week",
  MONTH: "kpi.month",
  ALL: "kpi.all",
  CUSTOM: "dashboard.custom",
};

function etb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function TopSellingPage() {
  const t = useT();
  const { formatDate } = useFormat();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

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
    const value = (i: ProductReport["items"][number]) =>
      sortKey === "name" ? i.name.toLowerCase() : sortKey === "units" ? i.sold.units : sortKey === "revenue" ? i.sold.revenue : i.stock?.onHand ?? 0;
    return report.items
      .filter((i) => i.sold.units > 0)
      .filter((i) => !q || i.name.toLowerCase().includes(q) || (i.sku ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDesc ? -cmp : cmp;
      });
  }, [report, search, sortKey, sortDesc]);

  const pager = usePagination(rows, 20);

  function periodText(p: Preset, r: DateRange) {
    if (p === "ALL" || (!r.from && !r.to)) return t("kpi.all");
    const day = (value: string) => formatDate(`${value}T00:00:00`);
    if (r.from && r.to && r.from === r.to) return day(r.from);
    return t("dashboard.periodRange", {
      from: r.from ? day(r.from) : t("dashboard.periodStart"),
      to: r.to ? day(r.to) : t("shared.today"),
    });
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(key !== "name");
    }
  }

  function sortHead(k: SortKey, label: string, right?: boolean) {
    return (
      <th key={k} className={`px-4 py-3 ${right ? "text-right" : ""}`}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950 ${right ? "flex-row-reverse" : ""}`}
        >
          <span>{label}</span>
          {sortKey === k ? (
            sortDesc ? <ChevronDown className="size-3 text-zinc-900" /> : <ChevronUp className="size-3 text-zinc-900" />
          ) : (
            <ArrowUpDown className="size-3 text-zinc-400" />
          )}
        </button>
      </th>
    );
  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="space-y-5">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950"
          >
            <ArrowLeft className="size-3.5" />
            {t("dashboard.backToDashboard")}
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">{t("dashboard.topSelling")}</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              {t("dashboard.topSellingSub", { period: periodText(preset, range) })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  preset === p.id ? "bg-slate-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {t(PRESET_LABELS[p.id])}
              </button>
            ))}
          </div>
          {preset === "CUSTOM" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass} />
              <span className="text-xs text-zinc-400">{t("dashboard.to")}</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={inputClass} />
            </>
          )}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.searchProduct")}
              className={`${inputClass} w-full pl-8`}
            />
          </div>
        </div>

        {result?.error && !report ? (
          <LoadError what={t("dashboard.whatTopSelling")} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="border-b border-zinc-100 bg-zinc-50/60">
                  <tr>
                    <th className="w-12 px-4 py-3 font-semibold text-zinc-600">#</th>
                    {sortHead("name", t("dashboard.colProduct"))}
                    {sortHead("units", t("dashboard.unitsSold"), true)}
                    {sortHead("revenue", t("kpi.revenue"), true)}
                    {sortHead("stock", t("dashboard.inStock"), true)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        {t("shared.loading")}
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        {t("dashboard.noSalesPeriod")}
                      </td>
                    </tr>
                  ) : (
                    pager.pageItems.map((item, index) => (
                      <tr key={item.productId ?? item.name} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-4 py-3 font-mono text-zinc-400 tabular-nums">{pager.from + index}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-900">{item.name}</p>
                          {item.category && <p className="text-[11px] text-zinc-500">{item.category}</p>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-700 tabular-nums">
                          {formatQuantity(item.sold.units, item.unit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                          {etb(item.sold.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-600 tabular-nums">
                          {item.stock ? formatQuantity(item.stock.onHand, item.unit) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination pagination={pager} noun={t("dashboard.productsNoun")} />
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
