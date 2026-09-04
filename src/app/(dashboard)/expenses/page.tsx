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
import { RouteGuard } from "@/components/shared/route-guard";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getExpensesSummary,
  updateExpense,
} from "@/lib/api/app-data";
import type { Expense, ExpensesSummary } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Add Expense                                                 */
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
    description: "",
    category: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    status: "Paid",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;

    setIsSubmitting(true);
    try {
      await createExpense(shopId, {
        date: form.date.trim() || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        amount: Number(form.amount) || 0,
        paymentMethod: form.paymentMethod,
        status: form.status,
      });
      onCreated();
      onClose();
      setForm({
        date: "",
        description: "",
        category: "",
        amount: "",
        paymentMethod: "Bank Transfer",
        status: "Paid",
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
      <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">New Expense</h2>
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
            <label className="font-medium text-[#374151]">Description *</label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              placeholder="e.g. Office Electricity Bill"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Utility, Rent, Supplies"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Amount (ETB) *</label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                required
                placeholder="e.g. 1500"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Payment Method</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Telebirr">Telebirr</option>
              </select>

            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Date</label>
            <input
              name="date"
              type="text"
              value={form.date}
              onChange={handleChange}
              placeholder="e.g. Aug 15, 2025"
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
              {isSubmitting ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Expense                                                */
/* ------------------------------------------------------------------ */
function EditExpenseModal({
  expense,
  onClose,
  onUpdated,
  shopId,
}: {
  expense: Expense | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
}) {
  const [form, setForm] = useState({
    date: "",
    description: "",
    category: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    status: "Paid",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        date: expense.date || "",
        description: expense.description || "",
        category: expense.category || "",
        amount: String(expense.amount || "").replace(/,/g, ""),
        paymentMethod: expense.paymentMethod || "Bank Transfer",
        status: expense.status || "Paid",
      });
    }
  }, [expense]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expense || !form.description.trim() || !form.amount) return;

    setIsSubmitting(true);
    try {
      await updateExpense(shopId, expense.id, {
        date: form.date.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        amount: Number(form.amount) || 0,
        paymentMethod: form.paymentMethod,
        status: form.status,
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

  if (!expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">

      <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">Edit Expense</h2>
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
            <label className="font-medium text-[#374151]">Description *</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Amount (ETB) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Telebirr">Telebirr</option>
              </select>

            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#374151]">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-[#374151]">Date</label>
            <input
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
/* Modal: Delete Expense Confirmation                                 */
/* ------------------------------------------------------------------ */
function DeleteExpenseDialog({
  expense,
  onClose,
  onDeleted,
  shopId,
}: {
  expense: Expense | null;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) return null;

  async function handleConfirm() {
    if (!expense) return;
    setIsDeleting(true);
    try {
      await deleteExpense(shopId, expense.id);
      onDeleted();
      onClose();
    } catch {
      onDeleted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">Delete Expense</h3>
        <p className="mt-1 text-xs text-[#6b7280]">
          Are you sure you want to delete expense <span className="font-semibold text-[#111827]">{expense.description}</span> ({expense.amount} ETB)?
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
/* Helpers: Status color                                              */
/* ------------------------------------------------------------------ */
function getStatusColor(status: string) {
  switch (status) {
    case "Paid":
      return "bg-[#16a34a]";
    case "Pending":
      return "bg-[#f59e0b]";
    case "Overdue":
      return "bg-[#ef4444]";
    default:
      return "bg-[#6b7280]";
  }
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 9;

export default function ExpensesPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, exps] = await Promise.all([
        getExpensesSummary(shopId),
        getExpenses(shopId),
      ]);
      setSummary(sum);
      setExpenses(exps);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering & pagination
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const currentExpenses = useMemo(
    () => filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredExpenses, page],
  );

  const availableCategories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.category).filter(Boolean));
    return Array.from(cats);
  }, [expenses]);

  function handleDownload() {
    exportToCsv("shop-expenses", filteredExpenses, [
      { header: "Date", key: "date" },
      { header: "Description", key: "description" },
      { header: "Category", key: "category" },
      { header: "Amount (ETB)", key: "amount" },
      { header: "Payment Method", key: "paymentMethod" },
      { header: "Status", key: "status" },
    ]);
  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN"]}>

      <div className="space-y-4">
        <AddExpenseModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={loadData}
          shopId={shopId}
        />

        <EditExpenseModal
          expense={expenseToEdit}
          onClose={() => setExpenseToEdit(null)}
          onUpdated={loadData}
          shopId={shopId}
        />

        <DeleteExpenseDialog
          expense={expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onDeleted={loadData}
          shopId={shopId}
        />

        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP CARD: Expenses Summary                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-[#111827]">Expenses</h2>

          {summary && (
            <div className="grid grid-cols-1 divide-y divide-[#f3f4f6] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {/* Group 1: Total Expenses */}
              <div className="px-3 py-2 first:pl-0">
                <p className="text-xs font-semibold text-[#2563eb]">Total Expenses</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalExpenses?.count ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalExpenses?.subtext ?? "Total operational"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {(summary.totalExpenses?.cost ?? summary.totalExpenses?.amount ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalExpenses?.costLabel ?? "Cost (ETB)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 2: Total Paid */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-[#16a34a]">Total Paid</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">{summary.totalPaid?.count ?? 0}</p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">{summary.totalPaid?.subtext ?? "Settled"}</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {(summary.totalPaid?.cost ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">{summary.totalPaid?.costLabel ?? "Cost (ETB)"}</p>
                  </div>
                </div>
              </div>

              {/* Group 3: Total Pending */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-[#f59e0b]">Total Pending</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalPending?.count ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalPending?.subtext ?? "Pending invoice"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {(summary.totalPending?.cost ?? summary.pendingPayment?.amount ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalPending?.costLabel ?? "Cost (ETB)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 4: Total Overdue */}
              <div className="px-4 py-2 last:pr-0">
                <p className="text-xs font-semibold text-[#ef4444]">Total Overdue</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalOverdue?.count ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalOverdue?.subtext ?? "Overdue bills"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {(summary.totalOverdue?.cost ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalOverdue?.costLabel ?? "Cost (ETB)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* ------------------------------------------------------------------ */}
        {/* 2. BOTTOM CARD: Expenses Table                                     */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
            <h1 className="text-lg font-semibold text-[#111827]">Expenses List ({filteredExpenses.length})</h1>

            <div className="flex items-center gap-2.5">
              {/* Download button */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
              >
                <Download className="size-3.5 text-[#6b7280]" />
                Download
              </button>

              {/* Filters button & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-xs font-medium transition-colors ${
                    statusFilter !== "ALL" || categoryFilter !== "ALL"
                      ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                      : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                  }`}
                >
                  <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
                  Filters
                  {(statusFilter !== "ALL" || categoryFilter !== "ALL") && (
                    <span className="size-2 rounded-full bg-blue-600" />
                  )}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-11 z-30 w-60 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-2">
                      <span className="font-bold text-[#111827]">Filter Expenses</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setCategoryFilter("ALL");
                          setShowFilterDropdown(false);
                        }}
                        className="flex items-center gap-1 text-[11px] text-[#6b7280] hover:text-[#111827]"
                      >
                        <RotateCcw className="size-3" />
                        Reset
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-[#374151]">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-8 w-full rounded-lg border border-[#e5e7eb] px-2 text-[#111827]"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-[#374151]">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-8 w-full rounded-lg border border-[#e5e7eb] px-2 text-[#111827]"
                      >
                        <option value="ALL">All Categories</option>
                        {availableCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
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

              {/* Add Expense button */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
              >
                <Plus className="size-3.5" />
                Add Expense
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Amount (ETB)</th>
                  <th className="px-4 py-3 font-medium">Payment Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
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
                      No expenses found matching filters.
                    </td>
                  </tr>
                ) : (
                  currentExpenses.map((exp) => (
                    <tr key={exp.id} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="px-6 py-3.5 text-[#374151]">{exp.date}</td>
                      <td className="px-4 py-3.5 font-medium text-[#111827]">{exp.description}</td>
                      <td className="px-4 py-3.5 text-[#374151]">{exp.category}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#111827]">
                        {typeof exp.amount === "number" ? exp.amount.toLocaleString() : exp.amount}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">{exp.paymentMethod}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-medium text-white ${getStatusColor(
                            exp.status,
                          )}`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 text-[#6b7280]">
                          <button
                            type="button"
                            onClick={() => setExpenseToEdit(exp)}
                            title="Edit Expense"
                            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            title="Delete Expense"
                            className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600 transition-colors"
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
