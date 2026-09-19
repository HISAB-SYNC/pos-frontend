"use client";

import {
  Check,
  ChevronRight,
  Download,
  Edit2,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import {
  createCategory,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "@/lib/api";
import type { Category, Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Product Avatar: Professional Monogram Badge                         */
/* ------------------------------------------------------------------ */
export function ProductAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SK";

  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-zinc-100 font-mono text-[11px] font-bold text-zinc-700 shadow-2xs ${
        className ?? ""
      }`}
    >
      {initials}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add Product Modal                                                  */
/* ------------------------------------------------------------------ */
function AddProductModal({
  open,
  onClose,
  onCreated,
  shopId,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
  categories: Category[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    buyingPrice: "",
    salingPrice: "",
    quantity: "",
    unit: "pcs",
    threshold: "5",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  useEffect(() => {
    if (open && categories.length > 0 && !form.categoryId) {
      setForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [open, categories, form.categoryId]);

  if (!open) return null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    try {
      setIsCreatingCat(true);
      const cat = await createCategory(shopId, newCatName.trim());
      setShowAddCat(false);
      setNewCatName("");
      onCreated();
      setForm((prev) => ({ ...prev, categoryId: cat.id }));
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsCreatingCat(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.salingPrice) return;
    setErrorMsg("");

    try {
      setIsSubmitting(true);
      await createProduct(shopId, {
        name: form.name.trim(),
        sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.salingPrice) || 0,
        stockQuantity: parseInt(form.quantity, 10) || 0,
        unit: form.unit,
        lowStockThreshold: parseInt(form.threshold, 10) || 5,
        attributes: {
          buyingPrice: form.buyingPrice ? parseFloat(form.buyingPrice) : undefined,
          location: form.location || undefined,
        },
      } as any);

      onCreated();
      onClose();
      setForm({
        name: "",
        sku: "",
        categoryId: categories[0]?.id || "",
        buyingPrice: "",
        salingPrice: "",
        quantity: "",
        unit: "pcs",
        threshold: "5",
        location: "",
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : "Failed to create product. Please verify SKU and details.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Add New Product</h2>
            <p className="text-xs text-zinc-500">Record a new SKU in your store inventory</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 font-medium text-zinc-600">Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Arabica Coffee Beans"
              className="h-9 flex-1 rounded-lg border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 font-medium text-zinc-600">SKU / Barcode</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="e.g. 6001234567"
              className="h-9 flex-1 rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 font-medium text-zinc-600">Category</label>
            <div className="flex flex-1 items-center gap-2">
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="h-9 flex-1 rounded-lg border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                <option value="">No Category (General)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="h-9 rounded-lg border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                + New
              </button>
            </div>
          </div>

          {showAddCat && (
            <div className="ml-24 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name"
                className="h-8 flex-1 rounded-md border border-zinc-200 bg-white px-2.5 text-xs"
              />
              <button
                type="button"
                disabled={isCreatingCat || !newCatName.trim()}
                onClick={handleCreateCategory}
                className="h-8 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {isCreatingCat ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="w-20 shrink-0 font-medium text-zinc-600">Selling Price *</label>
              <input
                name="salingPrice"
                type="number"
                step="0.01"
                value={form.salingPrice}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="h-9 flex-1 rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-16 shrink-0 font-medium text-zinc-600">Stock Qty</label>
              <input
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                className="h-9 flex-1 rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim() || !form.salingPrice}
              className="rounded-lg bg-[#c0e763] px-5 py-2 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Product                                                */
/* ------------------------------------------------------------------ */
function EditProductModal({
  product,
  onClose,
  onUpdated,
  shopId,
  categories,
}: {
  product: Product | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
  categories: Category[];
}) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    lowStockThreshold: "5",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        sku: product.sku || "",
        price: String(product.price || "0"),
        stockQuantity: String(product.stockQuantity || "0"),
        categoryId: product.categoryId || product.category?.id || "",
        lowStockThreshold: String(product.lowStockThreshold || "5"),
      });
    }
  }, [product]);

  if (!product) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    try {
      setIsSubmitting(true);
      await updateProduct(shopId, product.id, {
        name: form.name.trim(),
        sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.price) || 0,
        stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
      });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-base font-bold text-zinc-900">Edit Product</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-600">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-600">Price (ETB)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-zinc-600">Stock Qty</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                className="h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-600">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#c0e763] px-5 py-2 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Delete Confirmation                                         */
/* ------------------------------------------------------------------ */
function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
  shopId,
}: {
  product: Product | null;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!product) return;
    try {
      setIsDeleting(true);
      await deleteProduct(shopId, product.id);
      onDeleted();
      onClose();
    } catch (err) {
      console.error(err);
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900">Delete Product</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Are you sure you want to delete <span className="font-semibold text-zinc-900">{product.name}</span>? This action cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-3.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status badge                                                       */
/* ------------------------------------------------------------------ */
function StatusBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  const isLow = quantity <= threshold;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
        isLow
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          isLow ? "bg-red-600" : "bg-emerald-600"
        }`}
      />
      {isLow ? "Low stock" : "Available"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "AVAILABLE" | "LOW_STOCK">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  const load = useCallback(async () => {
    if (!shopId) return;
    try {
      setIsLoading(true);
      const [prodsData, catsData] = await Promise.all([
        getProducts(shopId),
        getCategories(shopId),
      ]);
      setAllProducts(Array.isArray(prodsData) ? prodsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
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
      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "LOW_STOCK" && isLow) ||
        (selectedStatus === "AVAILABLE" && !isLow);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [allProducts, debouncedSearch, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function formatPrice(val: number | string | undefined): string {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(Number(num)) ? "ETB 0.00" : `ETB ${Number(num).toFixed(2)}`;
  }

  function handleDownload() {
    exportToCsv("products-catalog", filtered, [
      { header: "Product Name", key: "name" },
      { header: "SKU / Barcode", key: "sku" },
      {
        header: "Category",
        formatter: (item) => item.category?.name || "General",
      },
      { header: "Stock Quantity", key: "stockQuantity" },
      { header: "Unit", formatter: (item) => item.unit || "pcs" },
      {
        header: "Price (ETB)",
        formatter: (item) => (parseFloat(item.price || "0")).toFixed(2),
      },
      {
        header: "Status",
        formatter: (item) =>
          item.stockQuantity <= (item.lowStockThreshold || 5) ? "Low stock" : "Available",
      },
    ]);
  }

  return (
    <>
      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
        categories={categories}
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

      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">Products</h1>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
              {filtered.length}
            </span>
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                  selectedCategory !== "ALL" || selectedStatus !== "ALL"
                    ? "border-[#c0e763] bg-[#c0e763]/20 text-zinc-950 font-semibold"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {(selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
                  <span className="size-1.5 rounded-full bg-[#82a823]" />
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
                      <option value="ALL">All Levels</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="LOW_STOCK">Low Stock</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full rounded-md bg-zinc-900 py-1.5 font-semibold text-white hover:bg-zinc-800"
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <Download className="size-3.5 text-zinc-400" />
              <span>Export</span>
            </button>

            {/* Add Product Button */}
            <button
              type="button"
              id="add-product-btn"
              onClick={() => setShowAddModal(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#c0e763] px-3 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-2.5">Product</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5 text-right">In-stock</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10">
                    <LoadingState />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="group transition-colors hover:bg-zinc-50/70"
                  >
                    <td
                      className="px-5 py-2.5 cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <ProductAvatar name={product.name} />
                        <div>
                          <div className="font-semibold text-zinc-900 group-hover:text-zinc-950">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {product.unit || "pcs"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                        {product.category?.name ?? "General"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-500">
                      {product.sku || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-zinc-900">
                      {product.stockQuantity}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-zinc-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        quantity={product.stockQuantity}
                        threshold={product.lowStockThreshold || 5}
                      />
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 text-zinc-400">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToEdit(product);
                          }}
                          title="Edit Product"
                          className="rounded p-1 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                          }}
                          title="Delete Product"
                          className="rounded p-1 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/products/${product.id}`)}
                          title="View Details"
                          className="rounded p-1 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                      </div>
                    </td>
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
    </>
  );
}
