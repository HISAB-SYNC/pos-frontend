"use client";

import {
  ArrowLeft,
  ChevronRight,
  Download,
  Edit2,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import {
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/lib/api";
import type {
  Product,
  ProductAdjustment,
  ProductHistory,
  ProductPurchase,
} from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";


/* ------------------------------------------------------------------ */
/* Tabs Configuration                                                 */
/* ------------------------------------------------------------------ */
type TabKey = "overview" | "purchases" | "adjustments" | "history";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "purchases", label: "Purchases" },
  { key: "adjustments", label: "Adjustments" },
  { key: "history", label: "History" },
];

/* ------------------------------------------------------------------ */
/* Modal: New Purchase                                                */
/* ------------------------------------------------------------------ */
function NewPurchaseModal({
  open,
  onClose,
  productId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    supplier: "Mr. X",
    quantity: "50",
    unitCost: "75",
    date: new Date().toLocaleDateString("en-GB"),
    status: "completed" as "completed" | "pending",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">New Purchase</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Supplier Name</label>
            <input
              value={form.supplier}
              onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Unit Cost (Birr)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Date</label>
              <input
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                placeholder="DD/MM/YYYY"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as "completed" | "pending" }))
                }
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d1d5db] px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#111827] px-4 py-2 text-xs font-medium text-white hover:bg-[#1f2937] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: New Adjustment                                              */
/* ------------------------------------------------------------------ */
function NewAdjustmentModal({
  open,
  onClose,
  productId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    quantityChange: "-5",
    reason: "Damaged",
    store: "Kolfe Branch",
    date: new Date().toLocaleDateString("en-GB"),
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">New Adjustment</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Quantity Change</label>
              <input
                type="number"
                value={form.quantityChange}
                onChange={(e) => setForm((f) => ({ ...f, quantityChange: e.target.value }))}
                required
                placeholder="e.g. -5 or +3"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Reason</label>
              <select
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="Damaged">Damaged</option>
                <option value="Expired">Expired</option>
                <option value="Found stock">Found stock</option>
                <option value="Theft">Theft</option>
                <option value="Correction">Correction</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Store Location</label>
              <input
                value={form.store}
                onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                required
                placeholder="e.g. Kolfe Branch"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Date</label>
              <input
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                placeholder="DD/MM/YYYY"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d1d5db] px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#111827] px-4 py-2 text-xs font-medium text-white hover:bg-[#1f2937] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Product Details                                        */
/* ------------------------------------------------------------------ */
function EditProductModal({
  open,
  onClose,
  product,
  shopId,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  shopId: string;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price,
    stockQuantity: product.stockQuantity,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProduct(shopId, product.id, {
        name: form.name,
        price: parseFloat(form.price) || 0,
        stockQuantity: Number(form.stockQuantity) || 0,
      });
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">Edit Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Price (Birr)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">In-stock Quantity</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d1d5db] px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#111827] px-4 py-2 text-xs font-medium text-white hover:bg-[#1f2937] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Product Detail Page Component                                 */
/* ------------------------------------------------------------------ */
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;

  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;
  const user = useAuthStore((state) => state.user);
  const isCashier = user?.role === "SALES";

  const availableTabs = useMemo(() => {
    if (isCashier) {
      return TABS.filter((t) => t.key === "overview" || t.key === "history");
    }
    return TABS;
  }, [isCashier]);

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [product, setProduct] = useState<Product | null>(null);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [adjustments, setAdjustments] = useState<ProductAdjustment[]>([]);
  const [history, setHistory] = useState<ProductHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search states for tabs
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [adjustmentSearch, setAdjustmentSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showNewAdjustmentModal, setShowNewAdjustmentModal] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const prod = await getProduct(shopId, rawId);
      setProduct(prod);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, rawId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived / attribute fallbacks
  const attributes = (product?.attributes ?? {}) as Record<string, any>;
  const productIdDisplay = attributes.productId || product?.sku || "456567";
  const categoryDisplay = product?.category?.name || attributes.category || "Soft Drink";
  const expiryDateDisplay = attributes.expiryDate || "13/09/25";
  const supplierNameDisplay = product?.supplier?.name || attributes.supplierName || "Mr. X";
  const contactNumberDisplay = product?.supplier?.contactInfo || attributes.supplierContact || "98789 86757";

  const storeLocations = (attributes.storeLocations as Array<{ name: string; stock: number }>) || [
    { name: "Kolfe Branch", stock: 15 },
    { name: "Merkato Branch", stock: 19 },
  ];

  const openingStock = attributes.openingStock ?? 40;
  const remainingStock = product?.stockQuantity ?? attributes.remainingStock ?? 34;
  const onTheWay = attributes.onTheWay ?? 15;
  const thresholdValue = product?.lowStockThreshold ?? attributes.thresholdValue ?? 12;

  // Filtered lists
  const filteredPurchases = useMemo(() => {
    if (!purchaseSearch.trim()) return purchases;
    const q = purchaseSearch.toLowerCase();
    return purchases.filter(
      (p) =>
        p.purchaseId.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q),
    );
  }, [purchases, purchaseSearch]);

  const filteredAdjustments = useMemo(() => {
    if (!adjustmentSearch.trim()) return adjustments;
    const q = adjustmentSearch.toLowerCase();
    return adjustments.filter(
      (a) =>
        a.adjustmentId.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.store.toLowerCase().includes(q),
    );
  }, [adjustments, adjustmentSearch]);

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const q = historySearch.toLowerCase();
    return history.filter(
      (h) =>
        h.transactionId.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q) ||
        h.person.toLowerCase().includes(q) ||
        h.store.toLowerCase().includes(q),
    );
  }, [history, historySearch]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Row Delete State for Tabs
  const [itemToDelete, setItemToDelete] = useState<{ type: "purchase" | "adjustment" | "history"; id: string; label: string } | null>(null);

  async function handleDeleteProduct() {
    if (!product) return;
    setIsDeletingProduct(true);
    try {
      await deleteProduct(shopId, product.id);
      router.push("/products");
    } catch {
      router.push("/products");
    } finally {
      setIsDeletingProduct(false);
    }
  }

  function handleDownloadOverview() {
    if (!product) return;
    exportToCsv(`${product.name.toLowerCase().replace(/\s+/g, "-")}-details`, [product], [
      { header: "Product Name", key: "name" },
      { header: "SKU", key: "sku" },
      { header: "Category", formatter: () => categoryDisplay },
      { header: "Stock Quantity", key: "stockQuantity" },
      { header: "Selling Price (ETB)", key: "price" },
      { header: "Threshold Value", formatter: () => thresholdValue },
      { header: "Supplier Name", formatter: () => supplierNameDisplay },
      { header: "Supplier Contact", formatter: () => contactNumberDisplay },
      { header: "Expiry Date", formatter: () => expiryDateDisplay },
    ]);
  }

  function handleDownloadPurchases() {
    if (!product) return;
    exportToCsv(`${product.name.toLowerCase().replace(/\s+/g, "-")}-purchases`, filteredPurchases, [
      { header: "Purchase ID", key: "purchaseId" },
      { header: "Supplier", key: "supplier" },
      { header: "Quantity", key: "quantity" },
      { header: "Unit Cost (ETB)", key: "unitCost" },
      { header: "Total Cost (ETB)", key: "totalCost" },
      { header: "Date", key: "date" },
      { header: "Status", key: "status" },
    ]);
  }

  function handleDownloadAdjustments() {
    if (!product) return;
    exportToCsv(`${product.name.toLowerCase().replace(/\s+/g, "-")}-adjustments`, filteredAdjustments, [
      { header: "Adjustment ID", key: "adjustmentId" },
      { header: "Quantity Change", key: "quantityChange" },
      { header: "Reason", key: "reason" },
      { header: "Store", key: "store" },
      { header: "Date", key: "date" },
    ]);
  }

  function handleDownloadHistory() {
    if (!product) return;
    exportToCsv(`${product.name.toLowerCase().replace(/\s+/g, "-")}-history`, filteredHistory, [
      { header: "Transaction ID", key: "transactionId" },
      { header: "Type", key: "type" },
      { header: "Quantity", key: "quantity" },
      { header: "Store", key: "store" },
      { header: "Value (ETB)", key: "value" },
      { header: "Date", key: "date" },
      { header: "Person", key: "person" },
    ]);
  }


  if (isLoading || !product) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <LoadingState />
      </div>
    );
  }

  return (
    <>
      <EditProductModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={product}
        shopId={shopId}
        onUpdated={loadData}
      />

      <NewPurchaseModal
        open={showNewPurchaseModal}
        onClose={() => setShowNewPurchaseModal(false)}
        productId={product.id}
        onCreated={loadData}
      />

      <NewAdjustmentModal
        open={showNewAdjustmentModal}
        onClose={() => setShowNewAdjustmentModal(false)}
        productId={product.id}
        onCreated={loadData}
      />

      {/* Delete Product Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Delete Product</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              Are you sure you want to delete <span className="font-semibold text-[#111827]">{product.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={handleDeleteProduct}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingProduct ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tab Row Item Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Delete Record</h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              Are you sure you want to remove <span className="font-semibold text-[#111827]">{itemToDelete.label}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.type === "purchase") {
                    setPurchases((prev) => prev.filter((x) => x.id !== itemToDelete.id));
                  } else if (itemToDelete.type === "adjustment") {
                    setAdjustments((prev) => prev.filter((x) => x.id !== itemToDelete.id));
                  } else if (itemToDelete.type === "history") {
                    setHistory((prev) => prev.filter((x) => x.id !== itemToDelete.id));
                  }
                  setItemToDelete(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        {/* Header with Title and Action buttons (Edit, Download, Delete) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="flex size-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
              title="Back to products"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-xl font-bold text-[#111827]">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {!isCashier && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadOverview}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Download className="size-3.5" />
              Download
            </button>
            {!isCashier && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100/60"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="mb-6 flex border-b border-[#e5e7eb]">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-b-2 border-zinc-950 text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: OVERVIEW (Matching Screenshot 2)                            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Column: Primary Details, Supplier Details, Stock Locations */}
            <div className="space-y-8 lg:col-span-8">
              {/* Primary Details */}
              <div>
                <h2 className="mb-4 text-sm font-semibold text-[#111827]">Primary Details</h2>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Product name</span>
                    <span className="col-span-2 font-medium text-[#111827]">{product.name}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Product ID</span>
                    <span className="col-span-2 text-[#374151]">{productIdDisplay}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Product category</span>
                    <span className="col-span-2 text-[#374151]">{categoryDisplay}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Expiry Date</span>
                    <span className="col-span-2 text-[#374151]">{expiryDateDisplay}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Price</span>
                    <span className="col-span-2 font-medium text-[#111827]">
                      {product.price} Birr
                    </span>
                  </div>
                </div>
              </div>

              {/* Supplier Details */}
              <div>
                <h2 className="mb-4 text-sm font-semibold text-[#111827]">Supplier Details</h2>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Supplier name</span>
                    <span className="col-span-2 font-medium text-[#111827]">
                      {supplierNameDisplay}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-[#6b7280]">Contact Number</span>
                    <span className="col-span-2 text-[#374151]">{contactNumberDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Stock Locations */}
              <div>
                <h2 className="mb-4 text-sm font-semibold text-[#111827]">Stock Locations</h2>
                <div className="overflow-hidden rounded-xl border border-[#f3f4f6]">
                  <div className="flex justify-between bg-[#f9fafb] px-4 py-2.5 text-xs font-semibold text-[#4b5563]">
                    <span>Store Name</span>
                    <span>Stock in hand</span>
                  </div>
                  <div className="divide-y divide-[#f3f4f6] text-xs">
                    {storeLocations.map((loc) => (
                      <div
                        key={loc.name}
                        className="flex justify-between px-4 py-2.5 transition-colors hover:bg-[#fafafa]"
                      >
                        <span className="text-[#374151]">{loc.name}</span>
                        <span className="font-semibold text-[#2563eb]">{loc.stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Product Image + Stock Summary */}
            <div className="flex flex-col items-center space-y-6 lg:col-span-4">
              {/* Product Image Frame (dashed border box) */}
              <div className="flex size-44 items-center justify-center rounded-xl border-2 border-dashed border-[#d1d5db] bg-[#fafafa] p-4">
                {product.name === "Coca Cola" ? (
                  <div className="flex size-full items-center justify-center text-6xl">
                    🥤
                  </div>
                ) : (
                  <div className="flex size-full items-center justify-center text-5xl">
                    📦
                  </div>
                )}
              </div>

              {/* Stock Metrics List */}
              <div className="w-full max-w-[240px] space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Opening Stock</span>
                  <span className="font-medium text-[#111827]">{openingStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Remaining Stock</span>
                  <span className="font-medium text-[#111827]">{remainingStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">On the way</span>
                  <span className="font-medium text-[#111827]">{onTheWay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Threshold value</span>
                  <span className="font-medium text-[#111827]">{thresholdValue}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: PURCHASES (Matching Screenshot 3)                           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "purchases" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-52 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPurchases}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  <Download className="size-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPurchaseModal(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
                >
                  New purchase
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                    <th className="py-3 font-medium">Purchase ID</th>
                    <th className="py-3 font-medium">Supplier</th>
                    <th className="py-3 font-medium">Quantity</th>
                    <th className="py-3 font-medium">Unit Cost</th>
                    <th className="py-3 font-medium">Total Cost</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#9ca3af]">
                        No purchase records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="py-3.5 text-[#374151]">{item.purchaseId}</td>
                        <td className="py-3.5 font-medium text-[#111827]">{item.supplier}</td>
                        <td className="py-3.5 text-[#374151]">{item.quantity} Units</td>
                        <td className="py-3.5 text-[#374151]">{item.unitCost} Birr</td>
                        <td className="py-3.5 font-medium text-[#111827]">
                          {item.totalCost.toLocaleString()} Birr
                        </td>
                        <td className="py-3.5 text-[#6b7280]">{item.date}</td>
                        <td className="py-3.5">
                          <span
                            className={
                              item.status === "completed"
                                ? "font-medium text-[#16a34a]"
                                : "font-medium text-[#d97706]"
                            }
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center justify-center gap-3 text-[#9ca3af]">
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: "purchase",
                                  id: item.id,
                                  label: `Purchase #${item.purchaseId} (${item.supplier})`,
                                });
                              }}
                              className="hover:text-red-500 transition-colors"
                              title="Delete purchase"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: ADJUSTMENTS (Matching Screenshot 4)                         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "adjustments" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  value={adjustmentSearch}
                  onChange={(e) => setAdjustmentSearch(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-52 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAdjustments}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  <Download className="size-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewAdjustmentModal(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
                >
                  New Adjustment
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                    <th className="py-3 font-medium">Adjustment ID</th>
                    <th className="py-3 font-medium">Quantity change</th>
                    <th className="py-3 font-medium">Reason</th>
                    <th className="py-3 font-medium">Store</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#9ca3af]">
                        No adjustments recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="py-3.5 text-[#374151]">{item.adjustmentId}</td>
                        <td
                          className={`py-3.5 font-medium ${
                            item.quantityChange > 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                          }`}
                        >
                          {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}{" "}
                          Units
                        </td>
                        <td className="py-3.5 text-[#111827]">{item.reason}</td>
                        <td className="py-3.5 text-[#374151]">{item.store}</td>
                        <td className="py-3.5 text-[#6b7280]">{item.date}</td>
                        <td className="py-3.5">
                          <div className="flex items-center justify-center gap-3 text-[#9ca3af]">
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: "adjustment",
                                  id: item.id,
                                  label: `Adjustment #${item.adjustmentId} (${item.reason})`,
                                });
                              }}
                              className="hover:text-red-500 transition-colors"
                              title="Delete adjustment"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: HISTORY (Matching Screenshot 5)                             */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-52 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadHistory}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
                >
                  <Download className="size-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                    <th className="py-3 font-medium">Transaction ID</th>
                    <th className="py-3 font-medium">Type</th>
                    <th className="py-3 font-medium">Quantity</th>
                    <th className="py-3 font-medium">Store</th>
                    <th className="py-3 font-medium">Value</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Person</th>
                    <th className="py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#9ca3af]">
                        No transaction history found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="py-3.5 text-[#374151]">{item.transactionId}</td>
                        <td className="py-3.5 font-medium text-[#111827]">{item.type}</td>
                        <td
                          className={`py-3.5 font-medium ${
                            item.quantity > 0 ? "text-[#16a34a]" : "text-[#dc2626]"
                          }`}
                        >
                          {item.quantity > 0 ? `+${item.quantity}` : item.quantity} Units
                        </td>
                        <td className="py-3.5 text-[#374151]">{item.store}</td>
                        <td className="py-3.5 font-medium text-[#111827]">
                          {item.value.toLocaleString()} Birr
                        </td>
                        <td className="py-3.5 text-[#6b7280]">{item.date}</td>
                        <td className="py-3.5 text-[#374151]">{item.person}</td>
                        <td className="py-3.5">
                          <div className="flex items-center justify-center gap-3 text-[#9ca3af]">
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete({
                                  type: "history",
                                  id: item.id,
                                  label: `Transaction #${item.transactionId} (${item.type})`,
                                });
                              }}
                              className="hover:text-red-500 transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
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
    </>
  );
}

