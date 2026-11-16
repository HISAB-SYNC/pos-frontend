"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { queueOfflineProduct, type OfflineProduct } from "@/lib/offline";
import { createCategory, createProduct, deleteCategory, deleteProduct, updateProduct } from "@/lib/api";
import { MarginHint, PriceIssuesBox, usePriceGuard } from "@/components/products/price-guard";
import type { Category, Product } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";
import { formatQuantity, STANDARD_UNITS } from "@/lib/utils/units";

/* ------------------------------------------------------------------ */
/* Add Product Modal                                                  */
/* ------------------------------------------------------------------ */
export function AddProductModal({
  open,
  onClose,
  onCreated,
  shopId,
  categories,
  isOnline = true,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
  categories: Category[];
  isOnline?: boolean;
}) {
  const t = useT();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    buyingPrice: "",
    salingPrice: "",
    quantity: "",
    unit: "pcs",
    threshold: "5",
    expiryDate: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const addSellNum = parseFloat(form.salingPrice) || 0;
  const addBuyNum = parseFloat(form.buyingPrice) || 0;
  const priceGuard = usePriceGuard({ price: addSellNum, buyingPrice: addBuyNum });
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
      setErrorMsg(t("inventory.failedCreateCategory"));
    } finally {
      setIsCreatingCat(false);
    }
  }

  async function handleDeleteCategory() {
    if (!form.categoryId) return;
    const catToDelete = localCategories.find((c) => c.id === form.categoryId);
    const confirmed = window.confirm(
      t("inventory.confirmDeleteCategory", { name: catToDelete?.name || t("inventory.selectedCategory") }),
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
      setErrorMsg(t("inventory.failedDeleteCategory"));
    } finally {
      setIsDeletingCat(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.salingPrice) return;
    if (priceGuard.blocked) return;
    setErrorMsg("");

    if (!isOnline) {
      try {
        setIsSubmitting(true);
        const tempId = "off-prod-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
        const offProduct: OfflineProduct = {
          id: tempId,
          shopId,
          sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
          name: form.name.trim(),
          price: parseFloat(form.salingPrice) || 0,
          buyingPrice: form.buyingPrice ? parseFloat(form.buyingPrice) : 0,
          stockQuantity: parseFloat(form.quantity) || 0,
          unit: form.unit,
          lowStockThreshold: parseInt(form.threshold, 10) || 5,
          categoryId: form.categoryId || undefined,
          createdAt: new Date().toISOString(),
          status: "PENDING",
          ...priceGuard.flags,
        };

        await queueOfflineProduct(offProduct);
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
          expiryDate: "",
          location: "",
        });
      } catch (err: unknown) {
        setErrorMsg(t("inventory.failedOffline"));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await createProduct(shopId, {
        name: form.name.trim(),
        sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.salingPrice) || 0,
        buyingPrice: form.buyingPrice ? parseFloat(form.buyingPrice) : 0,
        stockQuantity: parseFloat(form.quantity) || 0,
        unit: form.unit,
        lowStockThreshold: parseInt(form.threshold, 10) || 5,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
        attributes: {
          location: form.location || undefined,
        },
        ...priceGuard.flags,
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
        expiryDate: "",
        location: "",
      });
    } catch (err: unknown) {
      const isNetworkErr =
        (err && typeof err === "object" && "status" in err && (err as any).status === 0) ||
        (err && typeof err === "object" && "message" in err && /connect|fetch|network/i.test(String((err as any).message)));

      if (isNetworkErr) {
        try {
          const tempId = "off-prod-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
          const offProduct: OfflineProduct = {
            id: tempId,
            shopId,
            sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
            name: form.name.trim(),
            price: parseFloat(form.salingPrice) || 0,
            buyingPrice: form.buyingPrice ? parseFloat(form.buyingPrice) : 0,
            stockQuantity: parseFloat(form.quantity) || 0,
            unit: form.unit,
            lowStockThreshold: parseInt(form.threshold, 10) || 5,
            categoryId: form.categoryId || undefined,
            createdAt: new Date().toISOString(),
            status: "PENDING",
            ...priceGuard.flags,
          };
          await queueOfflineProduct(offProduct);
          onCreated();
          onClose();
          return;
        } catch {
          // ignore
        }
      }

      if (priceGuard.handleServerError(err)) return;
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : t("inventory.failedCreateProduct");
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
            <h2 className="text-base font-bold text-zinc-900">{t("inventory.addTitle")}</h2>
            <p className="text-xs text-zinc-500">{t("inventory.addSubtitle")}</p>
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
              {t("inventory.productName")} <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder={t("inventory.productNamePlaceholder")}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* SKU and Category Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">{t("inventory.skuBarcode")}</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder={t("inventory.skuPlaceholder")}
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="font-semibold text-zinc-700">{t("shared.category")}</label>
                <button
                  type="button"
                  onClick={() => setShowAddCat(!showAddCat)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  <Plus className="size-3" />
                  <span>{showAddCat ? t("shared.close") : t("inventory.new")}</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">{t("inventory.noCategoryGeneral")}</option>
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
                    title={t("inventory.deleteSelectedCategory")}
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
              <p className="mb-2 text-[11px] font-semibold text-zinc-700">{t("inventory.createNewCategory")}</p>
              <div className="flex items-center gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={t("inventory.categoryPlaceholderMany")}
                  className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs shadow-xs focus:border-zinc-900 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isCreatingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                  className="h-9 rounded-lg bg-slate-800 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all"
                >
                  {isCreatingCat ? t("shared.saving") : t("shared.save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCat(false);
                    setNewCatName("");
                  }}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  {t("shared.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Selling Price and Stock Quantity Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">
                {t("inventory.sellingPriceEtb")} <span className="text-red-500">*</span>
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
              <label className="mb-1.5 block font-semibold text-zinc-700">{t("inventory.stockQuantity")}</label>
              <input
                name="quantity"
                type="number"
                step="any"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0"
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Cost & Low Stock Alert */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-medium text-zinc-500">
                {t("inventory.costPrice")} <span className="text-[10px] text-zinc-400 font-normal">({t("shared.optional")})</span>
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
              <div className="mt-1">
                <MarginHint price={addSellNum} buyingPrice={addBuyNum} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-medium text-zinc-500">
                {t("inventory.lowStockThreshold")} <span className="text-[10px] text-zinc-400 font-normal">{t("inventory.alertLevel")}</span>
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

          {/* Unit & Expiry Date */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">{t("inventory.measurementUnit")}</label>
              <input
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder={t("inventory.unitPlaceholder")}
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {STANDARD_UNITS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setForm({ ...form, unit: u.value })}
                    className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      form.unit === u.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {u.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-medium text-zinc-600">
                {t("inventory.expiryDate")} <span className="text-[10px] text-zinc-400 font-normal">({t("shared.optional")})</span>
              </label>
              <input
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
                className="h-10 w-full rounded-xl border border-zinc-200 px-3.5 font-mono text-xs text-zinc-900 shadow-xs transition-all focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <PriceIssuesBox
            issues={priceGuard.issues}
            confirmed={priceGuard.confirmed}
            onConfirmChange={priceGuard.setConfirmed}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim() || !form.salingPrice || priceGuard.blocked}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("inventory.adding") : t("inventory.saveProduct")}
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
export function EditProductModal({
  product,
  onClose,
  onUpdated,
  shopId,
  categories,
  onAdjustStock,
}: {
  product: Product | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
  categories: Category[];
  /** Stock is changed through Adjust Stock so every change is logged with a reason. */
  onAdjustStock?: (product: Product) => void;
}) {
  const t = useT();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    buyingPrice: "",
    stockQuantity: "",
    categoryId: "",
    lowStockThreshold: "5",
    expiryDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const editPriceGuard = usePriceGuard({
    price: parseFloat(form.price) || 0,
    buyingPrice: parseFloat(form.buyingPrice) || 0,
    previousPrice: product ? Number(product.price) || 0 : null,
    previousBuyingPrice: product ? Number(product.buyingPrice) || 0 : null,
  });

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
        expiryDate: product.expiryDate ? product.expiryDate.split("T")[0] : "",
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
    if (!product || editPriceGuard.blocked) return;
    setEditError("");
    try {
      setIsSubmitting(true);
      await updateProduct(shopId, product.id, {
        ...editPriceGuard.flags,
        name: form.name.trim(),
        sku: form.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        categoryId: form.categoryId || undefined,
        price: sellingNum,
        buyingPrice: buyingNum > 0 ? buyingNum : undefined,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      });
      onUpdated();
      onClose();
    } catch (err) {
      if (!editPriceGuard.handleServerError(err)) {
        setEditError((err as { message?: string })?.message || t("inventory.couldntSaveChanges"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">{t("inventory.editTitle")}</h3>
            <p className="text-[11px] text-zinc-500">{t("inventory.editSubtitle")}</p>
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
            <label className="mb-1 block font-medium text-zinc-600">{t("inventory.productName")}</label>
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
              <label className="mb-1 block font-semibold text-zinc-700">{t("inventory.sellingPriceEtb")} *</label>
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
              <label className="mb-1 block font-semibold text-zinc-700">{t("inventory.buyingCostPrice")}</label>
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
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t("inventory.profitAnalysis")}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span>
                    {t("inventory.markup")}{" "}
                    <strong className={markupEtb >= 0 ? "text-emerald-700 font-mono" : "text-red-600 font-mono"}>
                      {markupEtb >= 0 ? `+${markupEtb.toFixed(2)}` : markupEtb.toFixed(2)} {t("shared.etb")}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    {t("inventory.margin")}{" "}
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
                {t("inventory.marginBadge", { pct: parseFloat(profitMarginPct) })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-600">{t("inventory.stockQuantity")}</label>
              <div className="flex h-9 items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3">
                <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                  {formatQuantity(product.stockQuantity, product.unit || "pcs")}
                </span>
                {onAdjustStock && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAdjustStock(product);
                    }}
                    className="text-[11px] font-semibold text-[#5B4FE9] hover:underline"
                  >
                    {t("inventory.adjustStock")}
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-zinc-400">{t("inventory.stockChangesHint")}</p>
            </div>
            <div>
              <label className="mb-1 block font-medium text-zinc-600">{t("shared.category")}</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                <option value="">{t("inventory.noCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-600">
              {t("inventory.expiryDate")} <span className="text-[10px] text-zinc-400 font-normal">({t("shared.optional")})</span>
            </label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="h-9 w-full rounded-lg border border-zinc-200 px-3 font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>

          <PriceIssuesBox
            issues={editPriceGuard.issues}
            confirmed={editPriceGuard.confirmed}
            onConfirmChange={editPriceGuard.setConfirmed}
          />
          {editError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{editError}</div>
          )}

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || editPriceGuard.blocked}
              className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("shared.saving") : t("inventory.saveChanges")}
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
export function DeleteProductDialog({
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
  const t = useT();
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
        <h3 className="text-sm font-bold text-zinc-900">{t("inventory.deleteProductTitle")}</h3>
        <p className="mt-1 text-xs text-zinc-500">
          {t("inventory.confirmDeleteProduct", { name: product.name })}
        </p>

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-3.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {t("shared.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? t("inventory.deleting") : t("inventory.deletePermanently")}
          </button>
        </div>
      </div>
    </div>
  );
}
