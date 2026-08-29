"use client";

import { Download, Edit2, Plus, SlidersHorizontal, Trash2, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { createExpense, getExpenses, getExpensesSummary } from "@/lib/api/app-data";

import type { Expense, ExpensesSummary } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: New Expense Dialog (Matching Screenshot 2)                   */
/* ------------------------------------------------------------------ */
function AddExpenseModal({
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
    date: "",
    amount: "",
    description: "",
    category: "",
    paymentMethod: "",
    status: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount.trim()) return;

    setIsSubmitting(true);
    try {
      await createExpense(shopId, {
        date:
          form.date.trim() ||
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        amount: form.amount.trim(),
        description: form.description.trim() || "General Expense",
        category: form.category || "Utilities",
        paymentMethod: form.paymentMethod || "Bank Transfer",
        status: form.status || "Paid",
      });
      onCreated();
      onClose();
      setForm({
        date: "",
        amount: "",
        description: "",
        category: "",
        paymentMethod: "",
        status: "",
      });
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
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">New Expense</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Date */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Date</label>
            <input
              name="date"
              value={form.date}
              onChange={handleChange}
              placeholder="Enter Date"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Amount */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Amount</label>
            <input
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="Enter Amount"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-[120px_1fr] items-start gap-3">
            <label className="pt-2 font-medium text-[#374151]">Discription</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Enter description..."
              className="w-full rounded-lg border border-[#e5e7eb] p-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Catagory</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="">Enter Catagory</option>
              <option value="Utilities">Utilities</option>
              <option value="Staff">Staff</option>
              <option value="Equipment">Equipment</option>
              <option value="Marketing">Marketing</option>
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Payment method</label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="">Enter Payment method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Digital Pyment">Digital Pyment</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Status */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="">Enter Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Form Actions */}
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
              {isSubmitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Expenses Page Component (Matching Screenshot 1)                */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, list] = await Promise.all([getExpensesSummary(shopId), getExpenses(shopId)]);
      setSummary(sum);
      setExpenses(list ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const currentExpenses = useMemo(
    () => expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [expenses, page],
  );

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-[#16a34a]";
      case "pending":
        return "bg-[#f59e0b]";
      case "overdue":
        return "bg-[#ef4444]";
      default:
        return "bg-[#6b7280]";
    }
  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN"]}>
      <AddExpenseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <div className="space-y-4">

        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP CARD: Expenses Metrics Overview                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-[#111827]">Expenses</h2>

          {summary && (
            <div className="grid grid-cols-1 divide-y divide-[#f3f4f6] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {/* Metric 1: Total Expenses */}
              <div className="flex items-center justify-between px-6 py-2 first:pl-0">
                <div>
                  <p className="text-xs font-semibold text-[#111827]">Total Expenses</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#ef4444]">
                    <TrendingUp className="size-3" />
                    <span>{summary.totalExpenses.changeText}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2563eb]">
                    {summary.totalExpenses.amount.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-[#2563eb]">Birr</p>
                </div>
              </div>

              {/* Metric 2: This Week */}
              <div className="flex items-center justify-between px-6 py-2">
                <div>
                  <p className="text-xs font-semibold text-[#111827]">This Week</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2563eb]">
                    {summary.thisWeek.amount.toFixed(2)}
                  </p>
                  <p className="text-[11px] font-medium text-[#2563eb]">Birr</p>
                </div>
              </div>

              {/* Metric 3: Pending Payment */}
              <div className="flex items-center justify-between px-6 py-2 last:pr-0">
                <div>
                  <p className="text-xs font-semibold text-[#111827]">Pending Payment</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2563eb]">
                    {summary.pendingPayment.amount.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-[#2563eb]">Birr</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. BOTTOM CARD: Expenses Catalog & Table                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {/* Header Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 px-6 py-4">
            {/* Download button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              Download
            </button>

            {/* Filters button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
              Filters
            </button>

            {/* Add Expense button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              Add Expense
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Discription</th>
                  <th className="px-4 py-3 font-medium">Catagory</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#9ca3af]">
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  currentExpenses.map((exp) => (
                    <tr key={exp.id} className="transition-colors hover:bg-[#f9fafb]">
                      {/* Date */}
                      <td className="px-6 py-3.5 text-[#374151]">{exp.date}</td>

                      {/* Description */}
                      <td className="px-4 py-3.5 font-medium text-[#111827]">{exp.description}</td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-[#374151]">{exp.category}</td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 text-[#374151]">
                        {typeof exp.amount === "number" ? exp.amount.toLocaleString() : exp.amount}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3.5 text-[#374151]">{exp.paymentMethod}</td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-medium text-white ${getStatusColor(
                            exp.status,
                          )}`}
                        >
                          {exp.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-3 text-[#6b7280]">
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
                  ))
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
      </div>
    </RouteGuard>
  );
}

