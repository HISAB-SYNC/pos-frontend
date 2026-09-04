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
/* Product emoji map                                                  */
/* ------------------------------------------------------------------ */
const PRODUCT_EMOJIS: Record<string, string> = {
  "Coca Cola": "🥤",
  "Mango Juice": "🧃",
  Orange: "🍊",
  Tomato: "🍅",
  "AKG Earphone": "🎧",
  "LG TV": "📺",
  Laptop: "💻",
  "Samsung A50": "📱",
  "Whole Milk 1L": "🥛",
  "Brown Bread": "🍞",
  "Cooking Oil 1L": "🫙",
};

export function ProductAvatar({ name, className }: { name: string; className?: string }) {
  const emoji = PRODUCT_EMOJIS[name];

  if (emoji) {
    return (
      <div
        className={`flex size-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-slate-50 text-xl shadow-none ${
          className ?? ""
        }`}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div
      className={`size-10 rounded-lg border border-[#e2e8f0] bg-[#e5e7eb] ${
        className ?? ""
      }`}
    />
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
    productId: "",
    categoryId: "",
    buyingPrice: "",
    salingPrice: "",
    quantity: "",
    location: "",
    expiryDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      const priceNum = parseFloat(form.salingPrice) || parseFloat(form.buyingPrice) || 0;
      const qtyNum = parseInt(form.quantity, 10) || 0;
      const sku = form.productId.trim() || `SKU-${Date.now().toString().slice(-4)}`;

      await createProduct(shopId, {
        sku,
        name: form.name,
        description: `Location: ${form.location || "Store"}`,
        price: priceNum,
        stockQuantity: qtyNum,
        unit: "pcs",
        lowStockThreshold: 5,
        categoryId: form.categoryId || undefined,
        attributes: {
          productId: sku,
          buyingPrice: form.buyingPrice,
          salingPrice: form.salingPrice,
          location: form.location,
          expiryDate: form.expiryDate,
          image: imagePreview,
        },
      });

      onCreated();
      onClose();
      setForm({
        name: "",
        productId: "",
        categoryId: "",
        buyingPrice: "",
        salingPrice: "",
        quantity: "",
        location: "",
        expiryDate: "",
      });
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <h2 className="mb-4 text-base font-semibold text-[#111827]">New Product</h2>

        {/* Image upload preview */}
        <div className="mb-5 flex items-center gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex size-18 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] text-[#9ca3af] transition-colors hover:border-[#2563eb] hover:bg-blue-50/30"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="size-full rounded-xl object-cover" />
            ) : (
              <>
                <UploadCloud className="size-5" />
                <span className="mt-1 text-[10px]">Browse</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <div className="text-xs text-[#6b7280]">
            <p className="font-medium text-[#111827]">Product Photo</p>
            <p className="text-[11px] text-[#9ca3af]">PNG, JPG up to 5MB</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Whole Milk 1L"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Product ID / SKU</label>
            <input
              name="productId"
              value={form.productId}
              onChange={handleChange}
              placeholder="e.g. MILK-1L"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Category</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Buying Price</label>
            <input
              name="buyingPrice"
              type="number"
              value={form.buyingPrice}
              onChange={handleChange}
              placeholder="e.g. 70"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Selling Price (ETB) *</label>
            <input
              name="salingPrice"
              type="number"
              value={form.salingPrice}
              onChange={handleChange}
              required
              placeholder="e.g. 90"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Quantity *</label>
            <input
              name="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              required
              placeholder="e.g. 25"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 font-medium text-[#374151]">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Aisle 3, Shelf B"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#111827] px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Product"}
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
    if (!product || !form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateProduct(shopId, product.id, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price) || 0,
        stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
        categoryId: form.categoryId || undefined,
      });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      onUpdated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <h2 className="text-base font-semibold text-[#111827]">Edit Product</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">SKU / Barcode</label>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Selling Price (ETB) *</label>
              <input
                type="number"
                step="any"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Stock Quantity *</label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#111827] px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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
/* Modal: Delete Product Confirmation                                 */
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
    setIsDeleting(true);
    try {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">Delete Product</h3>
        <p className="mt-1 text-xs text-[#6b7280]">
          Are you sure you want to delete <span className="font-semibold text-[#111827]">{product.name}</span>? This action will permanently remove it from the catalog.
        </p>

        <div className="mt-5 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
    <span className={isLow ? "text-xs font-semibold text-red-500" : "text-xs text-[#374151]"}>
      {isLow ? "Low stock" : "Available"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 8;

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

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getProducts(shopId, { search: debouncedSearch || undefined }),
        getCategories(shopId),
      ]);
      setAllProducts(prods ?? []);
      setCategories(cats ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        const catMatch = p.categoryId === selectedCategory || p.category?.name === selectedCategory;
        if (!catMatch) return false;
      }

      // Status filter
      if (selectedStatus === "LOW_STOCK") {
        if (p.stockQuantity > (p.lowStockThreshold || 5)) return false;
      } else if (selectedStatus === "AVAILABLE") {
        if (p.stockQuantity <= (p.lowStockThreshold || 5)) return false;
      }

      return true;
    });
  }, [allProducts, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const products = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  function formatPrice(raw: string | number) {
    const n = typeof raw === "number" ? raw : parseFloat(raw);
    if (isNaN(n)) return String(raw);
    return n >= 1000 ? `${n.toLocaleString()} Birr` : `${n} Birr`;
  }

  // Handle Export to CSV
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

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <h1 className="text-lg font-semibold text-[#111827]">Products ({filtered.length})</h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                className="h-9 w-48 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            {/* Filters Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
                  selectedCategory !== "ALL" || selectedStatus !== "ALL"
                    ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                <Filter className="size-4" />
                Filters
                {(selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
                  <span className="size-2 rounded-full bg-blue-600" />
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-2">
                    <span className="font-bold text-[#111827]">Filter Products</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("ALL");
                        setSelectedStatus("ALL");
                        setShowFilterDropdown(false);
                      }}
                      className="flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#111827]"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-[#374151]">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-8 w-full rounded-lg border border-[#e5e7eb] px-2 text-[#111827]"
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
                    <label className="mb-1 block font-medium text-[#374151]">Stock Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      className="h-8 w-full rounded-lg border border-[#e5e7eb] px-2 text-[#111827]"
                    >
                      <option value="ALL">All Stock Levels</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="LOW_STOCK">Low Stock</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full rounded-lg bg-[#111827] py-1.5 font-semibold text-white hover:bg-slate-800"
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
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Download className="size-4 text-[#6b7280]" />
              Download
            </button>

            {/* Add Product Button */}
            <button
              type="button"
              id="add-product-btn"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              <Plus className="size-4" />
              Add product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                <th className="px-6 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">In-stock</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10">
                    <LoadingState />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9ca3af]">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="group border-b border-[#f3f4f6] transition-colors last:border-0 hover:bg-[#f9fafb]"
                  >
                    <td
                      className="px-6 py-3 cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <ProductAvatar name={product.name} />
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-[#111827] group-hover:text-[#2563eb] cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#374151]">{product.stockQuantity}</td>
                    <td className="px-4 py-3 text-[#374151]">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        quantity={product.stockQuantity}
                        threshold={product.lowStockThreshold || 5}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#6b7280]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToEdit(product);
                          }}
                          title="Edit Product"
                          className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                          className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/products/${product.id}`)}
                          title="View Details"
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-[#111827] transition-colors"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-[#6b7280]">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
