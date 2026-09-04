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
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  recordDebtPayment,
  updateCustomer,
} from "@/lib/api/app-data";
import type { Customer } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Customer Information                                        */
/* ------------------------------------------------------------------ */
function CustomerInfoModal({
  customer,
  onClose,
  onRecordPayment,
}: {
  customer: Customer | null;
  onClose: () => void;
  onRecordPayment: (customerId: string) => void;
}) {
  if (!customer) return null;

  const debt = parseFloat(customer.debtBalance || "0");
  const limit = parseFloat(String(customer.creditLimit || "5000"));
  const available = Math.max(0, limit - debt);

  function handleDownloadCustomerDetails() {
    if (!customer) return;
    exportToCsv(`customer-${customer.name.toLowerCase().replace(/\s+/g, "-")}`, [customer], [
      { header: "Customer Name", key: "name" },
      { header: "Customer ID", formatter: (c) => c.customerId || "Cust-001" },
      { header: "Phone Number", key: "phone" },
      { header: "Address", key: "address" },
      { header: "Total Debt (ETB)", formatter: () => debt.toFixed(2) },
      { header: "Credit Limit (ETB)", formatter: () => limit.toFixed(2) },
      { header: "Available Credit (ETB)", formatter: () => available.toFixed(2) },
      { header: "Status", formatter: (c) => c.status || "Active" },
    ]);
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[560px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">Customer Information</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCustomerDetails}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Download className="size-3.5 text-[#6b7280]" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-2 gap-8 border-b border-[#f3f4f6] pb-6">
          {/* Customer Details */}
          <div>
            <h3 className="mb-3 text-xs font-semibold text-[#111827]">Customer Details</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customer name</span>
                <span className="font-medium text-[#111827]">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customer ID</span>
                <span className="font-medium text-[#111827]">{customer.customerId || "Cust-001"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Address</span>
                <span className="font-medium text-[#111827]">{customer.address || "Bole, Addis Ababa"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Phone Number</span>
                <span className="font-medium text-[#111827]">{customer.phone || "+251912345678"}</span>
              </div>
            </div>
          </div>

          {/* Credit Details */}
          <div>
            <h3 className="mb-3 text-xs font-semibold text-[#111827]">Credit Details</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Total debt:</span>
                <span className="font-semibold text-[#dc2626]">{debt.toLocaleString()} Birr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Credit limit:</span>
                <span className="font-medium text-[#111827]">{limit.toLocaleString()} Birr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Available Credit:</span>
                <span className="font-semibold text-[#16a34a]">{available.toLocaleString()} Birr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transaction */}
        <div className="py-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#111827]">Recent Transaction</h3>
          </div>

          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {customer.debtHistory && customer.debtHistory.length > 0 ? (
              customer.debtHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-4 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-medium text-[#111827]">{tx.type} ({tx.reference})</p>
                    <p className="text-[10px] text-[#9ca3af]">{tx.date} • {tx.paymentMethod || "Debt"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()}`} ETB
                    </p>
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-[#6b7280]">
                      Bal: {tx.remainingBalance.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              ))
            ) : customer.recentTransactions && customer.recentTransactions.length > 0 ? (
              customer.recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-4 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-medium text-[#111827]">{tx.type}</p>
                    <p className="text-[10px] text-[#9ca3af]">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#111827]">{tx.amount}</p>
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-[#ef4444]">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-[#f9fafb] px-4 py-2.5 text-xs">
                <p className="text-[#9ca3af]">No transaction history recorded yet.</p>
              </div>
            )}
          </div>
        </div>


        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onRecordPayment(customer.id)}
            className="flex-1 rounded-lg bg-[#111827] py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Add Customer                                                */
/* ------------------------------------------------------------------ */
function AddCustomerModal({
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
    phone: "",
    email: "",
    address: "",
    creditLimit: "5000",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createCustomer(shopId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      onCreated();
      onClose();
      setForm({ name: "", phone: "", email: "", address: "", creditLimit: "5000" });
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
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">New Customer</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Customer Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Almaz Kebede"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +251 91 123 4567"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Credit Limit (ETB)</label>
              <input
                name="creditLimit"
                type="number"
                value={form.creditLimit}
                onChange={handleChange}
                placeholder="5000"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Address / Location</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Bole, Addis Ababa"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
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
              {isSubmitting ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Customer                                               */
/* ------------------------------------------------------------------ */
function EditCustomerModal({
  customer,
  onClose,
  onUpdated,
  shopId,
}: {
  customer: Customer | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
      });
    }
  }, [customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateCustomer(shopId, customer.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
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

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <h2 className="text-base font-semibold text-[#111827]">Edit Customer</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Customer Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Phone Number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
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
/* Modal: Delete Customer Confirmation Dialog                         */
/* ------------------------------------------------------------------ */
function DeleteCustomerDialog({
  customer,
  onClose,
  onDeleted,
  shopId,
}: {
  customer: Customer | null;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!customer) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(shopId, customer.id);
      onDeleted();
      onClose();
    } catch {
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">Delete Customer</h3>
        <p className="mt-1 text-xs text-[#6b7280]">
          Are you sure you want to delete <span className="font-semibold text-[#111827]">{customer.name}</span>?
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
export default function CustomersPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "WITH_DEBT" | "NO_DEBT">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modals State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Payment State
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Mobile Payment">("Cash");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers(shopId);
      setCustomers(data ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  // Combined Filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const debt = parseFloat(String(cust.debtBalance || "0"));

      if (activeTab === "WITH_DEBT" && debt <= 0) return false;
      if (activeTab === "NO_DEBT" && debt > 0) return false;

      if (statusFilter !== "ALL" && cust.status !== statusFilter) return false;

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase();
        const matchesName = cust.name.toLowerCase().includes(q);
        const matchesPhone = cust.phone?.toLowerCase().includes(q);
        const matchesId = cust.customerId?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId;
      }
      return true;
    });
  }, [customers, activeTab, statusFilter, debouncedSearch]);

  function handleDownload() {
    exportToCsv("customers-ledger", filteredCustomers, [
      { header: "Customer ID", formatter: (c) => c.customerId || "Cust-001" },
      { header: "Customer Name", key: "name" },
      { header: "Phone Number", key: "phone" },
      { header: "Address", key: "address" },
      {
        header: "Outstanding Debt (ETB)",
        formatter: (c) => parseFloat(String(c.debtBalance || "0")).toFixed(2),
      },
      {
        header: "Credit Limit (ETB)",
        formatter: (c) => parseFloat(String(c.creditLimit || "5000")).toFixed(2),
      },
      { header: "Status", formatter: (c) => c.status || "Active" },
    ]);
  }

  return (
    <>
      <AddCustomerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <EditCustomerModal
        customer={customerToEdit}
        onClose={() => setCustomerToEdit(null)}
        onUpdated={load}
        shopId={shopId}
      />

      <DeleteCustomerDialog
        customer={customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onDeleted={load}
        shopId={shopId}
      />

      <CustomerInfoModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onRecordPayment={(cid) => {
          const c = customers.find((x) => x.id === cid) || null;
          setSelectedCustomer(null);
          setPaymentCustomer(c);
        }}
      />

      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#111827]">Customers ({filteredCustomers.length})</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="h-9 w-48 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            {/* Filter button & dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                  statusFilter !== "ALL"
                    ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
                Filters
                {statusFilter !== "ALL" && (
                  <span className="size-2 rounded-full bg-blue-600" />
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-2">
                    <span className="font-bold text-[#111827]">Filter Customers</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setShowFilterDropdown(false);
                      }}
                      className="flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#111827]"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-[#374151]">Account Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-8 w-full rounded-lg border border-[#e5e7eb] px-2 text-[#111827]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Overdue">Overdue</option>
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

            {/* Add customer */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              <Plus className="size-3.5" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#e5e7eb] px-6">
          {[
            { id: "ALL", label: "All Customers" },
            { id: "WITH_DEBT", label: "With Outstanding Debt" },
            { id: "NO_DEBT", label: "Zero Balance" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                <th className="px-6 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Phone Number</th>
                <th className="px-4 py-3 font-medium">Total Debt</th>
                <th className="px-4 py-3 font-medium">Credit Limit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9fafb]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <LoadingState />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#9ca3af]">
                    No customers found matching filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const debt = parseFloat(customer.debtBalance || "0");
                  const limit = parseFloat(String(customer.creditLimit || "5000"));

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="cursor-pointer transition-colors hover:bg-[#f9fafb]"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-[#111827] hover:text-[#2563eb]">
                          {customer.name}
                        </span>
                        <p className="text-[10px] text-[#9ca3af]">{customer.customerId || "Cust-001"}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">{customer.phone || "+251912345678"}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold ${
                            debt > 0 ? "text-[#dc2626]" : "text-[#16a34a]"
                          }`}
                        >
                          {debt.toLocaleString()} Birr
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">{limit.toLocaleString()} ETB</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white ${
                            customer.status === "Overdue" ? "bg-[#ef4444]" : "bg-[#16a34a]"
                          }`}
                        >
                          {customer.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-2 text-[#6b7280]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setCustomerToEdit(customer)}
                            title="Edit Customer"
                            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(customer)}
                            title="Delete Customer"
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
      </div>

      {/* Repayment Modal from Customer Info */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
              <h2 className="text-base font-semibold text-[#111827]">Record Payment for {paymentCustomer.name}</h2>
              <button
                type="button"
                onClick={() => setPaymentCustomer(null)}
                className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const val = parseFloat(payAmount);
                if (val <= 0) return;
                await recordDebtPayment(shopId, {
                  customerId: paymentCustomer.id,
                  amount: val,
                  paymentMethod: payMethod,
                });
                setPaymentCustomer(null);
                setPayAmount("");
                load();
              }}
              className="space-y-4 text-xs"
            >
              <div className="rounded-xl bg-[#f9fafb] p-3">
                <span className="text-[#6b7280]">Current Outstanding:</span>
                <span className="ml-2 font-bold text-[#dc2626]">
                  {parseFloat(paymentCustomer.debtBalance || "0").toLocaleString()} ETB
                </span>
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#374151]">Amount to Pay (ETB)</label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 font-semibold text-[#111827] focus:border-[#2563eb] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#374151]">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Payment">Mobile Payment</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#111827] px-5 py-2 font-medium text-white hover:bg-slate-800"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
