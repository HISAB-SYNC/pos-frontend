"use client";

import { ArrowLeft, ArrowUpDown, ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { LoadError } from "@/components/shared/load-error";
import { RouteGuard } from "@/components/shared/route-guard";
import { getLowStockProducts } from "@/lib/api/shops";
import type { Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { formatQuantity } from "@/lib/utils/units";
import { useShopStore } from "@/stores/shop-store";

type SortKey = "name" | "stock" | "threshold";

const inputClass =
  "h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

export default function LowInventoryPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stock");
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    let mounted = true;
    getLowStockProducts(shopId)
      .then((data) => {
        if (!mounted) return;
        setProducts(Array.isArray(data) ? data : []);
        setLoadError(false);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });
    return () => {
      mounted = false;
    };
  }, [shopId, reloadKey]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const value = (p: Product) =>
      sortKey === "name" ? p.name.toLowerCase() : sortKey === "stock" ? Number(p.stockQuantity) : Number(p.lowStockThreshold);
    return (products ?? [])
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDesc ? -cmp : cmp;
      });
  }, [products, search, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(false);
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
            Back to dashboard
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">Low Inventory Warnings</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Products at or below their minimum stock level{products ? ` · ${products.length} items` : ""}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or SKU..."
            className={`${inputClass} w-full pl-8`}
          />
        </div>

        {loadError && !products ? (
          <LoadError what="low inventory" onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="border-b border-zinc-100 bg-zinc-50/60">
                  <tr>
                    {sortHead("name", "Product")}
                    {sortHead("stock", "In stock", true)}
                    {sortHead("threshold", "Minimum level", true)}
                    <th className="px-4 py-3 text-right font-semibold text-zinc-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {!products ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                        {products.length === 0
                          ? "All catalog items are above their minimum levels."
                          : "No products match your search."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-900">{p.name}</p>
                          {p.sku && <p className="font-mono text-[11px] text-zinc-500">{p.sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 tabular-nums">
                          {formatQuantity(p.stockQuantity, p.unit)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-600 tabular-nums">
                          {formatQuantity(p.lowStockThreshold, p.unit)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/inventory?search=${encodeURIComponent(p.name)}`}
                            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                          >
                            Restock
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
