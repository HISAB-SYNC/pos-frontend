"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductAvatar, ExpiryBadge } from "@/app/(dashboard)/products/page";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import {
  getCategories,
  getProducts,
  updateProduct,
} from "@/lib/api";
import type { Category, Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Stock Adjustment                                            */
/* ------------------------------------------------------------------ */
function StockAdjustModal({
  product,
  onClose,
  onAdjusted,
  shopId,
}: {
  product: Product | null;
  onClose: () => void;
  onAdjusted: () => void;
  shopId: string;
}) {
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "REMOVE" | "SET">("ADD");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Restock / New Shipment");
  const [storeLocation, setStoreLocation] = useState("Main Store");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const currentQty = product.stockQuantity || 0;
  const adjustQtyNum = parseInt(quantity, 10) || 0;

  let newQuantity = currentQty;
  if (adjustmentType === "ADD") newQuantity = currentQty + adjustQtyNum;
  else if (adjustmentType === "REMOVE") newQuantity = Math.max(0, currentQty - adjustQtyNum);
  else if (adjustmentType === "SET") newQuantity = Math.max(0, adjustQtyNum);

  const delta = newQuantity - currentQty;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !quantity || adjustQtyNum <= 0) return;

    setIsSubmitting(true);
    try {
      await updateProduct(shopId, product.id, {
        stockQuantity: newQuantity,
      });

      onAdjusted();
      onClose();
    } catch (err) {
      console.error(err);
      onAdjusted();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">Adjust Inventory Stock</h2>
            <p className="text-xs text-zinc-500">
              Product: <span className="font-semibold text-zinc-800">{product.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">Adjustment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("ADD")}
                className={`rounded-md border py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "ADD"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("REMOVE")}
                className={`rounded-md border py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "REMOVE"
                    ? "border-rose-600 bg-rose-50 text-rose-800 shadow-2xs"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                }`}
              >
                - Deduct Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("SET")}
                className={`rounded-md border py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "SET"
                    ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                }`}
              >
                Set Fixed Qty
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">
                {adjustmentType === "SET" ? "New Total Count *" : "Quantity to Adjust *"}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-zinc-700">Store Location</label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-zinc-700">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            >
              <option value="Restock / New Shipment">Restock / New Shipment</option>
              <option value="Damage / Wastage">Damage / Wastage / Expired</option>
              <option value="Inventory Audit Count Correction">Inventory Audit Count Correction</option>
              <option value="Customer Return">Customer Return</option>
              <option value="Internal Transfer">Internal Store Transfer</option>
            </select>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="rounded-md border border-zinc-200 bg-zinc-50/80 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Current Stock:</span>
              <span className="font-mono font-semibold text-zinc-800 tabular-nums">{currentQty} {product.unit || "pcs"}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs border-t border-zinc-200/60 pt-1.5">
              <span className="text-zinc-600 font-medium">New Calculated Stock:</span>
              <div className="flex items-center gap-2">
                {adjustQtyNum > 0 && (
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-zinc-500"
                    }`}
                  >
                    ({delta > 0 ? `+${delta}` : delta})
                  </span>
                )}
                <span className="font-mono font-bold text-zinc-900 tabular-nums text-sm">
                  {newQuantity} {product.unit || "pcs"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !quantity || parseInt(quantity, 10) <= 0}
              className="rounded-md bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Adjusting..." : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Inventory Page                                                */
/* ------------------------------------------------------------------ */
export default function InventoryPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRING">("ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getProducts(shopId, { search: debouncedSearch || undefined }),
        getCategories(shopId),
      ]);
      setProducts(prods ?? []);
      setCategories(cats ?? []);
    } catch (err) {
      console.warn("Could not load inventory data:", err);
      setProducts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Inventory KPI Metrics
  const metrics = useMemo(() => {
    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    let totalValuation = 0;

    for (const p of products) {
      const qty = p.stockQuantity || 0;
      const price = typeof p.price === "number" ? p.price : parseFloat(p.price) || 0;
      totalItems += qty;
      totalValuation += qty * price;

      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= (p.lowStockThreshold || 5)) {
        lowStockCount++;
      }

      if (p.expiryDate) {
        const expTime = new Date(p.expiryDate).getTime();
        if (!isNaN(expTime) && expTime <= Date.now() + 7 * 86400000) {
          expiringCount++;
        }
      }
    }

    return {
      totalProducts: products.length,
      totalItems,
      lowStockCount,
      outOfStockCount,
      expiringCount,
      totalValuation,
    };
  }, [products]);

  // Filtered Products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "ALL") {
        const catMatch = p.categoryId === selectedCategory || p.category?.name === selectedCategory;
        if (!catMatch) return false;
      }

      const qty = p.stockQuantity || 0;
      const threshold = p.lowStockThreshold || 5;

      if (selectedStatus === "OUT_OF_STOCK" && qty > 0) return false;
      if (selectedStatus === "LOW_STOCK" && (qty === 0 || qty > threshold)) return false;
      if (selectedStatus === "IN_STOCK" && qty <= threshold) return false;
      if (selectedStatus === "EXPIRING") {
        if (!p.expiryDate) return false;
        const expTime = new Date(p.expiryDate).getTime();
        if (isNaN(expTime) || expTime > Date.now() + 7 * 86400000) return false;
      }

      return true;
    });
  }, [products, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  function handleExportCsv() {
    exportToCsv("inventory-stock-levels", filtered, [
      { header: "Product Name", key: "name" },
      { header: "SKU / Barcode", key: "sku" },
      {
        header: "Category",
        formatter: (item) => item.category?.name || "General",
      },
      { header: "In-Stock Quantity", key: "stockQuantity" },
      { header: "Low Stock Alert Level", formatter: (item) => item.lowStockThreshold || 5 },
      {
        header: "Unit Price (ETB)",
        formatter: (item) => parseFloat(item.price || "0").toFixed(2),
      },
      {
        header: "Inventory Asset Value (ETB)",
        formatter: (item) =>
          ((item.stockQuantity || 0) * (parseFloat(item.price || "0") || 0)).toFixed(2),
      },
      {
        header: "Status",
        formatter: (item) => {
          const qty = item.stockQuantity || 0;
          if (qty === 0) return "Out of Stock";
          if (qty <= (item.lowStockThreshold || 5)) return "Low Stock";
          return "In Stock";
        },
      },
    ]);
  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <StockAdjustModal
        product={productToAdjust}
        onClose={() => setProductToAdjust(null)}
        onAdjusted={loadData}
        shopId={shopId}
      />

      <div className="space-y-6">
        {/* ------------------------------------------------------------------ */}
        {/* 1. Header Toolbar & Title                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Inventory &amp; Stock Levels</h1>
            <p className="text-xs text-zinc-500">
              Monitor real-time availability, reorder thresholds, and perform instant stock count adjustments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
            >
              <Download className="size-3.5 text-zinc-500" />
              Export Inventory
            </button>
            <Link
              href="/products"
              className="flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
            >
              <Package className="size-3.5 text-indigo-400" />
              Manage Catalog
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Top Metric Cards                                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total In-Stock Units</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/15">
                <Package className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.totalItems.toLocaleString()} <span className="font-sans text-xs font-normal text-zinc-500">units</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Across {metrics.totalProducts} catalog products</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Inventory Valuation</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/15">
                <PackageCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.totalValuation.toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-emerald-600">Based on catalog retail prices</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Low Stock Warnings</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-500/15">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-amber-900 tabular-nums">
              {metrics.lowStockCount} <span className="font-sans text-xs font-normal text-zinc-500">items</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Below minimum reorder threshold</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Depleted / Stockout</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-500/15">
                <PackageX className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
              {metrics.outOfStockCount} <span className="font-sans text-xs font-normal text-zinc-500">items</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-rose-600">Zero units on hand</p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 3. Main Stock Table & Filters                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelectedStatus("ALL")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  selectedStatus === "ALL"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All Items <span className="font-mono text-[11px] opacity-75">({products.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("LOW_STOCK")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  selectedStatus === "LOW_STOCK"
                    ? "bg-amber-600 text-white font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-amber-700"
                }`}
              >
                Low Stock <span className="font-mono text-[11px] opacity-85">({metrics.lowStockCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("OUT_OF_STOCK")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  selectedStatus === "OUT_OF_STOCK"
                    ? "bg-rose-600 text-white font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-rose-700"
                }`}
              >
                Out of Stock <span className="font-mono text-[11px] opacity-85">({metrics.outOfStockCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("EXPIRING")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  selectedStatus === "EXPIRING"
                    ? "bg-purple-600 text-white font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-purple-700"
                }`}
              >
                Expiring Soon <span className="font-mono text-[11px] opacity-85">({metrics.expiringCount})</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item / SKU..."
                  className="h-9 w-full sm:w-48 rounded-md border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 w-full sm:w-auto rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-[#5B4FE9] focus:outline-hidden"
              >
                <option value="ALL">All Categories</option>
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
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left">
                  <th className="px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Product</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">SKU</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Category</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">In-Stock Quantity</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Unit Price</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Asset Valuation</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Expiry Date</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Stock Status</th>
                  <th className="px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-zinc-400">
                      No inventory items found matching filters.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((product) => {
                    const qty = product.stockQuantity || 0;
                    const threshold = product.lowStockThreshold || 5;
                    const price = typeof product.price === "number" ? product.price : parseFloat(product.price) || 0;
                    const val = qty * price;

                    const isOut = qty === 0;
                    const isLow = !isOut && qty <= threshold;

                    return (
                      <tr key={product.id} className="transition-colors hover:bg-zinc-50/60">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <ProductAvatar name={product.name} className="size-8 text-xs" />
                            <div>
                              <span className="font-semibold text-zinc-900">
                                {product.name}
                              </span>
                              <p className="font-mono text-[10px] text-zinc-400">Min alert: {threshold} pcs</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-zinc-500">{product.sku || "—"}</td>
                        <td className="px-4 py-3.5 text-zinc-600">{product.category?.name || "General"}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-zinc-900 tabular-nums">
                          {qty} <span className="font-sans text-[10px] font-normal text-zinc-500">{product.unit || "pcs"}</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-zinc-600 tabular-nums">{price.toLocaleString()} ETB</td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-zinc-900 tabular-nums">
                          {val.toLocaleString()} ETB
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <ExpiryBadge expiryDate={product.expiryDate} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                              isOut
                                ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                                : isLow
                                ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            }`}
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setProductToAdjust(product)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900 transition-all active:scale-95"
                          >
                            <SlidersHorizontal className="size-3 text-zinc-500" />
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/30 px-6 py-3.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
            >
              Previous
            </button>

            <span className="font-mono text-xs text-zinc-500 tabular-nums">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
