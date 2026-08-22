"use client";

import { Download, Edit2, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createCustomer, getCustomers, recordDebtPayment } from "@/lib/api/app-data";
import type { Customer } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";


/* ------------------------------------------------------------------ */
/* Modal: Customer Information (Matching Screenshot 3)                */
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[560px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">Customer Information</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
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
            <button type="button" className="text-xs font-medium text-[#2563eb] hover:underline">
              See All
            </button>
          </div>

          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {customer.recentTransactions && customer.recentTransactions.length > 0 ? (
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
                <div>
                  <p className="font-medium text-[#111827]">Purchase</p>
                  <p className="text-[10px] text-[#9ca3af]">07/07/2025</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#111827]">1000 Birr</p>
                  <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-[#ef4444]">
                    Unpaid
                  </span>
                </div>
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
            Record Payment
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-[#e5e7eb] bg-white py-2.5 text-xs font-medium text-[#374151] transition-colors hover:bg-slate-50"
          >
            Send Reminder
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
      setForm({ name: "", phone: "", address: "", creditLimit: "5000" });
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
      <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">Add Customer</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Customer Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Ahmed Hassen"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +2519123456"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Addis Ababa, Bole"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Credit Limit (ETB)</label>
            <input
              name="creditLimit"
              type="number"
              value={form.creditLimit}
              onChange={handleChange}
              placeholder="e.g. 5000"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#111827] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1f2937] disabled:opacity-50"
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
/* Main Customers Page Component                                       */
/* ------------------------------------------------------------------ */
export default function CustomersPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All Customers" | "With debt" | "No debt">("All Customers");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Mobile Payment">("Cash");


  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers(shopId);
      setCustomers(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  // Tab Filtering & Search Filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const debt = parseFloat(c.debtBalance || "0");
      if (activeTab === "With debt" && debt <= 0) return false;
      if (activeTab === "No debt" && debt > 0) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesAddress = c.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesAddress) return false;
      }

      return true;
    });
  }, [customers, activeTab, search]);

  function handleRecordPayment(customerId: string) {
    const target = customers.find((c) => c.id === customerId);
    if (target) {
      setPaymentCustomer(target);
      setPayAmount(target.debtBalance && parseFloat(target.debtBalance) > 0 ? target.debtBalance : "");
    }
    setSelectedCustomer(null);
  }


  return (
    <>
      <CustomerInfoModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onRecordPayment={handleRecordPayment}
      />

      <AddCustomerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        {/* Header */}
        <h1 className="mb-4 text-base font-semibold text-[#111827]">Customers</h1>

        {/* Tabs: All Customers | With debt | No debt */}
        <div className="mb-6 flex gap-12 border-b border-[#f3f4f6] text-xs">
          {(["All Customers", "With debt", "No debt"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 font-medium transition-colors relative ${
                  isActive ? "text-[#111827]" : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-9 w-48 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            {/* Filters Button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
              Filters
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Download Button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              Download
            </button>

            {/* Add Customer Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              Add Customer
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-left text-[#6b7280]">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Total Debt</th>
                <th className="px-4 py-3 font-medium">Credit Limit</th>
                <th className="px-4 py-3 font-medium">Days Overdue</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <LoadingState />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#9ca3af]">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const debt = parseFloat(customer.debtBalance || "0");
                  const limit = parseFloat(String(customer.creditLimit || "5000"));
                  const usedPct = limit > 0 ? Math.round((debt / limit) * 100) : 0;
                  const isDebtZero = debt === 0;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="cursor-pointer transition-colors hover:bg-[#f9fafb]"
                    >
                      {/* Customer Name */}
                      <td className="px-6 py-3.5 font-medium text-[#111827]">{customer.name}</td>

                      {/* Contact: Phone & Address */}
                      <td className="px-4 py-3.5">
                        <p className="text-[#374151]">{customer.phone || "+2519123456"}</p>
                        <p className="text-[11px] text-[#9ca3af]">{customer.address || "Addis Ababa, Piassa"}</p>
                      </td>

                      {/* Total Debt */}
                      <td className="px-4 py-3.5">
                        <span className={`font-semibold ${isDebtZero ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                          {debt.toLocaleString()} Birr
                        </span>
                      </td>

                      {/* Credit Limit & % Used */}
                      <td className="px-4 py-3.5">
                        <p className="text-[#374151]">{limit.toLocaleString()} ETB</p>
                        <p className="text-[11px] text-[#9ca3af]">{usedPct}% Used</p>
                      </td>

                      {/* Days Overdue */}
                      <td className="px-4 py-3.5">
                        {customer.daysOverdue && customer.daysOverdue !== "-" ? (
                          <span className="inline-block rounded bg-[#ef4444] px-2 py-0.5 text-[10px] font-medium text-white">
                            {customer.daysOverdue}
                          </span>
                        ) : (
                          <span className="text-[#9ca3af]">-</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-[#374151]">{customer.date || "14/07/2025"}</td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white ${
                            customer.status === "Overdue" ? "bg-[#ef4444]" : "bg-[#16a34a]"
                          }`}
                        >
                          {customer.status || "Active"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-3.5">
                        <div
                          className="flex items-center justify-center gap-3 text-[#6b7280]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="Edit"
                            className="transition-colors hover:text-[#111827]"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="transition-colors hover:text-[#ef4444]"
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
                  onChange={(e) => setPayMethod(e.target.value as "Cash" | "Card" | "Bank Transfer" | "Mobile Payment")}
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

