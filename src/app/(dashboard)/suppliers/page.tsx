"use client";

import { Download, Filter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createSupplier, getSuppliers } from "@/lib/api";
import type { Supplier } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Add Supplier (Matching Screenshot)                          */
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Title */}
        <h2 className="mb-6 text-base font-semibold text-[#111827]">New Supplier</h2>

        {/* Avatar Upload Dropzone */}
        <div className="mb-7 flex items-center justify-center gap-5">
          <label className="group relative flex size-20 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-[#d1d5db] transition-colors hover:border-[#2563eb]">
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
              <svg
                className="size-10 text-[#9ca3af] transition-colors group-hover:text-[#2563eb]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </label>

          <div className="text-left text-xs">
            <p className="text-[#6b7280]">Drag image here</p>
            <p className="my-0.5 text-[11px] text-[#9ca3af]">or</p>
            <label className="cursor-pointer font-medium text-[#2563eb] hover:underline">
              Browse image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Supplier Name */}
          <div className="flex items-center gap-4">
            <label className="w-32 text-xs font-medium text-[#374151]">Supplier Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Entersupplier name"
              className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Product */}
          <div className="flex items-center gap-4">
            <label className="w-32 text-xs font-medium text-[#374151]">Product</label>
            <input
              name="product"
              value={form.product}
              onChange={handleChange}
              required
              placeholder="Enter product"
              className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Category */}
          <div className="flex items-center gap-4">
            <label className="w-32 text-xs font-medium text-[#374151]">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Select product category"
              className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Email */}
          <div className="flex items-center gap-4">
            <label className="w-32 text-xs font-medium text-[#374151]">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter Supplier Email"
              className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Contact Number */}
          <div className="flex items-center gap-4">
            <label className="w-32 text-xs font-medium text-[#374151]">Contact Number</label>
            <input
              name="contactInfo"
              value={form.contactInfo}
              onChange={handleChange}
              placeholder="Enter supplier contact number"
              className="h-10 flex-1 rounded-lg border border-[#e5e7eb] px-3.5 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Type Selectable Chips */}
          <div className="flex items-start gap-4 pt-1">
            <label className="w-32 pt-2 text-xs font-medium text-[#374151]">Type</label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: "Not Taking Return" }))}
                className={`rounded-lg border px-4 py-2 text-xs transition-colors ${
                  form.type === "Not Taking Return"
                    ? "border-[#111827] bg-slate-50 font-medium text-[#111827]"
                    : "border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-slate-50"
                }`}
              >
                Not taking return
              </button>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: "Taking Return" }))}
                className={`rounded-lg border px-4 py-2 text-xs transition-colors ${
                  form.type === "Taking Return"
                    ? "border-[#111827] bg-slate-50 font-medium text-[#111827]"
                    : "border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-slate-50"
                }`}
              >
                Taking return
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] bg-white px-6 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#111827] px-6 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1f2937] disabled:opacity-50"
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
/* Main Suppliers Page Component                                       */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 14;

export default function SuppliersPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers(shopId);
      setSuppliers(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(suppliers.length / PAGE_SIZE));
  const currentSuppliers = useMemo(
    () => suppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [suppliers, page],
  );

  return (
    <>
      <AddSupplierModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <h1 className="text-lg font-semibold text-[#111827]">Suppliers</h1>

          <div className="flex items-center gap-2.5">
            {/* Download all button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              Download all
            </button>

            {/* Filters button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
              Filters
            </button>

            {/* Add Supplier button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
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
                <th className="px-6 py-3 font-medium">On the way</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9fafb]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <LoadingState />
                  </td>
                </tr>
              ) : currentSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#9ca3af]">
                    No suppliers found.
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
                      <td className="px-6 py-3.5 text-[#374151]">
                        {supplier.onTheWay ?? "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination matching screenshot: Previous (left) | Page 1 of 10 (center) | Next (right) */}
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
