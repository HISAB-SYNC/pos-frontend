"use client";

import {
  Download,
  Edit2,
  Filter,
  Folder,
  Package,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDismiss } from "@/hooks/use-dismiss";
import { useOfflineStatus, getCachedProducts, cacheProducts } from "@/lib/offline";
import { getCategories, getProducts } from "@/lib/api";
import type { Category, Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { formatQuantity } from "@/lib/utils/units";
import { exportToCsv } from "@/lib/utils/export";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";
import { ExpiryBadge, ProductAvatar, StatusBadge } from "@/components/inventory/product-badges";
import { AddProductModal, DeleteProductDialog, EditProductModal } from "@/components/inventory/product-modals";
import { CreateCategoryModal, DeleteCategoryDialog, EditCategoryModal } from "@/components/inventory/category-modals";

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

export default function ProductsPage() {
  // Fixed for this visit so expiry checks don't read the clock on every render.
  const [pageOpenedAt] = useState(() => Date.now());
  const router = useRouter();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;
  const user = useAuthStore((state) => state.user);
  const isCashier = user?.role === "SALES";

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Active Tab: Products vs Categories
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  // Category Modals & Search State
  const [showCreateCatModal, setShowCreateCatModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [catSearch, setCatSearch] = useState("");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | "AVAILABLE" | "LOW_STOCK" | "EXPIRING_SOON" | "EXPIRED"
  >("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useDismiss<HTMLDivElement>(showFilterDropdown, () => setShowFilterDropdown(false));

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { isOnline, pendingCount } = useOfflineStatus(shopId);

  const load = useCallback(async () => {
    if (!shopId) return;
    try {
      setIsLoading(true);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await getCachedProducts(shopId);
        if (cached && cached.length > 0) {
          setAllProducts(cached);
        }
        return;
      }

      try {
        const [prodsData, catsData] = await Promise.all([
          getProducts(shopId),
          getCategories(shopId),
        ]);
        const validProds = Array.isArray(prodsData) ? prodsData : [];
        setAllProducts(validProds);
        setCategories(Array.isArray(catsData) ? catsData : []);
        if (validProds.length > 0) {
          cacheProducts(shopId, validProds).catch(() => {});
        }
      } catch (apiErr) {
        console.warn("Could not load products from server, falling back to cache:", apiErr);
        const cached = await getCachedProducts(shopId);
        if (cached && cached.length > 0) {
          setAllProducts(cached);
        }
      }
    } catch (err) {
      console.warn("Could not load products:", err);
      setAllProducts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  // Map product counts per category
  const productCountByCat = useMemo(() => {
    const map: Record<string, number> = {};
    allProducts.forEach((p) => {
      const cId = p.categoryId || p.category?.id;
      if (cId) {
        map[cId] = (map[cId] || 0) + 1;
      }
    });
    return map;
  }, [allProducts]);

  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(catSearch.toLowerCase()),
    );
  }, [categories, catSearch]);

  // Filter products client-side
  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesCat =
        selectedCategory === "ALL" ||
        p.category?.name === selectedCategory ||
        p.categoryId === selectedCategory;

      const isLow = p.stockQuantity <= (p.lowStockThreshold || 5);
      const nowTime = pageOpenedAt;
      const expTime = p.expiryDate ? new Date(p.expiryDate).getTime() : NaN;
      const isExpiringSoon = !isNaN(expTime) && expTime > nowTime && expTime <= nowTime + 7 * 86400000;
      const isExpired = !isNaN(expTime) && expTime <= nowTime;

      let matchesStatus = selectedStatus === "ALL";
      if (selectedStatus === "LOW_STOCK") matchesStatus = isLow;
      else if (selectedStatus === "AVAILABLE") matchesStatus = !isLow;
      else if (selectedStatus === "EXPIRING_SOON") matchesStatus = isExpiringSoon;
      else if (selectedStatus === "EXPIRED") matchesStatus = isExpired;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [allProducts, debouncedSearch, selectedCategory, selectedStatus, pageOpenedAt]);

  const [sortField, setSortField] = useState<"name" | "price" | "stock" | "expiry">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(field: "name" | "price" | "stock" | "expiry") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortedProducts = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "price") {
        cmp = parseFloat(a.price || "0") - parseFloat(b.price || "0");
      } else if (sortField === "stock") {
        cmp = a.stockQuantity - b.stockQuantity;
      } else if (sortField === "expiry") {
        const timeA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const timeB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        cmp = timeA - timeB;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sortedProducts.length / PAGE_SIZE) || 1;
  const products = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatPrice(val: number | string | undefined): string {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(Number(num)) ? "ETB 0.00" : `ETB ${Number(num).toFixed(2)}`;
  }

  function handleDownload() {
    const columns: Array<{ header: string; key?: any; formatter?: (item: Product) => any }> = [
      { header: "Product Name", key: "name" },
      { header: "SKU / Barcode", key: "sku" },
      {
        header: "Category",
        formatter: (item) => item.category?.name || "General",
      },
      { header: "Stock Quantity", key: "stockQuantity" },
      { header: "Unit", formatter: (item) => item.unit || "pcs" },
    ];

    if (!isCashier) {
      columns.push({
        header: "Buying Price (ETB)",
        formatter: (item) => (item.buyingPrice ? parseFloat(String(item.buyingPrice)).toFixed(2) : "0.00"),
      });
    }

    columns.push(
      {
        header: "Price (ETB)",
        formatter: (item) => (parseFloat(item.price || "0")).toFixed(2),
      },
      {
        header: "Status",
        formatter: (item) =>
          item.stockQuantity <= (item.lowStockThreshold || 5) ? "Low stock" : "Available",
      },
    );

    exportToCsv("products-catalog", filtered, columns);
  }

  return (
    <>
      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
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
      />

      <DeleteProductDialog
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onDeleted={load}
        shopId={shopId}
      />

      <CreateCategoryModal
        open={showCreateCatModal}
        onClose={() => setShowCreateCatModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <EditCategoryModal
        category={categoryToEdit}
        onClose={() => setCategoryToEdit(null)}
        onUpdated={load}
        shopId={shopId}
      />

      <DeleteCategoryDialog
        category={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onDeleted={load}
        shopId={shopId}
      />

      <div className="space-y-4">
        {/* Top-Level Catalog Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === "products"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Package className="size-4" />
            <span>Products Catalog</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-700">
              {allProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Folder className="size-4" />
            <span>Categories Directory</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-700">
              {categories.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Products Catalog */}
        {activeTab === "products" && (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-3.5 sm:px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight">Products</h1>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
                  {filtered.length}
                </span>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-300">
                    <WifiOff className="size-2.5 text-amber-600" />
                    <span>Offline (Cached)</span>
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                    <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>{pendingCount} offline queued</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="h-8 w-48 rounded-lg border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Filters Button & Dropdown */}
                <div className="relative" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                      selectedCategory !== "ALL" || selectedStatus !== "ALL"
                        ? "border-[#5B4FE9] bg-[#5B4FE9]/10 text-zinc-950 font-semibold"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <Filter className="size-3.5" />
                    <span>Filters</span>
                    {(selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
                      <span className="size-1.5 rounded-full bg-[#5B4FE9]" />
                    )}
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 top-10 z-30 w-64 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xl text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="font-bold text-zinc-900">Filter Products</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("ALL");
                            setSelectedStatus("ALL");
                            setShowFilterDropdown(false);
                          }}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900"
                        >
                          <RotateCcw className="size-3" />
                          Reset
                        </button>
                      </div>

                      <div>
                        <label className="mb-1 block font-medium text-zinc-600">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="h-8 w-full rounded-md border border-zinc-200 px-2 text-zinc-900"
                        >
                          <option value="ALL">All Categories</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block font-medium text-zinc-600">Stock Status</label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value as any)}
                          className="h-8 w-full rounded-md border border-zinc-200 px-2 text-zinc-900"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="LOW_STOCK">Low stock</option>
                          <option value="EXPIRING_SOON">Expiring soon (≤7d)</option>
                          <option value="EXPIRED">Expired</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Download CSV */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Download className="size-3.5" />
                  <span>Download all</span>
                </button>

                {/* Add Product Button */}
                {!isCashier && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
                  >
                    <Plus className="size-3.5 text-indigo-400" />
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/70 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th
                      onClick={() => handleSort("name")}
                      className="px-5 py-3 font-semibold cursor-pointer hover:text-zinc-900 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Product</span>
                        {sortField === "name" && (
                          <span className="text-zinc-950 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th
                      onClick={() => handleSort("stock")}
                      className="px-5 py-3 font-semibold cursor-pointer hover:text-zinc-900 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Stock</span>
                        {sortField === "stock" && (
                          <span className="text-zinc-950 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    {!isCashier && <th className="px-5 py-3 font-semibold">Cost Price</th>}
                    <th
                      onClick={() => handleSort("price")}
                      className="px-5 py-3 font-semibold cursor-pointer hover:text-zinc-900 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Selling Price</span>
                        {sortField === "price" && (
                          <span className="text-zinc-950 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("expiry")}
                      className="px-5 py-3 font-semibold cursor-pointer hover:text-zinc-900 select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Expiry</span>
                        {sortField === "expiry" && (
                          <span className="text-zinc-950 font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    {!isCashier && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={isCashier ? 6 : 8} className="py-12 text-center text-zinc-400">
                        Loading products catalog...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={isCashier ? 6 : 8} className="py-12 text-center text-zinc-400">
                        No products found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => {
                          if (!isCashier) setProductToEdit(product);
                        }}
                        className={`transition-colors hover:bg-zinc-50/80 ${!isCashier ? "cursor-pointer" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <ProductAvatar name={product.name} />
                            <div>
                              <p className="font-semibold text-zinc-900">{product.name}</p>
                              <p className="font-mono text-[11px] text-zinc-400">{product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-700">
                          {product.category?.name ?? "General"}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-medium text-zinc-900 tabular-nums">
                          {formatQuantity(product.stockQuantity, product.unit || "pcs")}
                        </td>
                        {!isCashier && (
                          <td className="px-5 py-3.5 font-mono text-zinc-500 tabular-nums">
                            {product.buyingPrice ? formatPrice(product.buyingPrice) : "—"}
                          </td>
                        )}
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 tabular-nums">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          <ExpiryBadge expiryDate={product.expiryDate} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            quantity={product.stockQuantity}
                            threshold={product.lowStockThreshold || 5}
                          />
                        </td>
                        {!isCashier && (
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1 text-zinc-400">
                              <button
                                type="button"
                                disabled={!isOnline}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isOnline) setProductToEdit(product);
                                }}
                                title={!isOnline ? "Editing products is disabled in offline mode" : "Edit Product"}
                                className="rounded p-1 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={!isOnline}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isOnline) setProductToDelete(product);
                                }}
                                title={!isOnline ? "Deleting products is disabled in offline mode" : "Delete Product"}
                                className="rounded p-1 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
                <div>
                  Showing <span className="font-semibold text-zinc-900 font-mono">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                  <span className="font-semibold text-zinc-900 font-mono">
                    {Math.min(page * PAGE_SIZE, filtered.length)}
                  </span>{" "}
                  of <span className="font-semibold text-zinc-900 font-mono">{filtered.length}</span> items
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded border border-zinc-200 px-2.5 py-1 font-medium hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono text-xs">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded border border-zinc-200 px-2.5 py-1 font-medium hover:bg-zinc-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Categories Directory */}
        {activeTab === "categories" && (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-3.5 sm:px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
                  <Folder className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Category Directory</h2>
                  <p className="text-[11px] text-zinc-500">Manage category classifications and groups</p>
                </div>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
                  {categories.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="h-8 w-48 rounded-lg border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none"
                  />
                </div>
                {!isCashier && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCatModal(true)}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
                  >
                    <Plus className="size-3.5 text-indigo-400" />
                    <span>Add Category</span>
                  </button>
                )}
              </div>
            </div>

            {/* Categories Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Category Name</th>
                    <th className="px-5 py-3 font-semibold">Products Assigned</th>
                    <th className="px-5 py-3 font-semibold">Identifier</th>
                    {!isCashier && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={isCashier ? 3 : 4} className="py-12 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                          <Folder className="size-6" />
                        </div>
                        <p className="mt-3 text-xs font-bold text-zinc-800">No categories found</p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {catSearch ? "No categories match your search query." : "Get started by creating your first product category."}
                        </p>
                        {!catSearch && !isCashier && (
                          <button
                            type="button"
                            onClick={() => setShowCreateCatModal(true)}
                            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="size-3.5" />
                            <span>Create Category</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const count = productCountByCat[cat.id] || 0;
                      return (
                        <tr key={cat.id} className="transition-colors hover:bg-zinc-50/80">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
                                <Tag className="size-3.5" />
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900">{cat.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                              {count} {count === 1 ? "product" : "products"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">
                            #CAT-{cat.id.slice(0, 8).toUpperCase()}
                          </td>
                          {!isCashier && (
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setCategoryToEdit(cat)}
                                  title="Rename Category"
                                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCategoryToDelete(cat)}
                                  title="Delete Category"
                                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          </div>
        )}
      </div>
    </>
  );
}
