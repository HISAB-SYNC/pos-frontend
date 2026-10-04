"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  CreditCard,
  Download,
  Edit2,
  FileText,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import {
  createCustomer,
  getCustomerDetail,
  getCustomers,
  recordDebtPayment,
  updateCustomer,
} from "@/lib/api/app-data";
import type { Customer } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

const PAGE_SIZE = 15;

/* ------------------------------------------------------------------ */
/* Modal: Customer Information Drawer / Modal                         */
/* ------------------------------------------------------------------ */
function CustomerInfoModal({
  customer: initialCustomer,
  shopId,
  onClose,
  onRecordPayment,
}: {
  customer: Customer | null;
  shopId: string;
  onClose: () => void;
  onRecordPayment: (customerId: string) => void;
}) {
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(initialCustomer);

  useEffect(() => {
    setDetailCustomer(initialCustomer);
    if (initialCustomer && shopId) {
      getCustomerDetail(shopId, initialCustomer.id)
        .then((data) => {
          if (data) {
            setDetailCustomer((prev) => ({ ...prev, ...data }));
          }
        })
        .catch(() => {});
    }
  }, [initialCustomer, shopId]);

  if (!detailCustomer) return null;
  const customer = detailCustomer;

  const debt = parseFloat(customer.debtBalance || "0");
  const limit = parseFloat(String(customer.creditLimit || "5000"));
  const available = Math.max(0, limit - debt);

  function handleDownloadCustomerDetails() {
    if (!customer) return;
    exportToCsv(`customer-${customer.name.toLowerCase().replace(/\s+/g, "-")}`, [customer], [
      { header: "Customer Name", key: "name" },
      { header: "Customer ID", formatter: (c) => c.customerId || `CUST-${c.id.slice(0, 6).toUpperCase()}` },
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
      <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 font-mono text-xs font-bold text-zinc-800">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">{customer.name}</h2>
              <p className="font-mono text-[10px] text-zinc-400">
                {customer.customerId || `CUST-${customer.id.slice(0, 6).toUpperCase()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCustomerDetails}
              className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Download className="size-3.5 text-zinc-500" />
              <span>Statement</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-zinc-100 pb-5">
          {/* Customer Details */}
          <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-3.5 space-y-2 text-xs">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Identity &amp; Contact
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Full Name</span>
              <span className="font-semibold text-zinc-900">{customer.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Phone</span>
              <span className="font-mono text-zinc-900">{customer.phone || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Address</span>
              <span className="text-zinc-900 truncate max-w-[150px]">{customer.address || "Addis Ababa"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status</span>
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                debt > 0 ? "border border-amber-200/70 bg-amber-50 text-amber-800" : "border border-emerald-200/70 bg-emerald-50 text-emerald-800"
              }`}>
                {debt > 0 ? "With Debt" : "Zero Debt"}
              </span>
            </div>
          </div>

          {/* Credit Details */}
          <div className="rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-3.5 space-y-2 text-xs">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Credit &amp; Ledger
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Total Debt</span>
              <span className={`font-mono font-bold tabular-nums ${debt > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                {debt.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Credit Limit</span>
              <span className="font-mono text-zinc-900 tabular-nums">{limit.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Available Credit</span>
              <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                {available.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Credit Health</span>
              <span className="font-mono text-[10px] text-zinc-600">
                {limit > 0 ? `${Math.round(((limit - debt) / limit) * 100)}% Headroom` : "100%"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Recent Account Ledger
            </h3>
            <span className="font-mono text-[10px] text-zinc-400">
              {(customer.sales?.length || 0) + (customer.debtHistory?.length || 0)} records
            </span>
          </div>

          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {customer.sales && customer.sales.length > 0 ? (
              customer.sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200/60 bg-zinc-50/60 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-mono font-bold text-zinc-900">
                      #RCP-{sale.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                      {new Date(sale.createdAt).toLocaleDateString("en-GB")} • {sale.paymentMethod || "CASH"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-zinc-900 tabular-nums">
                      {parseFloat(sale.totalAmount || "0").toLocaleString()} ETB
                    </p>
                    <span className="inline-block rounded-md px-1.5 py-0.2 font-mono text-[9px] font-semibold uppercase text-emerald-800 bg-emerald-50 border border-emerald-200/60">
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))
            ) : customer.debtHistory && customer.debtHistory.length > 0 ? (
              customer.debtHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200/60 bg-zinc-50/60 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{tx.type} ({tx.reference})</p>
                    <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                      {tx.date} • {tx.paymentMethod || "Credit"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold tabular-nums ${tx.amount > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()}`} ETB
                    </p>
                    <span className="font-mono text-[10px] text-zinc-400">
                      Bal: {tx.remainingBalance.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center rounded-md border border-zinc-200/60 bg-zinc-50/60 py-5 text-xs text-zinc-400">
                No recent transactions recorded for this customer.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-zinc-200/80 bg-white py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onRecordPayment(customer.id)}
            className="flex-1 rounded-md bg-slate-900 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
          >
            Record Debt Payment
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
  isCashier = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
  isCashier?: boolean;
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
      <div className="w-full max-w-[440px] max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <Users className="size-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">New Customer</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-zinc-700">Customer Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Almaz Kebede"
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-zinc-700">Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +251 91 123 4567"
                className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-zinc-700">Credit Limit (ETB)</label>
              {isCashier ? (
                <div className="flex h-8.5 w-full items-center justify-between rounded-md border border-zinc-200/80 bg-zinc-50 px-3 text-xs font-mono text-zinc-500 cursor-not-allowed">
                  <span>5,000</span>
                  <span className="font-sans text-[10px] text-zinc-400">Default limit</span>
                </div>
              ) : (
                <input
                  name="creditLimit"
                  type="number"
                  value={form.creditLimit}
                  onChange={handleChange}
                  placeholder="5000"
                  className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:outline-none transition-colors"
                />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700">Address / Location</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Bole, Addis Ababa"
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
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
      <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <Edit2 className="size-3.5" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">Edit Customer</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-zinc-700">Customer Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700">Phone Number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-mono text-zinc-900 focus:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700">Address / Location</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
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
}: {
  customer: Customer | null;
  onClose: () => void;
  onDeleted?: () => void;
  shopId?: string;
}) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
          <Trash2 className="size-4" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 tracking-tight">Customer Ledger Protected</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          Customer <span className="font-semibold text-zinc-900">{customer.name}</span> cannot be deleted because the system enforces transactional and audit integrity across all historical sales and credit receipts.
        </p>

        <div className="mt-5 flex justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Quick Debt Repayment                                        */
/* ------------------------------------------------------------------ */
function ReceivePaymentModal({
  customer,
  shopId,
  onClose,
  onSuccess,
}: {
  customer: Customer | null;
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Mobile Payment">("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!customer) return null;
  const currentDebt = parseFloat(customer.debtBalance || "0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(payAmount);
    if (val <= 0 || !customer) return;

    setIsSubmitting(true);
    try {
      await recordDebtPayment(shopId, {
        customerId: customer.id,
        amount: val,
        paymentMethod: payMethod,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      onSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">Record Debt Repayment</h2>
            <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{customer.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-3 flex items-center justify-between">
            <span className="font-medium text-amber-900">Current Outstanding Balance:</span>
            <span className="font-mono text-base font-bold text-rose-700 tabular-nums">
              {currentDebt.toLocaleString()} ETB
            </span>
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Amount to Pay (ETB) *</label>
            <input
              type="number"
              step="any"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`e.g. ${currentDebt > 0 ? Math.min(500, currentDebt) : 500}`}
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-none transition-colors"
              required
            />
            {currentDebt > 0 && (
              <div className="mt-1.5 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayAmount(String(currentDebt))}
                  className="rounded border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Pay Full ({currentDebt} ETB)
                </button>
                {currentDebt > 100 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(Math.round(currentDebt / 2)))}
                    className="rounded border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    Pay Half ({Math.round(currentDebt / 2)} ETB)
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Payment Channel</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none transition-colors"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">CBE / Bank Transfer</option>
              <option value="Mobile Payment">Telebirr / Mobile Money</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function CustomersPage() {
  const authUser = useAuthStore((state) => state.user);
  const isCashier = authUser?.role === "SALES";
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

  // Sorting State
  const [sortField, setSortField] = useState<"name" | "debt" | "limit" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [page, setPage] = useState(1);

  // Modals State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleOpenCustomer = useCallback(async (cust: Customer) => {
    setSelectedCustomer(cust);
    try {
      const full = await getCustomerDetail(shopId, cust.id);
      if (full) {
        setSelectedCustomer((prev) => (prev?.id === cust.id ? { ...prev, ...full } : prev));
      }
    } catch {
      // Retain existing item
    }
  }, [shopId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers(shopId);
      setCustomers(data ?? []);
    } catch (err) {
      console.warn("Could not load customers:", err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  // Combined Filtering and Sorting
  const filteredCustomers = useMemo(() => {
    const result = customers.filter((cust) => {
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

    if (sortField) {
      result.sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortField === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortField === "debt") {
          valA = parseFloat(String(a.debtBalance || "0"));
          valB = parseFloat(String(b.debtBalance || "0"));
        } else if (sortField === "limit") {
          valA = parseFloat(String(a.creditLimit || "5000"));
          valB = parseFloat(String(b.creditLimit || "5000"));
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customers, activeTab, statusFilter, debouncedSearch, sortField, sortDirection]);

  function handleSort(field: "name" | "debt" | "limit") {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  // Summary Metrics
  const totalCustomersCount = customers.length;
  const debtorsCount = customers.filter((c) => parseFloat(String(c.debtBalance || "0")) > 0).length;
  const totalDebtSum = customers.reduce(
    (acc, c) => acc + Math.max(0, parseFloat(String(c.debtBalance || "0"))),
    0
  );
  const totalCreditLimitSum = customers.reduce(
    (acc, c) => acc + parseFloat(String(c.creditLimit || "5000")),
    0
  );

  // Pagination Slice
  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, page]);

  function handleDownload() {
    exportToCsv("customers-ledger", filteredCustomers, [
      { header: "Customer ID", formatter: (c) => c.customerId || `CUST-${c.id.slice(0, 6).toUpperCase()}` },
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
        isCashier={isCashier}
      />

      <EditCustomerModal
        customer={customerToEdit}
        onClose={() => setCustomerToEdit(null)}
        onUpdated={load}
        shopId={shopId}
      />

      {!isCashier && (
        <DeleteCustomerDialog
          customer={customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onDeleted={load}
          shopId={shopId}
        />
      )}

      <CustomerInfoModal
        customer={selectedCustomer}
        shopId={shopId}
        onClose={() => setSelectedCustomer(null)}
        onRecordPayment={(cid) => {
          const c = customers.find((x) => x.id === cid) || null;
          setSelectedCustomer(null);
          setPaymentCustomer(c);
        }}
      />

      <ReceivePaymentModal
        customer={paymentCustomer}
        shopId={shopId}
        onClose={() => setPaymentCustomer(null)}
        onSuccess={load}
      />

      <div className="space-y-4">
        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Customers
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {totalCustomersCount}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Registered client directory
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Active Debtors
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {debtorsCount}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {totalCustomersCount > 0
                ? `${Math.round((debtorsCount / totalCustomersCount) * 100)}% of customer base`
                : "Clients with balance"}
            </p>
          </div>

          <div className="rounded-xl border border-rose-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Outstanding Debt
              </p>
              <span className="flex items-center gap-1 rounded-md border border-rose-200/60 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-800">
                <CreditCard className="size-3" />
                Ledger
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
              {Math.round(totalDebtSum).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-rose-600">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">Uncollected credit balance</p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Credit Allowed
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {Math.round(totalCreditLimitSum).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">Aggregate trust facility</p>
          </div>
        </div>

        {/* Main Customers Table Container */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Header Toolbar */}
          <div className="border-b border-zinc-200/80 px-3.5 sm:px-5 py-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                  Customers Directory
                </h1>
                <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-zinc-600">
                  {filteredCustomers.length}
                </span>
              </div>

              {/* Action Buttons: Export & Add */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs"
                >
                  <Download className="size-3.5 text-zinc-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
                >
                  <Plus className="size-3.5 text-indigo-400" />
                  <span>Add Customer</span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Segmented Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              {/* Segmented Filter Pills */}
              <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 flex-wrap items-center gap-1 text-xs">
                {[
                  { id: "ALL", label: "All Customers" },
                  { id: "WITH_DEBT", label: "With Outstanding Debt" },
                  { id: "NO_DEBT", label: "Zero Balance" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setPage(1);
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80 font-semibold"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Advanced Filters */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, phone, code..."
                    className="h-8 w-full rounded-md border border-zinc-200/80 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors shadow-2xs ${
                      statusFilter !== "ALL"
                        ? "border-[#5B4FE9] bg-[#5B4FE9]/10 text-zinc-950 font-semibold"
                        : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span>Filters</span>
                    {statusFilter !== "ALL" && (
                      <span className="size-1.5 rounded-full bg-[#5B4FE9]" />
                    )}
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 top-10 z-30 w-56 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xl text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="font-bold text-zinc-900">Filter Customers</span>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("ALL");
                            setShowFilterDropdown(false);
                          }}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900"
                        >
                          <RotateCcw className="size-3" />
                          Reset
                        </button>
                      </div>

                      <div>
                        <label className="mb-1 block font-medium text-zinc-600">Account Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="h-8 w-full rounded-md border border-zinc-200/80 bg-white px-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-800"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="Active">Active</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <tr>
                  <th
                    className="px-5 py-3 cursor-pointer hover:text-zinc-900 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Customer &amp; Code</span>
                      {sortField === "name" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="size-3 text-zinc-900" />
                        ) : (
                          <ArrowDown className="size-3 text-zinc-900" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 font-bold">Contact &amp; Address</th>
                  <th
                    className="px-5 py-3 cursor-pointer hover:text-zinc-900 transition-colors"
                    onClick={() => handleSort("debt")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Outstanding Debt</span>
                      {sortField === "debt" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="size-3 text-zinc-900" />
                        ) : (
                          <ArrowDown className="size-3 text-zinc-900" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer hover:text-zinc-900 transition-colors"
                    onClick={() => handleSort("limit")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Credit Limit</span>
                      {sortField === "limit" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="size-3 text-zinc-900" />
                        ) : (
                          <ArrowDown className="size-3 text-zinc-900" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400 opacity-60" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <LoadingState />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
                        <Users className="size-6" />
                      </div>
                      <p className="mt-3 text-xs font-bold text-zinc-800">
                        No customers match your filters
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Try clearing search terms or adding a new customer account.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
                      >
                        <Plus className="size-3.5" />
                        <span>Add Customer</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => {
                    const debt = parseFloat(customer.debtBalance || "0");
                    const limit = parseFloat(String(customer.creditLimit || "5000"));

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => handleOpenCustomer(customer)}
                        className="cursor-pointer transition-colors hover:bg-zinc-50/80"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 font-mono text-[11px] font-bold text-zinc-700">
                              {customer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors">
                                {customer.name}
                              </p>
                              <p className="font-mono text-[10px] text-zinc-400">
                                {customer.customerId || `CUST-${customer.id.slice(0, 6).toUpperCase()}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs tabular-nums text-zinc-800">
                            {customer.phone || "—"}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5">
                            {customer.address || "Addis Ababa"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`font-mono font-bold tabular-nums text-xs ${
                              debt > 0 ? "text-rose-700" : "text-emerald-700"
                            }`}
                          >
                            {debt.toLocaleString()} ETB
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-700">
                          {limit.toLocaleString()} ETB
                        </td>
                        <td className="px-5 py-3.5">
                          {customer.status === "Overdue" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200/70 bg-red-50/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-red-700">
                              <span className="size-1.5 rounded-full bg-red-600" />
                              Overdue
                            </span>
                          ) : debt > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200/70 bg-amber-50/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-800">
                              <span className="size-1.5 rounded-full bg-amber-600" />
                              With Debt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/70 bg-emerald-50/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-800">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Zero Debt
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenCustomer(customer)}
                              title="View Customer Profile"
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs"
                            >
                              <FileText className="size-3 text-zinc-500" />
                              <span>Profile</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomerToEdit(customer)}
                              title="Edit Customer"
                              className="rounded-md border border-zinc-200/80 bg-white p-1 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            {!isCashier && (
                              <button
                                type="button"
                                onClick={() => setCustomerToDelete(customer)}
                                title="Delete Customer"
                                className="rounded-md border border-zinc-200/80 bg-white p-1 text-zinc-500 hover:bg-red-50 hover:text-red-700 transition-colors shadow-2xs"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
              <div>
                Showing{" "}
                <span className="font-semibold text-zinc-900 font-mono tabular-nums">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-zinc-900 font-mono tabular-nums">
                  {Math.min(page * PAGE_SIZE, filteredCustomers.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-zinc-900 font-mono tabular-nums">
                  {filteredCustomers.length}
                </span>{" "}
                customers
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 shadow-2xs transition-colors"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-xs tabular-nums text-zinc-600">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 shadow-2xs transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
