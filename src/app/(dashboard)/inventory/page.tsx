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

import { ProductAvatar } from "@/app/(dashboard)/products/page";
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
  const [reason, setReason] = useState("Restock");
  const [storeLocation, setStoreLocation] = useState("Main Store");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const currentQty = product.stockQuantity || 0;
  const adjustQtyNum = parseInt(quantity, 10) || 0;

  let newQuantity = currentQty;
  if (adjustmentType === "ADD") newQuantity = currentQty + adjustQtyNum;
  else if (adjustmentType === "REMOVE") newQuantity = Math.max(0, currentQty - adjustQtyNum);
  else if (adjustmentType === "SET") newQuantity = Math.max(0, adjustQtyNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !quantity || adjustQtyNum <= 0) return;

    setIsSubmitting(true);
    try {
      // 1. Update product stock quantity
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Adjust Stock</h2>
            <p className="text-xs text-[#6b7280]">
              Product: <span className="font-semibold text-[#111827]">{product.name}</span> (Current: {currentQty} pcs)
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-[#374151]">Adjustment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("ADD")}
                className={`rounded-xl border py-2 font-medium transition-all ${
                  adjustmentType === "ADD"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-[#e5e7eb] hover:bg-slate-50 text-[#4b5563]"
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("REMOVE")}
                className={`rounded-xl border py-2 font-medium transition-all ${
                  adjustmentType === "REMOVE"
                    ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                    : "border-[#e5e7eb] hover:bg-slate-50 text-[#4b5563]"
                }`}
              >
                - Deduct Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("SET")}
                className={`rounded-xl border py-2 font-medium transition-all ${
                  adjustmentType === "SET"
                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-[#e5e7eb] hover:bg-slate-50 text-[#4b5563]"
                }`}
              >
                Set Fixed Qty
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-[#374151]">
                {adjustmentType === "SET" ? "New Total Count *" : "Quantity to Adjust *"}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 10"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 font-semibold text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Store Location</label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[#374151]">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              <option value="Restock / New Shipment">Restock / New Shipment</option>
              <option value="Damage / Wastage">Damage / Wastage / Expired</option>
              <option value="Inventory Audit Count Correction">Inventory Audit Count Correction</option>
              <option value="Customer Return">Customer Return</option>
              <option value="Internal Transfer">Internal Store Transfer</option>
            </select>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6b7280]">Current Stock:</span>
              <span className="font-semibold text-[#111827]">{currentQty} pcs</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-[#6b7280]">New Calculated Stock:</span>
              <span className="font-bold text-[#2563eb]">{newQuantity} pcs</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !quantity || parseInt(quantity, 10) <= 0}
              className="rounded-xl bg-[#c0e763] px-5 py-2 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
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
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
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
    }

    return {
      totalProducts: products.length,
      totalItems,
      lowStockCount,
      outOfStockCount,
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
            <h1 className="text-xl font-bold text-[#111827]">Inventory &amp; Stock Levels</h1>
            <p className="text-xs text-[#6b7280]">
              Monitor product availability, low-stock alerts, and perform real-time inventory adjustments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] shadow-sm transition-colors hover:bg-[#f9fafb]"
            >
              <Download className="size-3.5 text-[#6b7280]" />
              Export Inventory
            </button>
            <Link
              href="/products"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#c0e763] px-4 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
            >
              <Package className="size-3.5" />
              Manage Catalog
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Top Metric Cards                                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Units in Stock</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#f3fad9] text-zinc-950 ring-1 ring-[#c0e763]/60">
                <Package className="size-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.totalItems.toLocaleString()} <span className="font-sans text-xs font-normal text-zinc-500">units</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Across {metrics.totalProducts} catalog products</p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Inventory Valuation</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20">
                <PackageCheck className="size-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.totalValuation.toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-emerald-600">Based on catalog retail prices</p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Low Stock Warnings</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-500/20">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-amber-900 tabular-nums">
              {metrics.lowStockCount} <span className="font-sans text-xs font-normal text-zinc-500">items</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Below minimum reorder threshold</p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Depleted / Stockout</span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-500/20">
                <PackageX className="size-4" />
              </div>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-red-700 tabular-nums">
              {metrics.outOfStockCount} <span className="font-sans text-xs font-normal text-zinc-500">items</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-red-600">Zero units on hand</p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 3. Main Stock Table & Filters                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-[#e5e7eb] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelectedStatus("ALL")}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  selectedStatus === "ALL"
                    ? "bg-white text-[#111827] shadow-sm font-semibold"
                    : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                All Items ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("LOW_STOCK")}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  selectedStatus === "LOW_STOCK"
                    ? "bg-amber-500 text-white shadow-sm font-semibold"
                    : "text-[#6b7280] hover:text-amber-600"
                }`}
              >
                Low Stock ({metrics.lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("OUT_OF_STOCK")}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  selectedStatus === "OUT_OF_STOCK"
                    ? "bg-red-600 text-white shadow-sm font-semibold"
                    : "text-[#6b7280] hover:text-red-600"
                }`}
              >
                Out of Stock ({metrics.outOfStockCount})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item / SKU..."
                  className="h-9 w-full sm:w-48 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] pl-8 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 w-full sm:w-auto rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] focus:border-[#2563eb] focus:outline-none"
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
                <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">In-Stock Quantity</th>
                  <th className="px-4 py-3 font-medium">Unit Price</th>
                  <th className="px-4 py-3 font-medium">Asset Valuation</th>
                  <th className="px-4 py-3 font-medium">Stock Status</th>
                  <th className="px-6 py-3 font-medium text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[#9ca3af]">
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
                      <tr key={product.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <ProductAvatar name={product.name} className="size-8 text-sm" />
                            <div>
                              <Link
                                href={`/products/${product.id}`}
                                className="font-semibold text-[#111827] hover:text-[#2563eb]"
                              >
                                {product.name}
                              </Link>
                              <p className="text-[10px] text-[#9ca3af]">Min alert: {threshold} pcs</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#4b5563]">{product.sku || "—"}</td>
                        <td className="px-4 py-3.5 text-[#374151]">{product.category?.name || "General"}</td>
                        <td className="px-4 py-3.5 font-bold text-[#111827]">
                          {qty} <span className="text-[10px] font-normal text-[#6b7280]">{product.unit || "pcs"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-[#374151]">{price.toLocaleString()} ETB</td>
                        <td className="px-4 py-3.5 font-semibold text-[#111827]">
                          {val.toLocaleString()} ETB
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              isOut
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : isLow
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock Alert" : "Well Stocked"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setProductToAdjust(product)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-xs font-semibold text-[#111827] shadow-sm hover:bg-[#f9fafb] hover:border-[#2563eb] hover:text-[#2563eb] transition-all"
                          >
                            <SlidersHorizontal className="size-3" />
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
          <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-xs text-[#6b7280]">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
