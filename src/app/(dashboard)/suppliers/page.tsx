"use client";

import {
  Building2,
  Download,
  Edit2,
  Filter,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/lib/api";
import type { Supplier } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Add Supplier                                                */
/* ------------------------------------------------------------------ */
function AddSupplierModal({
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
  const [form, setForm] = useState({
    name: "",
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
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Add New Supplier</h2>
            <p className="text-xs text-zinc-500">Register vendor details and return policies</p>
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
                alt="Supplier"
                className="size-full rounded-lg object-cover"
              />
            ) : (
              <UploadCloud className="size-5 text-zinc-400 group-hover:text-[#5B4FE9] transition-colors" />
            )}
          </label>

          <div className="text-left text-xs">
            <p className="font-semibold text-zinc-800">Supplier Logo / Brand Photo</p>
            <p className="text-[11px] text-zinc-500">PNG, JPG up to 2MB (Optional)</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">Supplier Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. BGI Ethiopia"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Product Line</label>
              <input
                name="product"
                value={form.product}
                onChange={handleChange}
                placeholder="e.g. Beverages"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Contact Number</label>
              <input
                name="contactInfo"
                value={form.contactInfo}
                onChange={handleChange}
                placeholder="e.g. +251 91 123 4567"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. supplier@domain.com"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">Return Policy</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            >
              <option value="Taking Return">Taking Return (Accepts returns of damaged/expired stock)</option>
              <option value="Not Taking Return">Not Taking Return (Final sale / no return)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-5 py-2 font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Supplier"}
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
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Edit Supplier</h2>
            <p className="text-xs text-zinc-500">Update vendor contact details and return policies</p>
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
            <label className="font-semibold text-zinc-700">Supplier Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Product Line</label>
              <input
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Contact Number</label>
              <input
                value={form.contactInfo}
                onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">Email Address</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">Return Policy</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
            >
              <option value="Taking Return">Taking Return (Accepts returns of damaged/expired stock)</option>
              <option value="Not Taking Return">Not Taking Return (Final sale / no return)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-5 py-2 font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
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
        <h3 className="text-base font-bold tracking-tight text-zinc-900">Delete Supplier</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Are you sure you want to delete supplier <span className="font-semibold text-zinc-800">{supplier.name}</span>? This action cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-md bg-rose-600 px-4 py-2 font-bold text-white shadow-2xs hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 9;

export default function SuppliersPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filter State
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers(shopId);
      setSuppliers(data ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  // Operational Metrics
  const metrics = useMemo(() => {
    const total = suppliers.length;
    const takingReturns = suppliers.filter((s) => s.type === "Taking Return" || !s.type).length;
    const noReturns = suppliers.filter((s) => s.type === "Not Taking Return").length;
    const productLines = new Set(suppliers.map((s) => s.product?.trim()).filter(Boolean)).size;

    return { total, takingReturns, noReturns, productLines };
  }, [suppliers]);

  // Client-side filtering
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (typeFilter !== "ALL" && s.type !== typeFilter) return false;

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesProduct = s.product?.toLowerCase().includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q);
        return matchesName || matchesProduct || matchesEmail;
      }
      return true;
    });
  }, [suppliers, typeFilter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const currentSuppliers = useMemo(
    () => filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredSuppliers, page],
  );

  function handleDownload() {
    exportToCsv("suppliers-directory", filteredSuppliers, [
      { header: "Supplier Name", key: "name" },
      { header: "Product Supplied", key: "product" },
      { header: "Contact Number", key: "contactInfo" },
      { header: "Email Address", key: "email" },
      { header: "Return Policy", key: "type" },
      { header: "Shipments On The Way", key: "onTheWay" },
    ]);
  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <AddSupplierModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

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

      <div className="space-y-6">
        {/* ------------------------------------------------------------------ */}
        {/* 1. Header Toolbar & Title                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-900 text-indigo-400 shadow-2xs">
                <Building2 className="size-4 text-indigo-400" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Vendors &amp; Suppliers</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Manage product distributors, return policies, contact directory, and incoming supply lines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 active:scale-95"
            >
              <Download className="size-3.5 text-zinc-500" />
              Export Directory
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus className="size-3.5 text-indigo-400" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Top Metric Cards                                                */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Suppliers</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/15">
                <Building2 className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.total} <span className="font-sans text-xs font-normal text-zinc-500">vendors</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Registered supply partners</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Accepting Returns</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/15">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-emerald-800 tabular-nums">
              {metrics.takingReturns} <span className="font-sans text-xs font-normal text-zinc-500">vendors</span>
            </p>
            <p className="mt-1 text-[11px] font-medium text-emerald-600">Damage / expired stock returnable</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Strict / No Returns</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200">
                <ShieldAlert className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-zinc-800 tabular-nums">
              {metrics.noReturns} <span className="font-sans text-xs font-normal text-zinc-500">vendors</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Final sale policies</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Product Categories</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200">
                <PackageCheck className="size-4" />
              </div>
            </div>
            <p className="mt-2.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.productLines} <span className="font-sans text-xs font-normal text-zinc-500">categories</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Covered product lines</p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 3. Main Suppliers Directory Table & Filters                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-zinc-900">
                Directory ({filteredSuppliers.length})
              </span>
              {typeFilter !== "ALL" && (
                <span className="rounded-md border border-[#5B4FE9]/30 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5B4FE9]">
                  {typeFilter}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suppliers / products..."
                  className="h-9 w-full sm:w-56 rounded-md border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Filter button & dropdown */}
              <div className="relative">
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
                  Filter Policy
                  {typeFilter !== "ALL" && (
                    <span className="size-1.5 rounded-full bg-[#5B4FE9]" />
                  )}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="font-bold text-zinc-900">Return Policy</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTypeFilter("ALL");
                          setShowFilterDropdown(false);
                        }}
                        className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        <RotateCcw className="size-3" />
                        Reset
                      </button>
                    </div>

                    <div>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-zinc-900 focus:border-[#5B4FE9] focus:outline-hidden"
                      >
                        <option value="ALL">All Policies</option>
                        <option value="Taking Return">Taking Return</option>
                        <option value="Not Taking Return">Not Taking Return</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(false)}
                      className="w-full rounded-md bg-slate-900 py-1.5 font-bold text-white shadow-2xs hover:bg-slate-800 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left">
                  <th className="px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Supplier Name</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Product Line</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Contact Number</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Email Address</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Return Policy</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">Incoming Supply</th>
                  <th className="px-6 py-3 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                      No suppliers found matching filters.
                    </td>
                  </tr>
                ) : (
                  currentSuppliers.map((supplier) => {
                    const isTakingReturn =
                      supplier.type === "Taking Return" || supplier.type === undefined;

                    return (
                      <tr
                        key={supplier.id}
                        className="transition-colors hover:bg-zinc-50/60"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 font-mono text-[11px] font-bold text-zinc-700 ring-1 ring-zinc-200">
                              {supplier.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-zinc-900">
                              {supplier.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-700">
                          {supplier.product || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-zinc-600">
                          {supplier.contactInfo || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-zinc-500">
                          {supplier.email || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                              isTakingReturn
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                : "bg-zinc-100 text-zinc-600 border border-zinc-200/80"
                            }`}
                          >
                            {supplier.type || "Taking Return"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-zinc-600">
                          {supplier.onTheWay ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSupplierToEdit(supplier)}
                              title="Edit Supplier"
                              className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-2xs hover:border-zinc-300 hover:text-zinc-900 transition-colors"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSupplierToDelete(supplier)}
                              title="Delete Supplier"
                              className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-2xs hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
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
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
