"use client";

import {
  AlertTriangle,
  BarChart3,
  Download,
  Edit2,
  Folder,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { CreateCategoryModal, DeleteCategoryDialog, EditCategoryModal } from "@/components/inventory/category-modals";
import { ExpiryBadge, ProductAvatar, StatusBadge } from "@/components/inventory/product-badges";
import { AddProductModal, DeleteProductDialog, EditProductModal } from "@/components/inventory/product-modals";
import { StockAdjustModal } from "@/components/inventory/stock-adjust-modal";
import { StockLogModal } from "@/components/inventory/stock-log";
import { ReportSortTh } from "@/components/reports/report-controls";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { useDismiss } from "@/hooks/use-dismiss";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { cacheProducts, getCachedProducts, useOfflineStatus } from "@/lib/offline";
import { exportToCsv } from "@/lib/utils/export";
import { formatQuantity } from "@/lib/utils/units";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

type Tab = "products" | "categories";
type StatusFilter = "ALL" | "LOW" | "OUT" | "EXPIRING" | "EXPIRED";
type SortKey = "name" | "stock" | "price" | "value" | "expiry";

const PAGE_SIZE = 15;
const WEEK_MS = 7 * 86400000;

/** `?status=` values used by notification links. */
const STATUS_PARAM: Record<string, StatusFilter> = {
  low: "LOW",
  out: "OUT",
  expiring: "EXPIRING",
  expired: "EXPIRED",
};

const num = (value: string | number | null | undefined) =>
  typeof value === "number" ? value : parseFloat(String(value ?? "0")) || 0;

const etb = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });

function stockState(p: Product, now: number) {
  const qty = p.stockQuantity || 0;
  const threshold = p.lowStockThreshold || 5;
  const exp = p.expiryDate ? new Date(p.expiryDate).getTime() : NaN;
  return {
    out: qty <= 0,
    low: qty > 0 && qty <= threshold,
    expired: !isNaN(exp) && exp <= now,
    expiring: !isNaN(exp) && exp > now && exp <= now + WEEK_MS,
  };
}

const toolbarButton =
  "flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50";

/* ------------------------------------------------------------------ */
/* "More" menu: secondary tools kept out of the header row             */
/* ------------------------------------------------------------------ */
function MoreMenu({ onStockLog }: { onStockLog: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={toolbarButton} aria-label="More tools">
        <MoreHorizontal className="size-4 text-zinc-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-xs shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onStockLog();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ReceiptText className="size-3.5 text-zinc-500" />
            Stock log
          </button>
          <Link
            href="/reports?tab=products"
            className="flex items-center gap-2 px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <BarChart3 className="size-3.5 text-zinc-500" />
            Product report
          </Link>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inventory: products, stock and categories in one place              */
/* ------------------------------------------------------------------ */
function InventoryContent({ initialTab, initialStatus, openAdd }: { initialTab: Tab; initialStatus: StatusFilter; openAdd: boolean }) {
  const shopId = useShopStore((state) => state.activeShopId) ?? MOCK_IDS.shop;
  const user = useAuthStore((state) => state.user);
  const isCashier = user?.role === "SALES";
  const { isOnline, pendingCount } = useOfflineStatus(shopId);
  // Fixed for this visit so expiry checks don't read the clock on every render.
  const [now] = useState(() => Date.now());

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [tab, setTab] = useState<Tab>(isCashier ? "products" : initialTab);
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDesc, setSortDesc] = useState(false);

  // Modals
  const [showAdd, setShowAdd] = useState(openAdd && !isCashier);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
  const [showStockLog, setShowStockLog] = useState(false);
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Everything is loaded once and filtered here, so search is instant and works offline.
  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await getCachedProducts(shopId);
        if (cached && cached.length > 0) setProducts(cached);
        return;
      }
      try {
        const [prods, cats] = await Promise.all([getProducts(shopId), getCategories(shopId)]);
        const list = Array.isArray(prods) ? prods : [];
        setProducts(list);
        setCategories(Array.isArray(cats) ? cats : []);
        if (list.length > 0) cacheProducts(shopId, list).catch(() => {});
      } catch (apiErr) {
        console.warn("Could not load inventory from server, falling back to cache:", apiErr);
        const cached = await getCachedProducts(shopId);
        if (cached && cached.length > 0) setProducts(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- Products tab ---------------- */
  const metrics = useMemo(() => {
    const m = { units: 0, value: 0, low: 0, out: 0, expiring: 0, expired: 0 };
    for (const p of products) {
      const qty = p.stockQuantity || 0;
      const s = stockState(p, now);
      m.units += Math.max(0, qty);
      m.value += Math.max(0, qty) * num(p.price);
      if (s.out) m.out++;
      if (s.low) m.low++;
      if (s.expiring) m.expiring++;
      if (s.expired) m.expired++;
    }
    return m;
  }, [products, now]);

  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
      if (category !== "ALL" && p.category?.name !== category && p.categoryId !== category) return false;
      if (status === "ALL") return true;
      const s = stockState(p, now);
      return status === "LOW" ? s.low : status === "OUT" ? s.out : status === "EXPIRING" ? s.expiring : s.expired;
    });
    const value = (p: Product): string | number => {
      switch (sortKey) {
        case "name":
          return p.name.toLowerCase();
        case "stock":
          return p.stockQuantity || 0;
        case "price":
          return num(p.price);
        case "value":
          return (p.stockQuantity || 0) * num(p.price);
        case "expiry":
          return p.expiryDate ? new Date(p.expiryDate).getTime() || Infinity : Infinity;
      }
    };
    return filtered.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDesc ? -cmp : cmp;
    });
  }, [products, debouncedSearch, category, status, sortKey, sortDesc, now]);

  const pager = usePagination(rows, PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(key !== "name" && key !== "expiry");
    }
  }

  function handleExport() {
    exportToCsv("inventory", rows, [
      { header: "Product", key: "name" },
      { header: "SKU / Barcode", key: "sku" },
      { header: "Category", formatter: (p) => p.category?.name || "General" },
      { header: "Stock", formatter: (p) => formatQuantity(p.stockQuantity) },
      { header: "Unit", formatter: (p) => p.unit || "pcs" },
      { header: "Low stock alert at", formatter: (p) => p.lowStockThreshold || 5 },
      ...(isCashier ? [] : [{ header: "Buying price (ETB)", formatter: (p: Product) => num(p.buyingPrice).toFixed(2) }]),
      { header: "Selling price (ETB)", formatter: (p) => num(p.price).toFixed(2) },
      ...(isCashier
        ? []
        : [{ header: "Stock value (ETB)", formatter: (p: Product) => ((p.stockQuantity || 0) * num(p.price)).toFixed(2) }]),
      { header: "Expiry", formatter: (p) => (p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : "") },
      {
        header: "Status",
        formatter: (p) => {
          const s = stockState(p, now);
          return s.out ? "Out of stock" : s.low ? "Low stock" : "In stock";
        },
      },
    ]);
  }

  /* ---------------- Categories tab ---------------- */
  const productCountByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const id = p.categoryId || p.category?.id;
      if (id) map[id] = (map[id] || 0) + 1;
    }
    return map;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [categories, catSearch]);
  const catPager = usePagination(filteredCategories, PAGE_SIZE);

  /* ---------------- Render ---------------- */
  const statusPills: Array<{ id: StatusFilter; label: string; count: number; active: string }> = [
    { id: "ALL", label: "All", count: products.length, active: "bg-white text-zinc-900 shadow-2xs" },
    { id: "LOW", label: "Low stock", count: metrics.low, active: "bg-amber-600 text-white" },
    { id: "OUT", label: "Out of stock", count: metrics.out, active: "bg-rose-600 text-white" },
    { id: "EXPIRING", label: "Expiring soon", count: metrics.expiring, active: "bg-purple-600 text-white" },
    { id: "EXPIRED", label: "Expired", count: metrics.expired, active: "bg-zinc-800 text-white" },
  ];
  const sortProps = { activeField: sortKey, desc: sortDesc, onSort: toggleSort, className: "px-4 py-3" };
  const colCount = isCashier ? 6 : 8;

  return (
    <>
      <AddProductModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={load}
        shopId={shopId}
        categories={categories}
        isOnline={isOnline}
      />
      <EditProductModal
        product={productToEdit}
        onClose={() => setProductToEdit(null)}
        onUpdated={load}
        shopId={shopId}
        categories={categories}
        onAdjustStock={isOnline ? setProductToAdjust : undefined}
      />
      <DeleteProductDialog product={productToDelete} onClose={() => setProductToDelete(null)} onDeleted={load} shopId={shopId} />
      {productToAdjust && (
        <StockAdjustModal
          key={productToAdjust.id}
          product={productToAdjust}
          onClose={() => setProductToAdjust(null)}
          onAdjusted={load}
          shopId={shopId}
        />
      )}
      {showStockLog && <StockLogModal shopId={shopId} onClose={() => setShowStockLog(false)} />}
      <CreateCategoryModal open={showCreateCat} onClose={() => setShowCreateCat(false)} onCreated={load} shopId={shopId} />
      <EditCategoryModal category={categoryToEdit} onClose={() => setCategoryToEdit(null)} onUpdated={load} shopId={shopId} />
      <DeleteCategoryDialog
        category={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onDeleted={load}
        shopId={shopId}
      />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Inventory</h1>
              {!isOnline && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  <WifiOff className="size-2.5 text-amber-600" />
                  Offline (cached)
                </span>
              )}
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-indigo-500" />
                  {pendingCount} offline queued
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {isCashier
                ? "Look up products, prices and what is in stock."
                : "Your products, stock levels and categories in one place."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleExport} className={toolbarButton}>
              <Download className="size-3.5 text-zinc-500" />
              Export
            </button>
            {!isCashier && <MoreMenu onStockLog={() => setShowStockLog(true)} />}
            {!isCashier && (
              <button
                type="button"
                onClick={() => (tab === "categories" ? setShowCreateCat(true) : setShowAdd(true))}
                className="flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
              >
                <Plus className="size-3.5 text-indigo-400" />
                {tab === "categories" ? "Add Category" : "Add Product"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs (cashiers only see products) */}
        {!isCashier && (
          <div className="flex items-center gap-1 border-b border-zinc-200">
            {(
              [
                { id: "products", label: "Products", icon: Package, count: products.length },
                { id: "categories", label: "Categories", icon: Folder, count: categories.length },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition-colors ${
                  tab === t.id ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <t.icon className="size-3.5" />
                {t.label}
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-zinc-600">
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "products" ? (
          <>
            {/* KPI cards (owners and admins) */}
            {!isCashier && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Units in stock", value: metrics.units.toLocaleString(), unit: "units", hint: `Across ${products.length} products`, icon: Package, tone: "bg-indigo-50 text-[#5B4FE9] ring-[#5B4FE9]/15", text: "text-zinc-900" },
                  { label: "Stock value", value: etb(Math.round(metrics.value)), unit: "ETB", hint: "At selling prices", icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700 ring-emerald-500/15", text: "text-zinc-900" },
                  { label: "Low stock", value: String(metrics.low), unit: "items", hint: "At or below their alert level", icon: AlertTriangle, tone: "bg-amber-50 text-amber-700 ring-amber-500/15", text: "text-amber-900" },
                  { label: "Out of stock", value: String(metrics.out), unit: "items", hint: "Nothing left on hand", icon: PackageX, tone: "bg-rose-50 text-rose-700 ring-rose-500/15", text: "text-rose-700" },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">{card.label}</span>
                      <div className={`flex size-7 items-center justify-center rounded-lg ring-1 ${card.tone}`}>
                        <card.icon className="size-3.5" />
                      </div>
                    </div>
                    <p className={`mt-2 font-mono text-xl font-bold tabular-nums ${card.text}`}>
                      {isLoading ? "—" : card.value}{" "}
                      <span className="font-sans text-xs font-normal text-zinc-500">{card.unit}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">{card.hint}</p>
                  </div>
                ))}
              </div>
            )}

            <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
              {/* Filters */}
              <div className="flex flex-col gap-2.5 border-b border-zinc-200/80 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 text-xs font-medium scrollbar-none">
                  {statusPills.map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setStatus(pill.id)}
                      className={`whitespace-nowrap rounded-md px-2.5 py-1.5 transition-all ${
                        status === pill.id ? `${pill.active} font-semibold` : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      {pill.label} <span className="font-mono text-[11px] opacity-75">{pill.count}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or SKU"
                      className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 max-w-40 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 focus:border-[#5B4FE9] focus:outline-hidden"
                  >
                    <option value="ALL">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <ReportSortTh label="Product" field="name" {...sortProps} className="px-5 py-3" />
                      <th className="px-4 py-3 font-bold">Category</th>
                      <ReportSortTh label="Price" field="price" right {...sortProps} />
                      <ReportSortTh label="Stock" field="stock" right {...sortProps} />
                      {!isCashier && <ReportSortTh label="Value" field="value" right {...sortProps} />}
                      <ReportSortTh label="Expiry" field="expiry" {...sortProps} />
                      <th className="px-4 py-3 font-bold">Status</th>
                      {!isCashier && <th className="px-5 py-3 text-right font-bold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={colCount} className="py-10">
                          <LoadingState />
                        </td>
                      </tr>
                    ) : pager.pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={colCount} className="py-12 text-center text-zinc-400">
                          {products.length === 0 ? "No products yet." : "No products match these filters."}
                        </td>
                      </tr>
                    ) : (
                      pager.pageItems.map((p) => {
                        const qty = p.stockQuantity || 0;
                        const price = num(p.price);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => !isCashier && isOnline && setProductToEdit(p)}
                            className={`transition-colors hover:bg-zinc-50/70 ${!isCashier && isOnline ? "cursor-pointer" : ""}`}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <ProductAvatar name={p.name} className="size-8 text-xs" />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-zinc-900">{p.name}</p>
                                  <p className="font-mono text-[10px] text-zinc-400">{p.sku || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-600">{p.category?.name || "General"}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              <p className="font-bold text-zinc-900">{etb(price)} ETB</p>
                              {!isCashier && p.buyingPrice ? (
                                <p className="text-[10px] text-zinc-400">cost {etb(num(p.buyingPrice))}</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              <p className="font-bold text-zinc-900">{formatQuantity(qty, p.unit || "pcs")}</p>
                              <p className="text-[10px] text-zinc-400">alert at {p.lowStockThreshold || 5}</p>
                            </td>
                            {!isCashier && (
                              <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-zinc-700">
                                {etb(Math.max(0, qty) * price)}
                              </td>
                            )}
                            <td className="px-4 py-3 font-mono">
                              <ExpiryBadge expiryDate={p.expiryDate} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge quantity={qty} threshold={p.lowStockThreshold || 5} />
                            </td>
                            {!isCashier && (
                              <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    disabled={!isOnline}
                                    onClick={() => setProductToAdjust(p)}
                                    title={isOnline ? "Restock, remove or count stock" : "Not available offline"}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-700 shadow-2xs transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <SlidersHorizontal className="size-3 text-zinc-500" />
                                    Adjust stock
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!isOnline}
                                    onClick={() => setProductToEdit(p)}
                                    title={isOnline ? "Edit product" : "Not available offline"}
                                    className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!isOnline}
                                    onClick={() => setProductToDelete(p)}
                                    title={isOnline ? "Delete product" : "Not available offline"}
                                    className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination pagination={pager} noun="products" />
            </section>
          </>
        ) : (
          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 p-3">
              <p className="text-xs text-zinc-500">Group products so they are easier to find in POS and reports.</p>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search categories"
                  className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold">Products</th>
                    <th className="px-4 py-3 font-bold">ID</th>
                    <th className="px-5 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {catPager.pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <p className="text-xs font-bold text-zinc-800">No categories found</p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {catSearch ? "No categories match your search." : "Create your first category to group products."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    catPager.pageItems.map((cat) => {
                      const count = productCountByCat[cat.id] || 0;
                      return (
                        <tr key={cat.id} className="transition-colors hover:bg-zinc-50/70">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                                <Tag className="size-3.5" />
                              </div>
                              <span className="font-semibold text-zinc-900">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setCategory(cat.name);
                                setStatus("ALL");
                                setTab("products");
                              }}
                              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700 hover:border-[#5B4FE9] hover:text-[#5B4FE9]"
                              title="Show these products"
                            >
                              {count} {count === 1 ? "product" : "products"}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                            #CAT-{cat.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setCategoryToEdit(cat)}
                                title="Rename category"
                                className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCategoryToDelete(cat)}
                                title="Delete category"
                                className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination pagination={catPager} noun="categories" />
          </section>
        )}
      </div>
    </>
  );
}

/** Reads `?tab=`, `?status=` and `?add=1` (used by notifications and the command palette). */
function InventoryFromUrl() {
  const params = useSearchParams();
  const initialTab: Tab = params.get("tab") === "categories" ? "categories" : "products";
  const initialStatus = STATUS_PARAM[params.get("status") ?? ""] ?? "ALL";
  const openAdd = params.get("add") === "1";
  // Remount when the link changes so a new ?status= from a notification applies.
  return <InventoryContent key={params.toString()} initialTab={initialTab} initialStatus={initialStatus} openAdd={openAdd} />;
}

export default function InventoryPage() {
  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SALES", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <Suspense fallback={<LoadingState />}>
        <InventoryFromUrl />
      </Suspense>
    </RouteGuard>
  );
}
