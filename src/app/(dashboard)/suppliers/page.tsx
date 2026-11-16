"use client";

import {
  ArrowUpRight,
  Building2,
  Download,
  Edit2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useDismiss } from "@/hooks/use-dismiss";

import { PaySupplierModal, supplierKey } from "@/components/funds/pay-supplier-modal";
import { SupplierDetailPanel, type SupplierDetailTarget } from "@/components/suppliers/supplier-detail-panel";
import { useT } from "@/lib/i18n/use-t";
import { LoadingState } from "@/components/shared/loading-state";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { RouteGuard } from "@/components/shared/route-guard";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/lib/api";
import { getSupplierPayables, getSupplierPayments } from "@/lib/api/app-data";
import type { Supplier, SupplierPayables } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Add Supplier                                                */
/* ------------------------------------------------------------------ */
function AddSupplierModal({
  open,
  initialName = "",
  onClose,
  onCreated,
  shopId,
}: {
  open: boolean;
  /** Pre-fills the name, e.g. when adding a supplier that was only typed in on a restock */
  initialName?: string;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
}) {
  const t = useT();
  const [form, setForm] = useState({
    name: initialName,
    product: "",
    category: "",
    email: "",
    contactInfo: "",
    type: "Taking Return" as "Taking Return" | "Not Taking Return",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createSupplier(shopId, {
        name: form.name.trim(),
        product: form.product.trim(),
        contactInfo: form.contactInfo.trim(),
        email: form.email.trim(),
        type: form.type,
        onTheWay: "-",
      });
      onCreated();
      onClose();
      setForm({
        name: "",
        product: "",
        category: "",
        email: "",
        contactInfo: "",
        type: "Taking Return",
      });
      setPreviewImage(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[480px] rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("suppliers.addTitle")}</h2>
            <p className="text-xs text-zinc-500">{t("suppliers.addSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Avatar Upload Dropzone */}
        <div className="mb-4 flex items-center gap-3.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3">
          <label className="group relative flex size-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white transition-colors hover:border-[#5B4FE9]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {previewImage ? (
              <img
                src={previewImage}
                alt={t("suppliers.logoAlt")}
                className="size-full rounded-lg object-cover"
              />
            ) : (
              <UploadCloud className="size-5 text-zinc-400 group-hover:text-[#5B4FE9] transition-colors" />
            )}
          </label>

          <div className="text-left text-xs">
            <p className="font-semibold text-zinc-800">{t("suppliers.logoTitle")}</p>
            <p className="text-[11px] text-zinc-500">{t("suppliers.logoHint")}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">{t("suppliers.nameRequired")}</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder={t("suppliers.namePlaceholder")}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">{t("suppliers.productLine")}</label>
              <input
                name="product"
                value={form.product}
                onChange={handleChange}
                placeholder={t("suppliers.productPlaceholder")}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">{t("suppliers.contactNumber")}</label>
              <input
                name="contactInfo"
                value={form.contactInfo}
                onChange={handleChange}
                placeholder={t("suppliers.phonePlaceholder")}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">{t("shared.email")}</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("suppliers.emailPlaceholder")}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">{t("suppliers.returnPolicy")}</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            >
              <option value="Taking Return">{t("suppliers.policyTakingOption")}</option>
              <option value="Not Taking Return">{t("suppliers.policyNotOption")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {t("suppliers.discard")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-5 py-2 font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? t("suppliers.adding") : t("suppliers.addSupplier")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Supplier                                               */
/* ------------------------------------------------------------------ */
function EditSupplierModal({
  supplier,
  onClose,
  onUpdated,
  shopId,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
}) {
  const t = useT();
  const [form, setForm] = useState({
    name: "",
    product: "",
    email: "",
    contactInfo: "",
    type: "Taking Return" as "Taking Return" | "Not Taking Return",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        product: supplier.product || "",
        email: supplier.email || "",
        contactInfo: supplier.contactInfo || "",
        type: (supplier.type as any) || "Taking Return",
      });
    }
  }, [supplier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier || !form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateSupplier(shopId, supplier.id, {
        name: form.name.trim(),
        product: form.product.trim(),
        email: form.email.trim(),
        contactInfo: form.contactInfo.trim(),
        type: form.type,
      });
      onUpdated();
      onClose();
    } catch {
      onUpdated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[480px] rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("suppliers.editTitle")}</h2>
            <p className="text-xs text-zinc-500">{t("suppliers.editSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">{t("suppliers.nameRequired")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">{t("suppliers.productLine")}</label>
              <input
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">{t("suppliers.contactNumber")}</label>
              <input
                value={form.contactInfo}
                onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">{t("shared.email")}</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">{t("suppliers.returnPolicy")}</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            >
              <option value="Taking Return">{t("suppliers.policyTakingOption")}</option>
              <option value="Not Taking Return">{t("suppliers.policyNotOption")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-5 py-2 font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? t("shared.saving") : t("suppliers.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Delete Supplier Confirmation                                */
/* ------------------------------------------------------------------ */
function DeleteSupplierDialog({
  supplier,
  onClose,
  onDeleted,
  shopId,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const t = useT();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!supplier) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(shopId, supplier.id);
      onDeleted();
      onClose();
    } catch {
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-500/15">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold tracking-tight text-zinc-900">{t("suppliers.deleteTitle")}</h3>
        <p className="mt-1 text-xs text-zinc-500">
          {t("suppliers.deleteConfirm", { name: supplier.name })}
        </p>

        <div className="mt-5 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {t("shared.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-md bg-rose-600 px-4 py-2 font-bold text-white shadow-2xs hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isDeleting ? t("suppliers.deleting") : t("suppliers.deletePermanently")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Row menu: Edit / Delete                                            */
/* ------------------------------------------------------------------ */
function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label={t("suppliers.moreActions")}
        className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-2xs transition-colors hover:border-zinc-300 hover:text-zinc-900"
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-xs shadow-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Edit2 className="size-3.5 text-zinc-500" />
            {t("suppliers.editTooltip")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="size-3.5" />
            {t("suppliers.deleteTooltip")}
          </button>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 15;
type View = "ALL" | "OWE" | "SETTLED";

type OwedInfo = { owed: number; restocks: number };

function SuppliersContent() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;
  const t = useT();
  const searchParams = useSearchParams();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filter State
  const [view, setView] = useState<View>(searchParams.get("filter") === "owed" ? "OWE" : "ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useDismiss<HTMLDivElement>(showFilterDropdown, () => setShowFilterDropdown(false));

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // What is owed to each supplier for pay-later restocks, and what was paid lately
  const [payables, setPayables] = useState<SupplierPayables | null>(null);
  const [paidLast30, setPaidLast30] = useState(0);
  const [payKey, setPayKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupplierDetailTarget | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, owed, payments] = await Promise.all([
        getSuppliers(shopId),
        getSupplierPayables(shopId).catch(() => null),
        getSupplierPayments(shopId, { limit: 200 }).catch(() => []),
      ]);
      setSuppliers(data ?? []);
      setPayables(owed);
      const since = Date.now() - 30 * 86400000;
      setPaidLast30(
        Math.round(payments.filter((p) => new Date(p.paidAt).getTime() >= since).reduce((s, p) => s + p.amount, 0) * 100) / 100,
      );
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const owedById = useMemo(() => {
    const map = new Map<string, OwedInfo>();
    payables?.suppliers.forEach((p) => {
      if (p.supplierId) map.set(p.supplierId, { owed: p.owed, restocks: p.purchases.length });
    });
    return map;
  }, [payables]);

  // Owed to suppliers that were only typed in by name (no entry in the supplier list)
  const unlisted = useMemo(
    () =>
      (payables?.suppliers ?? [])
        .filter((p) => !p.supplierId)
        .map((p) => ({ key: supplierKey(p), name: p.supplierName || t("payments.unnamedSupplier"), owed: p.owed, restocks: p.purchases.length })),
    [payables, t],
  );

  const totalOwed = payables?.totalOwed ?? 0;
  const owingCount = payables?.suppliers.length ?? 0;

  // Client-side filtering, suppliers that are owed money first
  const matchesSearch = useCallback(
    (name: string, product?: string, email?: string) => {
      const q = debouncedSearch.trim().toLowerCase();
      if (!q) return true;
      return name.toLowerCase().includes(q) || !!product?.toLowerCase().includes(q) || !!email?.toLowerCase().includes(q);
    },
    [debouncedSearch],
  );

  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((s) => {
        if (typeFilter !== "ALL" && s.type !== typeFilter) return false;
        const owes = owedById.has(s.id);
        if (view === "OWE" && !owes) return false;
        if (view === "SETTLED" && owes) return false;
        return matchesSearch(s.name, s.product, s.email);
      })
      .sort((a, b) => (owedById.get(b.id)?.owed ?? 0) - (owedById.get(a.id)?.owed ?? 0) || a.name.localeCompare(b.name));
  }, [suppliers, typeFilter, view, owedById, matchesSearch]);

  const shownUnlisted = view === "SETTLED" ? [] : unlisted.filter((u) => matchesSearch(u.name));

  const pagination = usePagination(filteredSuppliers, PAGE_SIZE);
  const currentSuppliers = pagination.pageItems;

  function handleDownload() {
    exportToCsv("suppliers-directory", filteredSuppliers, [
      { header: t("suppliers.supplierName"), key: "name" },
      { header: t("suppliers.productSupplied"), key: "product" },
      { header: t("suppliers.contactNumber"), key: "contactInfo" },
      { header: t("shared.email"), key: "email" },
      { header: t("suppliers.returnPolicy"), key: "type" },
      { header: t("suppliers.owed"), formatter: (s) => owedById.get(s.id)?.owed ?? 0 },
      { header: t("suppliers.shipmentsOnTheWay"), key: "onTheWay" },
    ]);
  }

  function openAdd(name = "") {
    setAddName(name);
    setShowAddModal(true);
  }

  const chips: Array<{ id: View; label: string; count?: number }> = [
    { id: "ALL", label: t("suppliers.chip.all") },
    { id: "OWE", label: t("suppliers.chip.owe"), count: owingCount },
    { id: "SETTLED", label: t("suppliers.chip.settled") },
  ];

  return (
    <>
      {showAddModal && (
        <AddSupplierModal
          key={addName}
          open
          initialName={addName}
          onClose={() => setShowAddModal(false)}
          onCreated={load}
          shopId={shopId}
        />
      )}

      <EditSupplierModal
        supplier={supplierToEdit}
        onClose={() => setSupplierToEdit(null)}
        onUpdated={load}
        shopId={shopId}
      />

      <DeleteSupplierDialog
        supplier={supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onDeleted={load}
        shopId={shopId}
      />

      {detail && (
        <SupplierDetailPanel
          shopId={shopId}
          target={detail}
          payable={payables?.suppliers.find((p) => supplierKey(p) === detail.key) ?? null}
          onClose={() => setDetail(null)}
          onPay={setPayKey}
          onEdit={(s) => setSupplierToEdit(s)}
          onDelete={(s) => setSupplierToDelete(s)}
          onAddToList={(name) => openAdd(name)}
        />
      )}

      {payKey !== null && (
        <PaySupplierModal
          shopId={shopId}
          initialSupplierKey={payKey || undefined}
          onClose={() => setPayKey(null)}
          onPaid={load}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-900 text-indigo-400 shadow-2xs">
                <Building2 className="size-4 text-indigo-400" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">{t("suppliers.title")}</h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{t("suppliers.subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 active:scale-95"
            >
              <Download className="size-3.5 text-zinc-500" />
              {t("suppliers.exportDirectory")}
            </button>
            <button
              type="button"
              onClick={() => openAdd()}
              className="flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus className="size-3.5 text-indigo-400" />
              {t("suppliers.addSupplier")}
            </button>
          </div>
        </div>

        {/* What you owe, how many suppliers, what you paid lately */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className={`rounded-xl border p-4 shadow-2xs sm:p-5 ${
              totalOwed > 0 ? "border-amber-200 bg-amber-50/70" : "border-zinc-200/80 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${totalOwed > 0 ? "text-amber-900" : "text-zinc-600"}`}>
                {t("suppliers.oweCardTitle")}
              </span>
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${
                  totalOwed > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <Wallet className="size-4" />
              </span>
            </div>
            {totalOwed > 0 ? (
              <>
                <p className="mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums text-amber-900">
                  {totalOwed.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                  <span className="text-xs font-semibold text-amber-800/70">{t("shared.etb")}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-amber-900/70">{t.n("suppliers.oweCardHint", owingCount)}</p>
                <button
                  type="button"
                  onClick={() => setPayKey("")}
                  className="mt-3 inline-flex h-8 items-center rounded-md bg-amber-900 px-3 text-xs font-bold text-white transition-colors hover:bg-amber-950"
                >
                  {t("suppliers.payASupplier")}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm font-semibold text-zinc-800">{t("suppliers.nothingOweCard")}</p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">{t("suppliers.totalSuppliers")}</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/15">
                <Building2 className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums text-zinc-900">{suppliers.length}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{t("suppliers.registeredHint")}</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">{t("suppliers.paid30Title")}</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-200/70">
                <ArrowUpRight className="size-4" strokeWidth={2.5} />
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight tabular-nums text-zinc-900">
              {paidLast30.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              <span className="text-xs font-semibold text-zinc-500">{t("shared.etb")}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{t("suppliers.paid30Hint")}</p>
          </div>
        </div>

        {/* Owed to suppliers that are not in the list yet */}
        {shownUnlisted.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-2xs">
            <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-bold text-amber-950">{t("suppliers.unlistedTitle")}</h2>
              <p className="mt-0.5 text-[11px] text-amber-900/70">{t("suppliers.unlistedHint")}</p>
            </div>
            <ul className="divide-y divide-zinc-100">
              {shownUnlisted.map((u) => (
                <li key={u.key} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-50 font-mono text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
                    {u.name.slice(0, 2).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetail({ key: u.key, supplier: null, name: u.name })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-zinc-900 hover:underline">{u.name}</p>
                    <p className="text-[11px] text-zinc-500">{t.n("suppliers.unpaidRestocks", u.restocks)}</p>
                  </button>
                  <span className="font-mono text-sm font-bold tabular-nums text-amber-800">
                    {u.owed.toLocaleString("en-US", { maximumFractionDigits: 2 })} {t("shared.etb")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayKey(u.key)}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-95"
                    >
                      {t("suppliers.pay")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openAdd(u.name)}
                      className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50"
                    >
                      {t("suppliers.addToList")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Directory */}
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setView(chip.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all ${
                    view === chip.id
                      ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                      : "font-medium text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {chip.label}
                  {chip.count !== undefined && chip.count > 0 && (
                    <span className="rounded-full bg-amber-100 px-1.5 font-mono text-[10px] font-bold text-amber-800">
                      {chip.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("suppliers.searchPlaceholder")}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:bg-white focus:outline-hidden sm:w-56"
                />
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium shadow-2xs transition-colors ${
                    typeFilter !== "ALL"
                      ? "border-[#5B4FE9] bg-indigo-50 text-[#5B4FE9]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <SlidersHorizontal className="size-3.5 text-zinc-500" />
                  {t("suppliers.filterPolicy")}
                  {typeFilter !== "ALL" && <span className="size-1.5 rounded-full bg-[#5B4FE9]" />}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-11 z-30 w-56 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="font-bold text-zinc-900">{t("suppliers.returnPolicy")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTypeFilter("ALL");
                          setShowFilterDropdown(false);
                        }}
                        className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 transition-colors hover:text-zinc-900"
                      >
                        <RotateCcw className="size-3" />
                        {t("shared.reset")}
                      </button>
                    </div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-zinc-900 focus:border-[#5B4FE9] focus:outline-hidden"
                    >
                      <option value="ALL">{t("suppliers.allPolicies")}</option>
                      <option value="Taking Return">{t("suppliers.policyTaking")}</option>
                      <option value="Not Taking Return">{t("suppliers.policyNot")}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(false)}
                      className="w-full rounded-md bg-slate-900 py-1.5 font-bold text-white shadow-2xs transition-colors hover:bg-slate-800"
                    >
                      {t("suppliers.apply")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3">{t("suppliers.col.supplier")}</th>
                  <th className="px-4 py-3">{t("suppliers.col.contact")}</th>
                  <th className="px-4 py-3 text-right">{t("suppliers.col.youOwe")}</th>
                  <th className="px-5 py-3 text-right">{t("shared.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                      {view === "ALL" && typeFilter === "ALL" && !debouncedSearch ? t("suppliers.empty") : t("suppliers.noOweMatch")}
                    </td>
                  </tr>
                ) : (
                  currentSuppliers.map((supplier) => {
                    const info = owedById.get(supplier.id);
                    return (
                      <tr
                        key={supplier.id}
                        onClick={() =>
                          setDetail({ key: supplierKey({ supplierId: supplier.id, supplierName: supplier.name }), supplier, name: supplier.name })
                        }
                        className="cursor-pointer transition-colors hover:bg-zinc-50/60"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 font-mono text-[11px] font-bold text-zinc-700 ring-1 ring-zinc-200">
                              {supplier.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-zinc-900">{supplier.name}</p>
                              {supplier.product && <p className="truncate text-[11px] text-zinc-500">{supplier.product}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-zinc-700">{supplier.contactInfo || "—"}</p>
                          {supplier.email && <p className="font-mono text-[11px] text-zinc-400">{supplier.email}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {info ? (
                            <>
                              <p className="font-mono font-bold tabular-nums text-amber-800">
                                {info.owed.toLocaleString("en-US", { maximumFractionDigits: 2 })} {t("shared.etb")}
                              </p>
                              <p className="text-[11px] text-zinc-500">{t.n("suppliers.unpaidRestocks", info.restocks)}</p>
                            </>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {info && (
                              <button
                                type="button"
                                onClick={() => setPayKey(supplierKey({ supplierId: supplier.id, supplierName: supplier.name }))}
                                className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
                              >
                                {t("suppliers.pay")}
                              </button>
                            )}
                            <RowMenu onEdit={() => setSupplierToEdit(supplier)} onDelete={() => setSupplierToDelete(supplier)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination pagination={pagination} noun={t("suppliers.noun")} />
        </div>
      </div>
    </>
  );
}

export default function SuppliersPage() {
  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <Suspense fallback={<LoadingState />}>
        <SuppliersContent />
      </Suspense>
    </RouteGuard>
  );
}
