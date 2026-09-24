"use client";

import {
  Check,
  ChevronRight,
  Download,
  Edit2,
  Filter,
  Folder,
  FolderPlus,
  Package,
  Plus,
  RotateCcw,
  Search,
  Tag,
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
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  updateCategory,
  updateProduct,
} from "@/lib/api";
import type { Category, Product } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useAuthStore } from "@/stores/auth-store";
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
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (open && localCategories.length > 0 && !form.categoryId) {
      setForm((prev) => ({ ...prev, categoryId: localCategories[0].id }));
    }
  }, [open, localCategories, form.categoryId]);

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
      setLocalCategories((prev) => [...prev, cat]);
      setForm((prev) => ({ ...prev, categoryId: cat.id }));
      onCreated();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to create category.");
    } finally {
      setIsCreatingCat(false);
    }
  }

  async function handleDeleteCategory() {
    if (!form.categoryId) return;
    const catToDelete = localCategories.find((c) => c.id === form.categoryId);
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${catToDelete?.name || "Selected"}"?`,
    );
    if (!confirmed) return;

    try {
      setIsDeletingCat(true);
      await deleteCategory(shopId, form.categoryId);
      setLocalCategories((prev) => prev.filter((c) => c.id !== form.categoryId));
      setForm((prev) => ({ ...prev, categoryId: "" }));
      onCreated();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to delete category.");
    } finally {
      setIsDeletingCat(false);
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
        categoryId: localCategories[0]?.id || "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-3.5">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Add New Product</h2>
            <p className="text-xs text-zinc-500">Record a new SKU in your store inventory</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Product Name */}
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Arabica Coffee Beans"
              className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* SKU and Category Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">SKU / Barcode</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. 6001234567"
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="font-semibold text-zinc-700">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  <Plus className="size-3" />
                  <span>{showAddCat ? "Close" : "New"}</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">No Category (General)</option>
                  {localCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {form.categoryId && (
                  <button
                    type="button"
                    onClick={handleDeleteCategory}
                    disabled={isDeletingCat}
                    title="Delete selected category"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Create Category Inline Box */}
          {showAddCat && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 animate-in fade-in duration-150">
              <p className="mb-2 text-[11px] font-semibold text-zinc-700">Create New Category</p>
              <div className="flex items-center gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Beverages, Snacks, Groceries"
                  className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs shadow-xs focus:border-zinc-900 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isCreatingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                  className="h-9 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all"
                >
                  {isCreatingCat ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCat(false);
                    setNewCatName("");
                  }}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Selling Price and Stock Quantity Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">
                Selling Price (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                name="salingPrice"
                type="number"
                step="0.01"
                value={form.salingPrice}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">Stock Quantity</label>
              <input
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Optional Cost & Low Stock Alert */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-medium text-zinc-500">
                Cost / Buying Price (ETB) <span className="text-[10px] text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                name="buyingPrice"
                type="number"
                step="0.01"
                value={form.buyingPrice}
                onChange={handleChange}
                placeholder="0.00"
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-medium text-zinc-500">
                Low Stock Threshold <span className="text-[10px] text-zinc-400 font-normal">(alert level)</span>
              </label>
              <input
                name="threshold"
                type="number"
                value={form.threshold}
                onChange={handleChange}
                placeholder="5"
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim() || !form.salingPrice}
              className="rounded-xl bg-[#c0e763] px-5 py-2 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
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
    buyingPrice: "",
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
        buyingPrice: product.buyingPrice !== undefined && product.buyingPrice !== null ? String(product.buyingPrice) : "",
        stockQuantity: String(product.stockQuantity || "0"),
        categoryId: product.categoryId || product.category?.id || "",
        lowStockThreshold: String(product.lowStockThreshold || "5"),
      });
    }
  }, [product]);

  if (!product) return null;

  const sellingNum = parseFloat(form.price) || 0;
  const buyingNum = parseFloat(form.buyingPrice) || 0;
  const markupEtb = sellingNum - buyingNum;
  const profitMarginPct =
    sellingNum > 0 && markupEtb > 0
      ? ((markupEtb / sellingNum) * 100).toFixed(1)
      : "0.0";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    try {
      setIsSubmitting(true);
      await updateProduct(shopId, product.id, {
        name: form.name.trim(),
        sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        categoryId: form.categoryId || undefined,
        price: sellingNum,
        buyingPrice: buyingNum > 0 ? buyingNum : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Edit Product</h3>
            <p className="text-[11px] text-zinc-500">Update pricing, cost, stock, and classification</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-600">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              required
            />
          </div>

          {/* Dual Price Editing: Selling Price & Buying Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">Selling Price (ETB) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">Buying / Cost Price (ETB)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.buyingPrice}
                onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                placeholder="0.00"
                className="h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time Profit Margin and Markup Preview Banner */}
          {sellingNum > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3.5 py-2.5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Profit Analysis</span>
                <div className="flex items-center gap-3 text-xs">
                  <span>
                    Markup:{" "}
                    <strong className={markupEtb >= 0 ? "text-emerald-700 font-mono" : "text-red-600 font-mono"}>
                      {markupEtb >= 0 ? `+${markupEtb.toFixed(2)}` : markupEtb.toFixed(2)} ETB
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Margin:{" "}
                    <strong className={parseFloat(profitMarginPct) > 0 ? "text-emerald-700 font-mono" : "text-zinc-600 font-mono"}>
                      {profitMarginPct}%
                    </strong>
                  </span>
                </div>
              </div>

              <div
                className={`rounded-lg px-2.5 py-1 text-center font-mono text-xs font-bold ${
                  markupEtb >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                }`}
              >
                {parseFloat(profitMarginPct)}% Margin
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-600">Stock Quantity</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                className="h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                required
              />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
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
/* Modal: Create Category                                              */
/* ------------------------------------------------------------------ */
function CreateCategoryModal({
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
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setErrorMsg("");
    try {
      setIsSubmitting(true);
      await createCategory(shopId, name.trim());
      setName("");
      onCreated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to create category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#c0e763]/20 text-zinc-950">
              <FolderPlus className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Add New Category</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beverages, Bakery, Electronics"
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-[#c0e763] px-4 py-2 font-bold text-zinc-950 shadow-xs hover:bg-[#b0d952] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Creating..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Category                                                */
/* ------------------------------------------------------------------ */
function EditCategoryModal({
  category,
  onClose,
  onUpdated,
  shopId,
}: {
  category: Category | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  if (!category) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !name.trim()) return;
    setErrorMsg("");
    try {
      setIsSubmitting(true);
      await updateCategory(shopId, category.id, name.trim());
      onUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to rename category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Tag className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Rename Category</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">Category Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-zinc-900 px-4 py-2 font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition-all"
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
/* Dialog: Delete Category Confirmation                               */
/* ------------------------------------------------------------------ */
function DeleteCategoryDialog({
  category,
  onClose,
  onDeleted,
  shopId,
}: {
  category: Category | null;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!category) return null;

  async function handleConfirm() {
    if (!category) return;
    setErrorMsg("");
    try {
      setIsDeleting(true);
      await deleteCategory(shopId, category.id);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to delete category. Ensure no products are strictly bound to it.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900">Delete Category</h3>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
          Are you sure you want to delete category <span className="font-semibold text-zinc-900">&quot;{category.name}&quot;</span>?
        </p>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {isDeleting ? "Deleting..." : "Delete Category"}
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
                          <option value="ALL">All Statuses</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="LOW_STOCK">Low stock</option>
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
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-[#c0e763] px-3 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Stock Quantity</th>
                    {!isCashier && <th className="px-5 py-3 font-semibold">Buying Price (ETB)</th>}
                    <th className="px-5 py-3 font-semibold">Selling Price (ETB)</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={isCashier ? 6 : 7} className="py-12 text-center text-zinc-400">
                        Loading products catalog...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={isCashier ? 6 : 7} className="py-12 text-center text-zinc-400">
                        No products found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="cursor-pointer transition-colors hover:bg-zinc-50/80"
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
                          {product.stockQuantity}{" "}
                          <span className="font-sans text-[11px] font-normal text-zinc-400">
                            {product.unit || "pcs"}
                          </span>
                        </td>
                        {!isCashier && (
                          <td className="px-5 py-3.5 font-mono text-zinc-500 tabular-nums">
                            {product.buyingPrice ? formatPrice(product.buyingPrice) : "—"}
                          </td>
                        )}
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 tabular-nums">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            quantity={product.stockQuantity}
                            threshold={product.lowStockThreshold || 5}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 text-zinc-400">
                            {!isCashier && (
                              <>
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
                              </>
                            )}
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
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-[#c0e763] px-3 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
                  >
                    <Plus className="size-3.5" />
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
                            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
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
