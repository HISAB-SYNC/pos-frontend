"use client";

import {
  ArrowDownUp,
  ChevronDown,
  Download,
  Edit2,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
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
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    date: getTodayDateString(),
    description: "",
    category: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    status: "Paid",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync date to today whenever modal opens
  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        date: f.date || getTodayDateString(),
      }));
    }
  }, [open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;

    setIsSubmitting(true);
    try {
      await createExpense(shopId, {
        date: form.date.trim() || getTodayDateString(),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        amount: Number(form.amount) || 0,
        paymentMethod: form.paymentMethod,
        status: form.status,
      });
      onCreated();
      onClose();
      setForm({
        date: getTodayDateString(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[480px] rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Record New Expense</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Log operational expenditure, utilities, or supplier payouts</p>
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
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              placeholder="e.g. Office Electricity Bill or Packaging Materials"
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Category
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Utility, Rent, Supplies"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Amount (ETB) <span className="text-rose-500">*</span>
              </label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="any"
                placeholder="e.g. 1500"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Telebirr">Telebirr</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Expense Date
              </label>
              <span className="font-mono text-[10px] text-zinc-400">Defaults to today</span>
            </div>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add Expense"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[480px] rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Edit Expense</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Update expense particulars, amount, or settlement status</p>
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
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Amount (ETB) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                min="0"
                step="any"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Payment Method
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Telebirr">Telebirr</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3.5 flex size-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
          <Trash2 className="size-4.5" />
        </div>
        <h3 className="text-base font-bold tracking-tight text-zinc-900">Delete Expense</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Are you sure you want to delete expense <span className="font-semibold text-zinc-900">{expense.description}</span> (<span className="font-mono font-medium text-zinc-800">{Number(expense.amount).toLocaleString()} ETB</span>)? This action cannot be undone.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-md bg-rose-600 px-3.5 py-2 font-semibold text-white shadow-2xs hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status Badge Component                                             */
/* ------------------------------------------------------------------ */
function ExpenseStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Paid":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          <span className="size-1 rounded-full bg-emerald-600" />
          Paid
        </span>
      );
    case "Pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          <span className="size-1 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case "Overdue":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-700">
          <span className="size-1 rounded-full bg-rose-600" />
          Overdue
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          {status}
        </span>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

type SortKey = "date" | "amount";
type SortOrder = "asc" | "desc";

export default function ExpensesPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  // Client-side filtering & sorting
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return expenses
      .filter((e) => {
        if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
        if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
        if (q) {
          const matchDesc = e.description?.toLowerCase().includes(q);
          const matchCat = e.category?.toLowerCase().includes(q);
          const matchPay = e.paymentMethod?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchPay) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "amount") {
          const numA = Number(a.amount) || 0;
          const numB = Number(b.amount) || 0;
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }
        // date sort
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [expenses, statusFilter, categoryFilter, searchQuery, sortKey, sortOrder]);

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  }

  const activeFiltersCount = (statusFilter !== "ALL" ? 1 : 0) + (categoryFilter !== "ALL" ? 1 : 0);

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN"]}>
      <div className="space-y-5">
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
        {/* Header Section                                                     */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Expenses & Disbursements
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Track operational overhead, utility bills, rent, and vendor payouts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <Download className="size-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95"
            >
              <Plus className="size-3.5 text-indigo-400" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP CARDS: Expenses KPI Summary Grid                            */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Group 1: Total Expenses */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Total Expenses
              </span>
              <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
                {summary?.totalExpenses?.count ?? 0} bills
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {(summary?.totalExpenses?.cost ?? summary?.totalExpenses?.amount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-zinc-400">ETB</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalExpenses?.subtext ?? "Total operational expenditures"}
              </p>
            </div>
          </div>

          {/* Group 2: Total Paid */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Settled / Paid
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700">
                {summary?.totalPaid?.count ?? 0} settled
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {(summary?.totalPaid?.cost ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-emerald-600/70">ETB</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalPaid?.subtext ?? "Paid and cleared invoices"}
              </p>
            </div>
          </div>

          {/* Group 3: Total Pending */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Pending Approval
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-700">
                {summary?.totalPending?.count ?? 0} pending
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
                {(summary?.totalPending?.cost ?? summary?.pendingPayment?.amount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-amber-500/70">ETB</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalPending?.subtext ?? "Awaiting authorization or settlement"}
              </p>
            </div>
          </div>

          {/* Group 4: Total Overdue */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Overdue Obligations
              </span>
              <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-rose-700">
                {summary?.totalOverdue?.count ?? 0} overdue
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-rose-600 tabular-nums">
                {(summary?.totalOverdue?.cost ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-rose-500/70">ETB</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalOverdue?.subtext ?? "Requires immediate settlement"}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. TABLE CARD: Toolbar + Data Table + Pagination                   */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by description, category, or payment..."
                  className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Filters dropdown button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`inline-flex h-8.5 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors shadow-2xs ${
                    activeFiltersCount > 0
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <SlidersHorizontal className="size-3.5 text-zinc-400" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-white font-mono text-[9px] font-bold text-zinc-900">
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown className="size-3 text-zinc-400" />
                </button>

                {showFilterDropdown && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-10 z-30 w-64 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xl text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                        Filter Criteria
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("ALL");
                          setCategoryFilter("ALL");
                          setShowFilterDropdown(false);
                          setPage(1);
                        }}
                        className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-900"
                      >
                        <RotateCcw className="size-3" />
                        Reset
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(1);
                        }}
                        className="h-8 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => {
                          setCategoryFilter(e.target.value);
                          setPage(1);
                        }}
                        className="h-8 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
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
                      className="w-full rounded-md bg-zinc-900 py-1.5 font-mono text-[11px] font-semibold text-white shadow-2xs hover:bg-zinc-800"
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-500">
                Showing <span className="font-bold text-zinc-900">{filteredExpenses.length}</span>{" "}
                {filteredExpenses.length === 1 ? "expense" : "expenses"}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                  <th
                    className="cursor-pointer px-5 py-3 transition-colors hover:text-zinc-900"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <ArrowDownUp className="size-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th
                    className="cursor-pointer px-4 py-3 transition-colors hover:text-zinc-900"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Amount</span>
                      <ArrowDownUp className="size-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
                        <Wallet className="size-5" />
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-zinc-700">No expenses found</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        Try clearing filter criteria or record a new expense
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentExpenses.map((exp) => (
                    <tr key={exp.id} className="transition-colors hover:bg-zinc-50/70">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-600 tabular-nums">
                        {exp.date}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-zinc-900">{exp.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
                          {exp.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-zinc-900 tabular-nums">
                          {Number(exp.amount).toLocaleString()}
                        </span>
                        <span className="ml-1 font-mono text-[10px] text-zinc-400">ETB</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        <span className="rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 font-mono text-[10px] text-zinc-700">
                          {exp.paymentMethod || "Cash"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ExpenseStatusBadge status={exp.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-zinc-500">
                          <button
                            type="button"
                            onClick={() => setExpenseToEdit(exp)}
                            title="Edit Expense"
                            className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            title="Delete Expense"
                            className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
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
          <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/30 px-5 py-3 text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-zinc-200/80 bg-white px-3 py-1.5 font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="font-mono text-xs text-zinc-500">
              Page <span className="font-semibold text-zinc-900">{page}</span> of{" "}
              <span className="font-semibold text-zinc-900">{totalPages}</span>
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-zinc-200/80 bg-white px-3 py-1.5 font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
