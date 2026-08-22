"use client";

import {
  ChevronRight,
  Download,
  Filter,
  Plus,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createProduct, getProducts } from "@/lib/api";
import type { Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Product emoji map                                                     */
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
/* Add Product Modal (Matching Screenshot 1)                             */
/* ------------------------------------------------------------------ */
function AddProductModal({
  open,
  onClose,
  onCreated,
  shopId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    productId: "",
    category: "",
    buyingPrice: "",
    salingPrice: "",
    quantity: "",
    location: "",
    expiryDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
        description: `${form.category} in ${form.location || "Store"}`,
        price: priceNum,
        stockQuantity: qtyNum,
        unit: "pcs",
        lowStockThreshold: 5,
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
        category: "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <h2 className="mb-4 text-base font-semibold text-[#111827]">New Product</h2>

        {/* Drag image area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mb-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d1d5db] py-5 text-center transition-colors hover:bg-slate-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {imagePreview ? (
            <div className="flex flex-col items-center gap-1">
              <img src={imagePreview} alt="Preview" className="size-14 rounded-lg object-contain" />
              <span className="text-xs text-[#2563eb]">Change Image</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#6b7280]">Drag image here</p>
              <p className="my-0.5 text-xs text-[#9ca3af]">or</p>
              <span className="text-xs font-medium text-[#2563eb] hover:underline">
                Browse Image
              </span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Product Name */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Product Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Product ID */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Product ID</label>
            <input
              name="productId"
              value={form.productId}
              onChange={handleChange}
              placeholder="Enter product ID"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Enter Category"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Buying Price */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Buying Price</label>
            <input
              name="buyingPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.buyingPrice}
              onChange={handleChange}
              placeholder="Enter buying Price"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Saling Price */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Saling Price</label>
            <input
              name="salingPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.salingPrice}
              onChange={handleChange}
              required
              placeholder="Enter saling Price"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Quantity</label>
            <input
              name="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              required
              placeholder="Enter Quantity"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Enter Store Location"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-xs font-medium text-[#374151]">Expiry Date</label>
            <input
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleChange}
              placeholder="Enter Expiry date"
              className="h-9 flex-1 rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3.5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[95px] rounded-lg border border-[#111827] bg-white px-5 py-2 text-xs font-medium text-[#111827] transition-colors hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[105px] rounded-lg bg-[#111827] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1f2937] disabled:opacity-50"
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
/* Status badge                                                          */
/* ------------------------------------------------------------------ */
function StatusBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  const isLow = quantity <= threshold;
  return (
    <span className={isLow ? "text-sm font-medium text-red-500" : "text-sm text-[#374151]"}>
      {isLow ? "Low stock" : "Available"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                        */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 8;

export default function ProductsPage() {
  const router = useRouter();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getProducts(shopId, { search: debouncedSearch || undefined });
      setAllProducts(result ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side pagination
  const filtered = allProducts;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const products = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  function formatPrice(raw: string) {
    const n = parseFloat(raw);
    if (isNaN(n)) return raw;
    return n >= 1000 ? `${n.toLocaleString()} Birr` : `${n} Birr`;
  }

  return (
    <>
      <AddProductModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <h1 className="text-lg font-semibold text-[#111827]">Products</h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product"
                className="h-9 w-48 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            {/* Filters button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Filter className="size-4" />
              Filters
            </button>

            {/* Download button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Download className="size-4" />
              Download
            </button>

            {/* Add product */}
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
                <th className="px-4 py-3" />
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
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="group cursor-pointer border-b border-[#f3f4f6] transition-colors last:border-0 hover:bg-[#f9fafb]"
                  >
                    <td className="px-6 py-3">
                      <ProductAvatar name={product.name} />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111827] group-hover:text-[#2563eb]">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#374151]">{product.stockQuantity}</td>
                    <td className="px-4 py-3 text-[#374151]">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        quantity={product.stockQuantity}
                        threshold={product.lowStockThreshold}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex size-7 items-center justify-center rounded-full text-[#9ca3af] transition-colors group-hover:bg-blue-50 group-hover:text-[#2563eb]">
                        <ChevronRight className="size-4" />
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
            page {page} of {totalPages}
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
