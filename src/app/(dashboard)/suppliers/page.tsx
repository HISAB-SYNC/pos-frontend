"use client";

import {
  Download,
  Edit2,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[500px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <h2 className="text-base font-semibold text-[#111827]">New Supplier</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        {/* Avatar Upload Dropzone */}
        <div className="mb-5 flex items-center justify-center gap-4">
          <label className="group relative flex size-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-[#d1d5db] transition-colors hover:border-[#2563eb]">
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
                className="size-full rounded-full object-cover"
              />
            ) : (
              <UploadCloud className="size-6 text-[#9ca3af] group-hover:text-[#2563eb]" />
            )}
          </label>

          <div className="text-left text-xs">
            <p className="font-medium text-[#374151]">Supplier Logo / Photo</p>
            <p className="text-[11px] text-[#9ca3af]">PNG, JPG up to 2MB</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Supplier Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. BGI Ethiopia"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Product Provided</label>
              <input
                name="product"
                value={form.product}
                onChange={handleChange}
                placeholder="e.g. Beverages"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Phone Number</label>
              <input
                name="contactInfo"
                value={form.contactInfo}
                onChange={handleChange}
                placeholder="e.g. +251 91 123 4567"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. supplier@domain.com"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Return Policy</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              <option value="Taking Return">Taking Return</option>
              <option value="Not Taking Return">Not Taking Return</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
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
              className="rounded-lg bg-[#111827] px-5 py-2 font-medium text-white hover:bg-[#1f2937] disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">

      <div className="w-full max-w-[480px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <h2 className="text-base font-semibold text-[#111827]">Edit Supplier</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Supplier Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Product</label>
              <input
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Contact Number</label>
              <input
                value={form.contactInfo}
                onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Return Policy</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              <option value="Taking Return">Taking Return</option>
              <option value="Not Taking Return">Not Taking Return</option>
            </select>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">Delete Supplier</h3>
        <p className="mt-1 text-xs text-[#6b7280]">
          Are you sure you want to delete supplier <span className="font-semibold text-[#111827]">{supplier.name}</span>?
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
    <>
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

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <h1 className="text-lg font-semibold text-[#111827]">Suppliers ({filteredSuppliers.length})</h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suppliers..."
                className="h-9 w-48 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            {/* Filter button & dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                  typeFilter !== "ALL"
                    ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
                Filters
                {typeFilter !== "ALL" && (
                  <span className="size-2 rounded-full bg-blue-600" />
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-2">
                    <span className="font-bold text-[#111827]">Filter Suppliers</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTypeFilter("ALL");
                        setShowFilterDropdown(false);
                      }}
                      className="flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#111827]"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-[#374151]">Return Policy</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="h-8 w-full rounded-lg border border-[#e5e7eb] px-2 text-[#111827]"
                    >
                      <option value="ALL">All Types</option>
                      <option value="Taking Return">Taking Return</option>
                      <option value="Not Taking Return">Not Taking Return</option>
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

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Download className="size-3.5 text-[#6b7280]" />
              Download
            </button>

            {/* Add Supplier button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              <Plus className="size-3.5" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                <th className="px-6 py-3 font-medium">Supplier Name</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Contact Number</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">On the way</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9fafb]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <LoadingState />
                  </td>
                </tr>
              ) : currentSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#9ca3af]">
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
                      className="transition-colors hover:bg-[#f9fafb]"
                    >
                      <td className="px-6 py-3.5 font-medium text-[#111827]">
                        {supplier.name}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">
                        {supplier.product || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">
                        {supplier.contactInfo || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">
                        {supplier.email || `${supplier.name.toLowerCase().replace(/\s+/g, "")}@gmail.com`}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-medium ${
                            isTakingReturn ? "text-[#16a34a]" : "text-[#dc2626]"
                          }`}
                        >
                          {supplier.type || "Taking Return"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">
                        {supplier.onTheWay ?? "-"}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 text-[#6b7280]">
                          <button
                            type="button"
                            onClick={() => setSupplierToEdit(supplier)}
                            title="Edit Supplier"
                            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(supplier)}
                            title="Delete Supplier"
                            className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600 transition-colors"
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
    </>
  );
}
