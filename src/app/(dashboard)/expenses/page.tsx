"use client";

import {
  ArrowDownUp,
  ChevronDown,
  Download,
  Edit2,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDismiss } from "@/hooks/use-dismiss";

import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { ListSkeleton } from "@/components/shared/skeletons";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { LoadError } from "@/components/shared/load-error";
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
function paymentLabel(t: ReturnType<typeof useT>, method?: string) {
  switch ((method || "Cash").toLowerCase()) {
    case "cash":
      return t("expenses.cashTill");
    case "bank":
    case "bank transfer":
      return t("expenses.bank");
    case "telebirr":
      return t("expenses.telebirr");
    default:
      return method as string;
  }
}

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
  const t = useT();
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
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("expenses.addTitle")}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{t("expenses.addSubtitle")}</p>
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
              {t("expenses.description")} <span className="text-rose-500">*</span>
            </label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              placeholder={t("expenses.descriptionPlaceholder")}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("shared.category")}
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder={t("expenses.categoryPlaceholder")}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("expenses.amountEtb")} <span className="text-rose-500">*</span>
              </label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                required
                min="0"
                step="any"
                placeholder={t("expenses.amountPlaceholder")}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("expenses.paidFrom")}
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Cash">{t("expenses.cashTill")}</option>
                <option value="Bank">{t("expenses.bankOption")}</option>
                <option value="Telebirr">{t("expenses.telebirr")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("shared.status")}
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Paid">{t("expenses.statusPaid")}</option>
                <option value="Pending">{t("expenses.statusPending")}</option>
                <option value="Overdue">{t("expenses.statusOverdue")}</option>
              </select>
              <p className="text-[10px] text-zinc-500">{t("expenses.statusHint")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("expenses.expenseDate")}
              </label>
              <span className="font-mono text-[10px] text-zinc-400">{t("expenses.defaultsToday")}</span>
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
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("shared.saving") : t("expenses.addExpense")}
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
  const t = useT();
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
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("expenses.editTitle")}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{t("expenses.editSubtitle")}</p>
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
              {t("expenses.description")} <span className="text-rose-500">*</span>
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
                {t("shared.category")}
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("expenses.amountEtb")} <span className="text-rose-500">*</span>
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
                {t("expenses.paidFrom")}
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Cash">{t("expenses.cashTill")}</option>
                <option value="Bank">{t("expenses.bankOption")}</option>
                <option value="Telebirr">{t("expenses.telebirr")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                {t("shared.status")}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="Paid">{t("expenses.statusPaid")}</option>
                <option value="Pending">{t("expenses.statusPending")}</option>
                <option value="Overdue">{t("expenses.statusOverdue")}</option>
              </select>
              <p className="text-[10px] text-zinc-500">{t("expenses.statusHint")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              {t("shared.date")}
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
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("shared.saving") : t("expenses.saveChanges")}
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
  const t = useT();
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
        <h3 className="text-base font-bold tracking-tight text-zinc-900">{t("expenses.deleteTitle")}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          {t("expenses.deleteConfirm", {
            description: expense.description,
            amount: Number(expense.amount).toLocaleString(),
          })}
        </p>

        <div className="mt-5 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            {t("shared.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-md bg-rose-600 px-3.5 py-2 font-semibold text-white shadow-2xs hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? t("expenses.deleting") : t("expenses.deletePermanently")}
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
  const t = useT();
  switch (status) {
    case "Paid":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          <span className="size-1 rounded-full bg-emerald-600" />
          {t("expenses.statusPaid")}
        </span>
      );
    case "Pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-700">
          <span className="size-1 rounded-full bg-amber-500" />
          {t("expenses.statusPending")}
        </span>
      );
    case "Overdue":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-700">
          <span className="size-1 rounded-full bg-rose-600" />
          {t("expenses.statusOverdue")}
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
  const t = useT();
  const { formatDate } = useFormat();

  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useDismiss<HTMLDivElement>(showFilterDropdown, () => setShowFilterDropdown(false));

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
      setLoadError(false);
    } catch (err) {
      console.warn("Could not load expenses:", err);
      setLoadError(true);
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

  const pagination = usePagination(filteredExpenses, PAGE_SIZE);
  const { setPage } = pagination;
  const currentExpenses = pagination.pageItems;

  const availableCategories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.category).filter(Boolean));
    return Array.from(cats);
  }, [expenses]);

  function handleDownload() {
    exportToCsv("shop-expenses", filteredExpenses, [
      { header: t("shared.date"), key: "date" },
      { header: t("expenses.description"), key: "description" },
      { header: t("shared.category"), key: "category" },
      { header: t("expenses.csvAmount"), key: "amount" },
      { header: t("expenses.paymentMethod"), key: "paymentMethod" },
      { header: t("shared.status"), key: "status" },
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

  if (loadError && expenses.length === 0) {
    return <LoadError what={t("expenses.whatExpenses")} onRetry={loadData} />;
  }

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
              {t("expenses.title")}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {t("expenses.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <Download className="size-3.5 text-zinc-400" />
              <span>{t("expenses.exportCsv")}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95"
            >
              <Plus className="size-3.5 text-indigo-400" />
              <span>{t("expenses.record")}</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP CARDS: Expenses KPI Summary Grid                            */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5 lg:grid-cols-4">
          {/* Group 1: Total Expenses */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {t("expenses.totalExpenses")}
              </span>
              <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
                {t.n("expenses.bills", summary?.totalExpenses?.count ?? 0)}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {(summary?.totalExpenses?.cost ?? summary?.totalExpenses?.amount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-zinc-400">{t("shared.etb")}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalExpenses?.subtext ?? t("expenses.totalHint")}
              </p>
            </div>
          </div>

          {/* Group 2: Total Paid */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {t("expenses.paidTitle")}
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700">
                {t.n("expenses.paidCount", summary?.totalPaid?.count ?? 0)}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {(summary?.totalPaid?.cost ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-emerald-600/70">{t("shared.etb")}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalPaid?.subtext ?? t("expenses.paidHint")}
              </p>
            </div>
          </div>

          {/* Group 3: Total Pending */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {t("expenses.pendingTitle")}
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-700">
                {t.n("expenses.pendingCount", summary?.totalPending?.count ?? 0)}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
                {(summary?.totalPending?.cost ?? summary?.pendingPayment?.amount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-amber-500/70">{t("shared.etb")}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalPending?.subtext ?? t("expenses.pendingHint")}
              </p>
            </div>
          </div>

          {/* Group 4: Total Overdue */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700">
                {t("expenses.overdueTitle")}
              </span>
              <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-rose-700">
                {t.n("expenses.overdueCount", summary?.totalOverdue?.count ?? 0)}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-mono text-2xl font-bold tracking-tight text-rose-600 tabular-nums">
                {(summary?.totalOverdue?.cost ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-medium text-rose-500/70">{t("shared.etb")}</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">
                {summary?.totalOverdue?.subtext ?? t("expenses.overdueHint")}
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
                  placeholder={t("expenses.searchPlaceholder")}
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
              <div className="relative" ref={filterRef}>
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
                  <span>{t("shared.filters")}</span>
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
                        {t("expenses.filterCriteria")}
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
                        {t("shared.reset")}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        {t("shared.status")}
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(1);
                        }}
                        className="h-8 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      >
                        <option value="ALL">{t("expenses.allStatuses")}</option>
                        <option value="Paid">{t("expenses.statusPaid")}</option>
                        <option value="Pending">{t("expenses.statusPending")}</option>
                        <option value="Overdue">{t("expenses.statusOverdue")}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        {t("shared.category")}
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => {
                          setCategoryFilter(e.target.value);
                          setPage(1);
                        }}
                        className="h-8 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                      >
                        <option value="ALL">{t("expenses.allCategories")}</option>
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
                      {t("expenses.applyFilter")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-500">
                {t.n("expenses.showing", filteredExpenses.length)}
              </span>
            </div>
          </div>

          {/* Phone: one card per expense */}
          <div className="sm:hidden">
            {isLoading ? (
              <ListSkeleton rows={6} />
            ) : currentExpenses.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-xs font-medium text-zinc-700">{t("expenses.emptyTitle")}</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">{t("expenses.emptyHint")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {currentExpenses.map((exp) => (
                  <li key={exp.id} className="space-y-2.5 px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-zinc-900">{exp.description}</p>
                        <p className="truncate font-mono text-[11px] text-zinc-400">
                          {formatDate(exp.date)} · {exp.category || t("expenses.general")}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-zinc-900">
                        {Number(exp.amount).toLocaleString()} <span className="text-[10px] font-normal text-zinc-400">{t("shared.etb")}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 font-mono text-[10px] text-zinc-700">
                          {paymentLabel(t, exp.paymentMethod)}
                        </span>
                        <ExpenseStatusBadge status={exp.status} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={t("expenses.editTooltip")}
                          onClick={() => setExpenseToEdit(exp)}
                          className="flex size-9 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={t("expenses.deleteTooltip")}
                          onClick={() => setExpenseToDelete(exp)}
                          className="flex size-9 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                  <th
                    className="cursor-pointer px-5 py-3 transition-colors hover:text-zinc-900"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t("shared.date")}</span>
                      <ArrowDownUp className="size-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3">{t("expenses.description")}</th>
                  <th className="px-4 py-3">{t("shared.category")}</th>
                  <th
                    className="cursor-pointer px-4 py-3 transition-colors hover:text-zinc-900"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t("expenses.amount")}</span>
                      <ArrowDownUp className="size-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3">{t("expenses.paymentMethod")}</th>
                  <th className="px-4 py-3">{t("shared.status")}</th>
                  <th className="px-5 py-3 text-right">{t("shared.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-0">
<ListSkeleton rows={6} />
</td>
                  </tr>
                ) : currentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
                        <Wallet className="size-5" />
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-zinc-700">{t("expenses.emptyTitle")}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {t("expenses.emptyHint")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentExpenses.map((exp) => (
                    <tr key={exp.id} className="transition-colors hover:bg-zinc-50/70">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-600 tabular-nums">
                        {formatDate(exp.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-zinc-900">{exp.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
                          {exp.category || t("expenses.general")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-zinc-900 tabular-nums">
                          {Number(exp.amount).toLocaleString()}
                        </span>
                        <span className="ml-1 font-mono text-[10px] text-zinc-400">{t("shared.etb")}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        <span className="rounded-md border border-zinc-200/60 bg-white px-2 py-0.5 font-mono text-[10px] text-zinc-700">
                          {paymentLabel(t, exp.paymentMethod)}
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
                            title={t("expenses.editTooltip")}
                            className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            title={t("expenses.deleteTooltip")}
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

          <TablePagination pagination={pagination} noun={t("expenses.noun")} />
        </div>
      </div>
    </RouteGuard>
  );
}
