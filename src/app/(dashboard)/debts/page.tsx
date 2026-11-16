"use client";

import {
  AlertCircle,
  ArrowUpDown,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Download,
  HandCoins,
  Landmark,
  Package,
  Plus,
  Receipt,
  Search,
  Smartphone,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { TablePageSkeleton } from "@/components/shared/skeletons";
import { LoadError } from "@/components/shared/load-error";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { createDebt, getCustomers, getDebts, getDebtSummary, recordDebtPayment, recordBatchDebtPayments } from "@/lib/api/app-data";
import type { Customer, Debt, DebtSummary } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Ethiopian Bank & Mobile Payment Options                            */
/* ------------------------------------------------------------------ */
const POPULAR_BANKS = [
  "Commercial Bank of Ethiopia (CBE)",
  "Awash Bank",
  "Bank of Abyssinia (BOA)",
  "Dashen Bank",
  "Cooperative Bank of Oromia",
  "Telebirr",
  "Other Bank / Custom",
];

type TFn = ReturnType<typeof useT>;

/** Display label for a stored payment method / bank name (the stored value stays as is). */
function methodLabel(t: TFn, value?: string | null) {
  const v = (value || "Cash").trim();
  switch (v.toLowerCase()) {
    case "cash":
      return t("debts.method.cash");
    case "card":
      return t("debts.method.card");
    case "bank transfer":
      return t("debts.method.bankTransfer");
    case "mobile payment":
      return t("debts.method.mobilePayment");
    case "other bank / custom":
      return t("debts.method.otherBank");
    default:
      return v;
  }
}

/** Display label for a debt status value sent by the API. */
function statusLabel(t: TFn, status?: string | null) {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return t("debts.statusPaid");
    case "PARTIAL":
      return t("debts.statusPartial");
    case "OVERDUE":
      return t("debts.statusOverdue");
    case "PENDING":
      return t("debts.statusPending");
    default:
      return status || "";
  }
}

/* ------------------------------------------------------------------ */
/* Modal: Debt Specific Payment & History Details                     */
/* ------------------------------------------------------------------ */
function DebtDetailModal({
  debt,
  onClose,
  onOpenPayment,
}: {
  debt: Debt | null;
  onClose: () => void;
  onOpenPayment: (debt: Debt) => void;
}) {
  const t = useT();
  const { formatDate } = useFormat();
  const etb = t("shared.etb");
  if (!debt) return null;

  const totalAmount = parseFloat(debt.amount || "0");
  const paidAmount = parseFloat(debt.paidAmount || "0");
  const remaining = parseFloat(debt.remainingAmount || String(Math.max(0, totalAmount - paidAmount)));
  const isPaid = debt.status === "PAID" || remaining <= 0;
  const payments = debt.payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="mb-5 flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">{t("debts.voucherDetails")}</h2>
              <span className="rounded-md border border-zinc-200/80 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                {debt.id}
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-800 border border-emerald-200/70">
                  <CheckCircle2 className="size-3" /> {t("debts.statusPaid")}
                </span>
              ) : debt.status === "PARTIAL" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-blue-800 border border-blue-200/70">
                  <Clock className="size-3" /> {t("debts.statusPartiallyPaid")}
                </span>
              ) : debt.status === "OVERDUE" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-rose-800 border border-rose-200/70">
                  <AlertCircle className="size-3" /> {t("debts.statusOverdue")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-800 border border-amber-200/70">
                  <Clock className="size-3" /> {t("debts.statusPending")}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {t("debts.customer")}: <span className="font-semibold text-zinc-800">{debt.customerName || t("debts.customer")}</span> • {t("shared.phone")}:{" "}
              <span className="font-mono text-zinc-800">{debt.customerPhone || "—"}</span>
              {debt.dueDate && ` • ${t("debts.due")}: ${debt.dueDate}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Amount Breakdown Cards */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 shadow-2xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t("debts.originalDebt")}</span>
            <p className="mt-1 text-sm font-bold text-zinc-900 font-mono tabular-nums">
              {totalAmount.toLocaleString()} {etb}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 shadow-2xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t("debts.totalRepaid")}</span>
            <p className="mt-1 text-sm font-bold text-emerald-700 font-mono tabular-nums">
              {paidAmount.toLocaleString()} {etb}
            </p>
          </div>
          <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3 shadow-2xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-800">{t("debts.remainingBalance")}</span>
            <p className="mt-1 text-sm font-bold text-rose-700 font-mono tabular-nums">
              {remaining.toLocaleString()} {etb}
            </p>
          </div>
        </div>

        {/* Itemized Goods List (if available) */}
        {debt.items && debt.items.length > 0 && (
          <div className="mb-4 rounded-xl border border-zinc-200/80 overflow-hidden shadow-2xs">
            <div className="bg-zinc-50/70 px-3.5 py-2 border-b border-zinc-200/80 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {t("debts.itemizedProducts", { count: debt.items.length })}
            </div>
            <div className="divide-y divide-zinc-100 text-xs">
              {debt.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2">
                  <div>
                    <span className="font-semibold text-zinc-900">{item.name}</span>
                    <span className="text-zinc-400 ml-2">× {item.quantity}</span>
                  </div>
                  <div className="font-mono font-medium text-zinc-800 tabular-nums">
                    {(item.totalPrice || (item.unitPrice || 0) * item.quantity).toLocaleString()} {etb}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {debt.notes && (
          <div className="mb-4 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-2.5 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">{t("debts.notesPurpose")}:</span> {debt.notes}
          </div>
        )}

        {/* Payments History Table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {t("debts.paymentInstallments", { count: payments.length })}
            </h3>
            {!isPaid && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(debt);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Plus className="size-3" /> {t("debts.recordPayment")}
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200/80 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-zinc-200/80 bg-zinc-50/70 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2">{t("shared.date")}</th>
                  <th className="px-4 py-2">{t("debts.methodTender")}</th>
                  <th className="px-4 py-2">{t("debts.reference")}</th>
                  <th className="px-4 py-2 text-right">{t("debts.amountPaid")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.length > 0 ? (
                  payments.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-zinc-50/60">
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-700 font-mono text-[11px]">
                        {p.paidAt ? formatDate(p.paidAt) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-md border border-zinc-200/80 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-zinc-800">
                          {methodLabel(t, p.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-600">
                        {p.reference || `PAY-${idx + 1}`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-bold text-emerald-600 tabular-nums">
                        +{parseFloat(String(p.amount || "0")).toLocaleString()} {etb}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-7 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
                          <Coins className="size-4" />
                        </div>
                        <p className="font-semibold text-xs text-zinc-700">{t("debts.noInstallments")}</p>
                        <p className="text-[11px] text-zinc-400 max-w-xs text-center">
                          {isPaid
                            ? t("debts.settledInFull")
                            : t("debts.installmentsAuto")}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
          >
            {t("shared.close")}
          </button>
          {!isPaid && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPayment(debt);
              }}
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
            >
              <Coins className="size-3.5 text-indigo-400" />
              {t("debts.receivePayment")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Customer Chronological Debt History Drawer / Modal           */
/* ------------------------------------------------------------------ */
type CustomerDebtHistoryProps = {
  customer: Customer | null;
  customerDebts: Debt[];
  onClose: () => void;
  onOpenPayment: (customer: Customer, debt?: Debt, multipleDebts?: Debt[]) => void;
  onOpenAddDebt: (customer: Customer) => void;
  isCashier?: boolean;
};

// Renders nothing without a customer; the content component always has one,
// so its hooks run in the same order on every render.
function CustomerDebtHistoryModal(props: CustomerDebtHistoryProps) {
  if (!props.customer) return null;
  return <CustomerDebtHistoryContent {...props} customer={props.customer} />;
}

function CustomerDebtHistoryContent({
  customer,
  customerDebts,
  onClose,
  onOpenPayment,
  onOpenAddDebt,
  isCashier = false,
}: CustomerDebtHistoryProps & { customer: Customer }) {
  const t = useT();
  const { formatDate } = useFormat();
  const etb = t("shared.etb");

  // Aggregate stats
  const totalOutstanding = customerDebts.reduce((sum, d) => {
    return sum + parseFloat(d.remainingAmount || d.amount || "0");
  }, 0);
  const totalOriginal = customerDebts.reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);
  const totalRepaid = customerDebts.reduce((sum, d) => sum + parseFloat(d.paidAmount || "0"), 0);
  const creditLimit = parseFloat(String(customer.creditLimit || "5000"));
  const transactions = customer.debtHistory || [];

  // Sort customer debts reverse-chronological (newest first)
  const sortedDebts = [...customerDebts].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
    return timeB - timeA;
  });

  const unpaidDebts = useMemo(() => {
    return sortedDebts.filter((d) => {
      const rem = parseFloat(d.remainingAmount || d.amount || "0");
      return d.status !== "PAID" && rem > 0;
    });
  }, [sortedDebts]);

  const [selectedHistoryDebtIds, setSelectedHistoryDebtIds] = useState<string[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "UNPAID">("ALL");
  const [copiedStatement, setCopiedStatement] = useState(false);

  function handleCopyStatement() {
    const stmt =
      `${t("debts.stmtTitle", { name: customer.name })}\n` +
      `${t("debts.stmtCustomerId", { id: customer.customerId || "CUST-001" })}\n` +
      `${t("debts.stmtPhone", { phone: customer.phone || "—" })}\n` +
      `${t("debts.stmtOutstanding", { amount: totalOutstanding.toLocaleString() })}\n` +
      `${t("debts.stmtOpenVouchers", { count: unpaidDebts.length })}\n` +
      `${t("debts.stmtCreditLimit", { amount: creditLimit.toLocaleString() })}\n` +
      `${t("debts.stmtDate", { date: formatDate(new Date()) })}\n\n` +
      (unpaidDebts.length > 0
        ? `${t("debts.stmtPendingHeader")}\n` +
          unpaidDebts
            .map((d) => {
              const vars = {
                id: d.id.slice(-6).toUpperCase(),
                amount: parseFloat(d.remainingAmount || d.amount || "0").toLocaleString(),
                due: d.dueDate || "",
              };
              return d.dueDate ? t("debts.stmtLineDue", vars) : t("debts.stmtLine", vars);
            })
            .join("\n")
        : t("debts.stmtAllSettled"));

    navigator.clipboard.writeText(stmt);
    setCopiedStatement(true);
    setTimeout(() => setCopiedStatement(false), 2000);
  }

  const displayedDebts = historyFilter === "UNPAID" ? unpaidDebts : sortedDebts;

  const selectedHistoryDebtsSum = useMemo(() => {
    return unpaidDebts
      .filter((d) => selectedHistoryDebtIds.includes(d.id))
      .reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);
  }, [unpaidDebts, selectedHistoryDebtIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Customer Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-9 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 font-mono text-xs font-bold text-zinc-900">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">{customer.name}</h2>
                <span className="rounded-md border border-zinc-200/80 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700">
                  {customer.customerId || "CUST-001"}
                </span>
                {totalOutstanding <= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-800 border border-emerald-200/70">
                    <CheckCircle2 className="size-3" /> {t("debts.statusSettled")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-red-800 border border-red-200/70">
                    {t("debts.statusActiveDebt")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t("shared.phone")}: <span className="font-mono text-zinc-800">{customer.phone || t("debts.noPhone")}</span>
                {customer.address && ` • ${customer.address}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyStatement}
              className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs active:scale-95"
              title={t("debts.copyStatementTitle")}
            >
              {copiedStatement ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t("debts.copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-zinc-500" />
                  <span>{t("debts.copyStatement")}</span>
                </>
              )}
            </button>
            {!isCashier && (
              <button
                type="button"
                onClick={() => onOpenAddDebt(customer)}
                className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 transition-colors shadow-2xs active:scale-95"
              >
                <Plus className="size-3.5 text-zinc-500" />
                {t("debts.addDebt")}
              </button>
            )}
            {totalOutstanding > 0 && (
              <button
                type="button"
                onClick={() => onOpenPayment(customer)}
                className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
              >
                <Coins className="size-3.5 text-indigo-400" />
                {t("debts.receivePayment")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("shared.close")}
              className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">{t("debts.currentOutstanding")}</span>
            <p className="mt-1 font-mono text-base font-bold text-red-600 tabular-nums">
              {totalOutstanding.toLocaleString()} {etb}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">{t("debts.creditLimit")}</span>
            <p className="mt-1 font-mono text-base font-bold text-zinc-900 tabular-nums">
              {creditLimit.toLocaleString()} {etb}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">{t("debts.totalCreditPurchases")}</span>
            <p className="mt-1 font-mono text-base font-bold text-blue-600 tabular-nums">
              {totalOriginal.toLocaleString()} {etb}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-emerald-50/40 p-3.5">
            <span className="text-[11px] font-medium text-emerald-800">{t("debts.totalRepaid")}</span>
            <p className="mt-1 font-mono text-base font-bold text-emerald-700 tabular-nums">
              {totalRepaid.toLocaleString()} {etb}
            </p>
          </div>
        </div>

        {/* Chronological Debt Vouchers Header */}
        <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-zinc-700" />
              <h3 className="text-xs font-bold text-zinc-900">
                {t("debts.vouchersPurchases", { count: displayedDebts.length })}
              </h3>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setHistoryFilter("ALL")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  historyFilter === "ALL"
                    ? "bg-white text-zinc-950 font-bold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t("debts.filterAllCount", { count: sortedDebts.length })}
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("UNPAID")}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  historyFilter === "UNPAID"
                    ? "bg-white text-zinc-950 font-bold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {t("debts.unpaidOnlyCount", { count: unpaidDebts.length })}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unpaidDebts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedHistoryDebtIds.length === unpaidDebts.length) {
                    setSelectedHistoryDebtIds([]);
                  } else {
                    setSelectedHistoryDebtIds(unpaidDebts.map((d) => d.id));
                  }
                }}
                className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 underline"
              >
                {selectedHistoryDebtIds.length === unpaidDebts.length
                  ? t("debts.deselectAll")
                  : t("debts.selectAllUnpaid", { count: unpaidDebts.length })}
              </button>
            )}
            <span className="text-[11px] text-zinc-400">{t("debts.allCreditVouchers")}</span>
          </div>
        </div>

        {/* Chronological Debt Vouchers List */}
        <div className="space-y-3.5">
          {displayedDebts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-zinc-400 text-xs">
              {historyFilter === "UNPAID"
                ? t("debts.emptyUnpaid", { name: customer.name })
                : t("debts.emptyNone", { name: customer.name })}
            </div>
          ) : (
            displayedDebts.map((d) => {
                const totalAmt = parseFloat(d.amount || "0");
                const paidAmt = parseFloat(d.paidAmount || "0");
                const remAmt = parseFloat(d.remainingAmount || String(Math.max(0, totalAmt - paidAmt)));
                const isPaid = d.status === "PAID" || remAmt <= 0;
                const isOverdue = d.status === "OVERDUE" || (!isPaid && d.dueDate && new Date(d.dueDate) < new Date());
                const debtPayments = d.payments || [];

                const shortVoucherId = t("debts.voucherNo", {
                  id: d.id.includes("-") ? d.id.split("-").pop()?.toUpperCase() ?? "" : d.id.slice(-6).toUpperCase(),
                });

                return (
                  <div
                    key={d.id}
                    className={`rounded-xl border bg-white p-4 shadow-2xs transition-all ${
                      selectedHistoryDebtIds.includes(d.id)
                        ? "border-zinc-900 ring-1 ring-zinc-900/10"
                        : "border-zinc-200/90 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2">
                        {!isPaid && (
                          <input
                            type="checkbox"
                            checked={selectedHistoryDebtIds.includes(d.id)}
                            onChange={() => {
                              setSelectedHistoryDebtIds((prev) =>
                                prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                              );
                            }}
                            className="size-4 rounded border-zinc-300 text-zinc-950 focus:ring-0 cursor-pointer"
                            title={t("debts.selectVoucherBatch")}
                          />
                        )}
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-800"
                          title={t("debts.fullDebtId", { id: d.id })}
                        >
                          <Receipt className="size-3 text-zinc-500" />
                          {shortVoucherId}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {d.createdAt ? formatDate(d.createdAt) : "—"}
                        </span>
                        {isPaid ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 border border-emerald-200/60">
                            {t("debts.statusPaid")}
                          </span>
                        ) : d.status === "PARTIAL" ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 border border-blue-200/60">
                            {t("debts.statusPartial")}
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 border border-rose-200/60">
                            {t("debts.statusOverdue")}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-200/60">
                            {t("debts.statusPending")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {d.dueDate && (
                          <span className="text-[11px] text-zinc-500">
                            {t("debts.due")}: <span className="font-semibold text-zinc-800">{formatDate(d.dueDate)}</span>
                          </span>
                        )}
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => onOpenPayment(customer, d)}
                            className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95"
                          >
                            <Coins className="size-3 text-indigo-400" />
                            {t("debts.payThisDebt")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial details per debt voucher */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase">{t("debts.originalAmount")}</span>
                        <p className="font-mono font-bold text-zinc-900">{totalAmt.toLocaleString()} {etb}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase">{t("debts.repaidAmount")}</span>
                        <p className="font-mono font-bold text-emerald-600">{paidAmt.toLocaleString()} {etb}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase">{t("debts.remainingDue")}</span>
                        <p className={`font-mono font-bold ${remAmt > 0 ? "text-red-600" : "text-zinc-500"}`}>
                          {remAmt.toLocaleString()} {etb}
                        </p>
                      </div>
                    </div>

                    {/* Itemized Goods (if any) */}
                    {d.items && d.items.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-zinc-700">
                          <span className="flex items-center gap-1.5">
                            <Package className="size-3.5 text-zinc-500" />
                            <span>{t("debts.purchasedItems", { count: d.items.length })}</span>
                          </span>
                        </div>
                        <div className="divide-y divide-zinc-200/60 rounded-lg border border-zinc-200/70 bg-white text-xs">
                          {d.items.map((it, idx) => {
                            const itemName = it.name && it.name !== "Product" ? it.name : (it as any).product?.name || it.name || t("debts.item");
                            const unitPrice = typeof it.unitPrice === "number" ? it.unitPrice : parseFloat(String(it.unitPrice || 0));
                            const lineTotal = typeof it.totalPrice === "number" ? it.totalPrice : (unitPrice * (it.quantity || 1));
                            return (
                              <div key={idx} className="flex items-center justify-between px-2.5 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-900">{itemName}</span>
                                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                                    {it.quantity}x
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-zinc-900">
                                    {lineTotal > 0 ? `${lineTotal.toLocaleString()} ${etb}` : "—"}
                                  </span>
                                  {unitPrice > 0 && it.quantity > 1 && (
                                    <span className="block text-[10px] text-zinc-400">
                                      {t("debts.atPrice", { price: unitPrice.toLocaleString() })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : d.notes ? (
                      <div className="mt-3 rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5 text-xs text-zinc-700">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                          <Package className="size-3.5 text-zinc-500" />
                          <span>{t("debts.purchasedGoodsNotes")}</span>
                        </div>
                        <p className="rounded-lg border border-zinc-200/60 bg-white p-2 font-mono text-[11px] text-zinc-800">
                          {d.notes}
                        </p>
                      </div>
                    ) : null}

                    {/* Additional Notes when items also present */}
                    {d.notes && d.items && d.items.length > 0 && (
                      <p className="mt-2 text-xs text-zinc-500 italic">“{d.notes}”</p>
                    )}

                    {/* Payment Audit Trail per Debt */}
                    {debtPayments.length > 0 && (
                      <div className="mt-3 border-t border-zinc-100 pt-2.5">
                        <span className="text-[11px] font-bold text-zinc-700">{t("debts.repaymentInstallments")}</span>
                        <div className="mt-1 space-y-1">
                          {debtPayments.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="flex items-center justify-between rounded-lg bg-zinc-50/80 px-2.5 py-1 text-[11px] text-zinc-600"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-zinc-500">{p.reference || `PAY-${idx + 1}`}</span>
                                <span className="rounded bg-zinc-200/70 px-1.5 py-0.2 font-medium text-zinc-800">
                                  {methodLabel(t, p.paymentMethod)}
                                </span>
                                <span>{p.paidAt ? formatDate(p.paidAt, { month: "short", day: "numeric" }) : ""}</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-600">
                                +{parseFloat(String(p.amount || 0)).toLocaleString()} {etb}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
        </div>

        {/* Sticky Selected Actions Footer */}
        {selectedHistoryDebtIds.length > 0 && (
          <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 mt-5 flex items-center justify-between border-t border-zinc-800 bg-slate-900 px-5 py-3 text-white shadow-2xl rounded-b-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-white text-zinc-950 font-bold text-xs">
                {selectedHistoryDebtIds.length}
              </span>
              <span className="text-xs font-semibold">
                {t.n("debts.vouchersSelected", selectedHistoryDebtIds.length)}
              </span>
              <span className="font-mono text-xs font-bold text-indigo-400">
                {selectedHistoryDebtsSum.toLocaleString()} {etb}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedHistoryDebtIds([])}
                className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
              >
                {t("debts.clear")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const selected = unpaidDebts.filter((d) => selectedHistoryDebtIds.includes(d.id));
                  onClose();
                  onOpenPayment(customer, undefined, selected);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-xs hover:bg-zinc-100 active:scale-95 cursor-pointer"
              >
                <Coins className="size-3.5 text-zinc-950" />
                {t("debts.paySelected")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            {t("shared.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Create Standalone Debt (Supports Itemized Products)         */
/* ------------------------------------------------------------------ */
function CreateDebtModal({
  customers,
  initialCustomerId,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: () => void;
  shopId?: string;
}) {
  const t = useT();
  const etb = t("shared.etb");
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [customerId, setCustomerId] = useState(initialCustomerId || customers[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Itemized product builder state
  const [isItemized, setIsItemized] = useState(true);
  const [items, setItems] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([
    { name: "Whole Milk 1L", quantity: 2, unitPrice: 85 },
  ]);

  // Sync total amount from itemized items when in itemized mode
  useEffect(() => {
    if (isItemized) {
      const sum = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
      setAmount(sum > 0 ? String(sum) : "");
    }
  }, [items, isItemized]);

  const selectedCustomer = useMemo(() => customers.find((c) => c.id === customerId) || null, [customers, customerId]);

  function handleAddItem() {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0 }]);
  }

  function handleRemoveItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleItemChange(idx: number, field: "name" | "quantity" | "unitPrice", val: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    if (!customerId || !finalAmount || finalAmount <= 0) {
      setErrorMsg(t("debts.errSelectCustomerAmount"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formattedItems = isItemized
        ? items
            .filter((it) => it.name.trim().length > 0)
            .map((it) => ({
              name: it.name.trim(),
              quantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice) || 0,
              totalPrice: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
            }))
        : undefined;

      await createDebt(activeShopId, {
        customerId,
        amount: finalAmount,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        items: formattedItems,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : t("debts.errRecordDebt");
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">{t("debts.createDebt.title")}</h2>
            <p className="text-xs text-zinc-500">{t("debts.createDebt.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("shared.close")} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100">
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("debts.customer")} *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {t("debts.customerOption", {
                    name: c.name,
                    phone: c.phone || t("debts.noPhone"),
                    amount: parseFloat(c.debtBalance || "0").toLocaleString(),
                  })}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{t("debts.creditLimitAmt", { amount: parseFloat(String(selectedCustomer.creditLimit || "5000")).toLocaleString() })}</span>
                <span>{t("debts.currentDebtAmt", { amount: parseFloat(selectedCustomer.debtBalance || "0").toLocaleString() })}</span>
              </div>
            )}
          </div>

          {/* Itemized Goods Section */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800">{t("debts.itemizedGoods")}</span>
              <button
                type="button"
                onClick={() => setIsItemized(!isItemized)}
                className="text-[11px] font-semibold text-zinc-600 underline"
              >
                {isItemized ? t("debts.switchSimple") : t("debts.itemizeProducts")}
              </button>
            </div>

            {isItemized ? (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={t("debts.itemNamePlaceholder")}
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder={t("debts.qty")}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value, 10) || 1)}
                      className="h-8 w-14 rounded-lg border border-zinc-200 bg-white px-2 text-center text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("debts.price")}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20 rounded-lg border border-zinc-200 bg-white px-2 text-right text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      aria-label={t("shared.delete")}
                      className="text-zinc-400 hover:text-red-600 p-1 disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-[11px] font-bold text-zinc-800 hover:underline pt-1"
                >
                  <Plus className="size-3" /> {t("debts.addAnotherItem")}
                </button>
              </div>
            ) : null}
          </div>

          {/* Debt Amount Input */}
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("debts.totalDebtAmount")}</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="h-10 w-full rounded-xl border border-zinc-200 px-3 pr-12 font-mono text-sm font-bold text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-zinc-400">
                {etb}
              </span>
            </div>
          </div>

          {/* Due Date & Purpose Notes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-zinc-700">{t("debts.dueDate")}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-zinc-700">{t("debts.notesAgreement")}</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("debts.notesAgreementPh")}
                className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-1.5 font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("debts.recording") : t("debts.recordVoucher")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Settle Debt / Receive Payment (Overhauled 2-Column UX)      */
/* ------------------------------------------------------------------ */
function ReceivePaymentModal({
  customers,
  targetDebt,
  targetDebts,
  initialCustomerId,
  allDebts = [],
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  targetDebt?: Debt | null;
  targetDebts?: Debt[] | null;
  initialCustomerId?: string;
  allDebts?: Debt[];
  onClose: () => void;
  onSuccess: (settledDebtIds?: string[], newBalance?: number, updatedDebts?: Debt[]) => void;
}) {
  const t = useT();
  const etb = t("shared.etb");
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const defaultCustId =
    targetDebt?.customerId ||
    (targetDebts && targetDebts.length > 0 ? targetDebts[0].customerId : null) ||
    initialCustomerId ||
    customers.find((c) => parseFloat(c.debtBalance || "0") > 0)?.id ||
    customers[0]?.id ||
    "";

  const [selectedCustId, setSelectedCustId] = useState(defaultCustId);
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustId) || null,
    [customers, selectedCustId],
  );

  // Unpaid vouchers for this customer
  const customerOpenDebts = useMemo(() => {
    return allDebts.filter((d) => {
      if (d.customerId !== selectedCustId) return false;
      const rem = parseFloat(d.remainingAmount || d.amount || "0");
      return d.status !== "PAID" && rem > 0;
    });
  }, [allDebts, selectedCustId]);

  // Selected voucher IDs to pay
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>(() => {
    if (targetDebts && targetDebts.length > 0 && targetDebts[0].customerId === defaultCustId) {
      return targetDebts.map((d) => d.id);
    }
    if (targetDebt && targetDebt.customerId === defaultCustId) {
      return [targetDebt.id];
    }
    const open = allDebts.filter((d) => {
      if (d.customerId !== defaultCustId) return false;
      const rem = parseFloat(d.remainingAmount || d.amount || "0");
      return d.status !== "PAID" && rem > 0;
    });
    return open.map((d) => d.id);
  });

  const totalCustomerDebt = selectedCustomer
    ? parseFloat(selectedCustomer.debtBalance || "0")
    : customerOpenDebts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);

  const selectedDebtsSum = useMemo(() => {
    if (customerOpenDebts.length === 0) return totalCustomerDebt;
    return customerOpenDebts
      .filter((d) => selectedDebtIds.includes(d.id))
      .reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);
  }, [customerOpenDebts, selectedDebtIds, totalCustomerDebt]);

  const initialAmount = targetDebt
    ? parseFloat(targetDebt.remainingAmount || targetDebt.amount || "0")
    : targetDebts && targetDebts.length > 0
    ? targetDebts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0)
    : totalCustomerDebt;

  const [amount, setAmount] = useState(initialAmount > 0 ? String(initialAmount) : "");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Mobile Payment">("Cash");
  const [bankName, setBankName] = useState(POPULAR_BANKS[0]);
  const [reference, setReference] = useState(() => `PAY-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const payVal = parseFloat(amount) || 0;
  const targetCeiling = selectedDebtIds.length > 0 ? selectedDebtsSum : totalCustomerDebt;
  const newDebtBalance = Math.max(0, totalCustomerDebt - payVal);

  // Credit health metrics
  const creditLimit = parseFloat(String(selectedCustomer?.creditLimit || "5000"));
  const creditUtilizationPct = creditLimit > 0 ? Math.min(100, Math.round((totalCustomerDebt / creditLimit) * 100)) : 0;

  // Real-time FIFO allocation preview
  const allocationMap = useMemo(() => {
    let pool = payVal;
    const map = new Map<
      string,
      { allocated: number; remainingAfter: number; status: "FULLY_PAID" | "PARTIAL" | "UNTOUCHED" }
    >();

    customerOpenDebts.forEach((debt) => {
      const rem = parseFloat(debt.remainingAmount || debt.amount || "0");
      if (!selectedDebtIds.includes(debt.id)) {
        map.set(debt.id, { allocated: 0, remainingAfter: rem, status: "UNTOUCHED" });
        return;
      }
      if (pool <= 0) {
        map.set(debt.id, { allocated: 0, remainingAfter: rem, status: "UNTOUCHED" });
      } else if (pool >= rem - 0.001) {
        pool -= rem;
        map.set(debt.id, { allocated: rem, remainingAfter: 0, status: "FULLY_PAID" });
      } else {
        const allocated = pool;
        const remainingAfter = Math.max(0, rem - pool);
        pool = 0;
        map.set(debt.id, { allocated, remainingAfter, status: "PARTIAL" });
      }
    });

    return map;
  }, [customerOpenDebts, selectedDebtIds, payVal]);

  function handleSelectAllDebts() {
    const allIds = customerOpenDebts.map((d) => d.id);
    setSelectedDebtIds(allIds);
    setAmount(totalCustomerDebt > 0 ? String(totalCustomerDebt) : "");
  }

  function handleDeselectAll() {
    setSelectedDebtIds([]);
    setAmount("");
  }

  function handleToggleDebt(dId: string) {
    setSelectedDebtIds((prev) => {
      const next = prev.includes(dId) ? prev.filter((id) => id !== dId) : [...prev, dId];
      const sum = customerOpenDebts
        .filter((d) => next.includes(d.id))
        .reduce((acc, d) => acc + parseFloat(d.remainingAmount || d.amount || "0"), 0);
      setAmount(sum > 0 ? String(sum) : "");
      return next;
    });
  }

  function handleCustomerChange(newCustId: string) {
    setSelectedCustId(newCustId);
    const newCust = customers.find((c) => c.id === newCustId);
    const openForNew = allDebts.filter((d) => {
      if (d.customerId !== newCustId) return false;
      const rem = parseFloat(d.remainingAmount || d.amount || "0");
      return d.status !== "PAID" && rem > 0;
    });
    const allIds = openForNew.map((d) => d.id);
    setSelectedDebtIds(allIds);
    const bal = newCust ? parseFloat(newCust.debtBalance || "0") : 0;
    setAmount(bal > 0 ? String(bal) : "");
  }

  function selectTender(type: "Cash" | "Telebirr" | "CBE Bank" | "Card" | "Other Bank") {
    if (type === "Cash") {
      setPaymentMethod("Cash");
    } else if (type === "Telebirr") {
      setPaymentMethod("Mobile Payment");
      setBankName("Telebirr");
    } else if (type === "CBE Bank") {
      setPaymentMethod("Bank Transfer");
      setBankName("Commercial Bank of Ethiopia (CBE)");
    } else if (type === "Card") {
      setPaymentMethod("Card");
    } else if (type === "Other Bank") {
      setPaymentMethod("Bank Transfer");
      if (bankName === "Commercial Bank of Ethiopia (CBE)" || bankName === "Telebirr") {
        setBankName("Awash Bank");
      }
    }
  }

  const activeTenderKey =
    paymentMethod === "Cash"
      ? "Cash"
      : paymentMethod === "Card"
      ? "Card"
      : paymentMethod === "Mobile Payment" && bankName === "Telebirr"
      ? "Telebirr"
      : paymentMethod === "Bank Transfer" && bankName === "Commercial Bank of Ethiopia (CBE)"
      ? "CBE Bank"
      : "Other Bank";

  function addAmountIncrement(increment: number) {
    const cur = parseFloat(amount) || 0;
    const next = Math.min(targetCeiling, cur + increment);
    setAmount(next > 0 ? String(next) : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustId) {
      setErrorMsg(t("debts.errSelectCustomer"));
      return;
    }
    if (payVal <= 0) {
      setErrorMsg(t("debts.errAmountZero"));
      return;
    }
    if (payVal > targetCeiling + 0.05) {
      setErrorMsg(t("debts.errExceed", { amount: targetCeiling.toLocaleString() }));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const selectedVouchers = customerOpenDebts.filter((d) => selectedDebtIds.includes(d.id));
      const payRes = await recordDebtPayment(activeShopId, {
        customerId: selectedCustId,
        debtIds: selectedDebtIds.length > 0 ? selectedDebtIds : undefined,
        debts: selectedVouchers.length > 0 ? selectedVouchers : customerOpenDebts,
        debtId: selectedDebtIds.length === 1 ? selectedDebtIds[0] : undefined,
        amount: payVal,
        paymentMethod,
        bankName: paymentMethod === "Bank Transfer" || paymentMethod === "Mobile Payment" ? bankName : undefined,
        reference,
        notes:
          notes ||
          (selectedDebtIds.length > 1
            ? `Settlement for ${selectedDebtIds.length} debt vouchers`
            : selectedDebtIds.length === 1
            ? `Repayment for debt ${selectedDebtIds[0]}`
            : `Debt repayment via ${paymentMethod}`),
      });
      onSuccess(selectedDebtIds, newDebtBalance, payRes?.debts);
    } catch {
      setErrorMsg(t("debts.errRecordPayment"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 text-zinc-900 font-bold">
              <Coins className="size-4 text-zinc-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  {targetDebt
                    ? t("debts.settleVoucher")
                    : selectedDebtIds.length > 1
                    ? t("debts.settleMultiple", { count: selectedDebtIds.length })
                    : t("debts.receiveDebtPayment")}
                </h2>
                {targetDebt && (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                    #{targetDebt.id.slice(-6).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {selectedCustomer
                  ? t.n("debts.customerOpenLine", customerOpenDebts.length, {
                      name: selectedCustomer.name,
                      phone: selectedCustomer.phone || t("debts.noPhone"),
                    })
                  : t("debts.chooseCustomerSettle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* ------------------------------------------------------------ */}
            {/* LEFT COLUMN: Customer Profile + Voucher Checklist with Preview*/}
            {/* ------------------------------------------------------------ */}
            <div className="space-y-4 md:col-span-6">
              {/* Customer Selector / Profile Card */}
              {targetDebt || (targetDebts && targetDebts.length > 0) ? (
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t("debts.debtorProfile")}</span>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {selectedCustomer?.name || targetDebt?.customerName || targetDebts?.[0]?.customerName || t("debts.customer")}
                      </h3>
                      <p className="font-mono text-[11px] text-zinc-500">
                        {selectedCustomer?.phone || targetDebt?.customerPhone || targetDebts?.[0]?.customerPhone || "—"}
                      </p>
                    </div>
                    <span className="rounded-md bg-zinc-200/60 px-2 py-1 font-mono text-[11px] font-semibold text-zinc-800">
                      {selectedCustomer?.customerId || "CUST"}
                    </span>
                  </div>

                  {/* Credit Utilization Bar */}
                  <div className="mt-3 border-t border-zinc-200/60 pt-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">{t("debts.creditUtilizationLimit")}</span>
                      <span className="font-mono font-semibold text-zinc-800">
                        {creditUtilizationPct}% ({totalCustomerDebt.toLocaleString()} / {creditLimit.toLocaleString()} {etb})
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          creditUtilizationPct >= 85
                            ? "bg-rose-500"
                            : creditUtilizationPct >= 60
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${creditUtilizationPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {t("debts.selectDebtor")}
                  </label>
                  <select
                    value={selectedCustId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-semibold text-zinc-900 focus:border-slate-900 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t("debts.debtorOption", {
                          name: c.name,
                          amount: parseFloat(c.debtBalance || "0").toLocaleString(),
                          phone: c.phone || t("debts.noPhone"),
                        })}
                      </option>
                    ))}
                  </select>

                  {selectedCustomer && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">{t("debts.creditUtilization")}</span>
                        <span className="font-mono font-semibold text-zinc-800">
                          {creditUtilizationPct}% ({totalCustomerDebt.toLocaleString()} / {creditLimit.toLocaleString()} {etb})
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            creditUtilizationPct >= 85
                              ? "bg-rose-500"
                              : creditUtilizationPct >= 60
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${creditUtilizationPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Debt Voucher Checklist with Real-Time Settlement Badges */}
              {customerOpenDebts.length > 0 ? (
                <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
                  <div className="mb-2.5 flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="size-3.5 text-zinc-600" />
                      <span className="font-bold text-zinc-900 text-xs">
                        {t("debts.openVouchersCount", { selected: selectedDebtIds.length, total: customerOpenDebts.length })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllDebts}
                        className="text-[11px] font-bold text-zinc-900 underline hover:text-black"
                      >
                        {t("debts.selectAll")}
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800"
                      >
                        {t("debts.clear")}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {customerOpenDebts.map((d) => {
                      const isSelected = selectedDebtIds.includes(d.id);
                      const total = parseFloat(d.amount || "0");
                      const paid = parseFloat(d.paidAmount || "0");
                      const remaining = parseFloat(d.remainingAmount || String(Math.max(0, total - paid)));
                      const isOverdue = d.status === "OVERDUE" || (d.dueDate && new Date(d.dueDate) < new Date());
                      const shortId = d.id.includes("-") ? d.id.split("-").pop()?.toUpperCase() : d.id.slice(-6).toUpperCase();
                      const alloc = allocationMap.get(d.id);

                      return (
                        <div
                          key={d.id}
                          onClick={() => handleToggleDebt(d.id)}
                          className={`flex cursor-pointer flex-col gap-1.5 rounded-xl border p-2.5 transition-all ${
                            isSelected
                              ? "border-zinc-900 bg-white shadow-2xs ring-1 ring-zinc-900/10"
                              : "border-zinc-200/70 bg-zinc-50/50 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleDebt(d.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="size-4 rounded border-zinc-300 text-zinc-950 focus:ring-0 cursor-pointer"
                              />
                              <span className="font-mono font-bold text-zinc-900 text-xs">#{shortId}</span>
                              {isOverdue && (
                                <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 border border-rose-200/60">
                                  {t("debts.statusOverdue")}
                                </span>
                              )}
                              {d.dueDate && (
                                <span className="text-[10px] text-zinc-400">{t("debts.due")}: {d.dueDate}</span>
                              )}
                            </div>

                            {/* Settlement Badge */}
                            <div>
                              {!isSelected ? (
                                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                                  {t("debts.notSelected")}
                                </span>
                              ) : alloc?.status === "FULLY_PAID" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <Check className="size-2.5" /> {t("debts.fullyPaid")}
                                </span>
                              ) : alloc?.status === "PARTIAL" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                  {t("debts.partialPlus", { amount: alloc.allocated.toLocaleString() })}
                                </span>
                              ) : (
                                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                                  {t("debts.unchanged")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Item preview or notes */}
                          {d.items && d.items.length > 0 ? (
                            <div className="text-[11px] text-zinc-600 truncate pl-6">
                              {d.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                            </div>
                          ) : d.notes ? (
                            <p className="text-[10px] text-zinc-500 truncate pl-6 italic">“{d.notes}”</p>
                          ) : null}

                          <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5 pl-6 text-[11px]">
                            <span className="text-zinc-400 font-mono">{t("debts.origAmount", { amount: total.toLocaleString() })}</span>
                            <span className="font-mono font-bold text-red-600">
                              {t("debts.dueAmount", { amount: remaining.toLocaleString() })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-zinc-400 text-xs">
                  {t("debts.noOpenVouchers")}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT COLUMN: Amount, Tender, Reference & Financial Summary   */}
            {/* ------------------------------------------------------------ */}
            <div className="space-y-4 md:col-span-6">
              {/* Payment Amount Card */}
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {t("debts.paymentAmountEtb")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(targetCeiling))}
                    className="text-[11px] font-bold text-zinc-900 underline hover:text-black"
                  >
                    {t("debts.payFull", { amount: targetCeiling.toLocaleString() })}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 w-full rounded-md border border-zinc-200/80 px-3.5 pr-14 font-mono text-base font-bold text-zinc-900 focus:border-slate-900 focus:outline-none tabular-nums"
                    required
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-400">
                    {etb}
                  </span>
                </div>

                {/* Quick Increment Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[100, 500, 1000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => addAmountIncrement(inc)}
                      className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 shadow-2xs transition-colors"
                    >
                      +{inc.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(String(totalCustomerDebt))}
                    className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 shadow-2xs transition-colors"
                  >
                    {t("debts.clearAllBalance")}
                  </button>
                </div>
              </div>

              {/* 1-Tap Tender Chips */}
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs space-y-2">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {t("debts.paymentMethodTender")}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {(
                    [
                      { id: "Cash", label: t("debts.method.cash"), icon: Banknote },
                      { id: "Telebirr", label: "Telebirr", icon: Smartphone },
                      { id: "CBE Bank", label: t("debts.tenderCbe"), icon: Landmark },
                      { id: "Card", label: t("debts.method.card"), icon: CreditCard },
                      { id: "Other Bank", label: t("debts.tenderOtherBank"), icon: Landmark },
                    ] as const
                  ).map((tender) => {
                    const Icon = tender.icon;
                    const isActive = activeTenderKey === tender.id;
                    return (
                      <button
                        key={tender.id}
                        type="button"
                        onClick={() => selectTender(tender.id)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center transition-all ${
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white font-bold shadow-2xs ring-1 ring-slate-900"
                            : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs"
                        }`}
                      >
                        <Icon className="size-4" />
                        <span className="text-[10px] leading-tight">{tender.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Bank dropdown for Other Bank */}
                {activeTenderKey === "Other Bank" && (
                  <div className="pt-2">
                    <label className="mb-1 block font-medium text-zinc-700 text-[11px]">{t("debts.selectBankName")}</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-900 focus:border-slate-900 focus:outline-none"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {methodLabel(t, b)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reference & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-zinc-700 text-[11px]">{t("debts.referenceTxn")}</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="PAY-0001"
                    className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 font-mono text-xs text-zinc-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-zinc-700 text-[11px]">{t("debts.notesOptional")}</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("debts.counterRepayment")}
                    className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs text-zinc-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Financial Balance Ledger Summary */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-2 shadow-2xs">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">{t("debts.totalCustomerDebt")}</span>
                  <span className="font-bold text-zinc-900 font-mono tabular-nums">
                    {totalCustomerDebt.toLocaleString()} {etb}
                  </span>
                </div>
                {customerOpenDebts.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">{t("debts.selectedTarget")}</span>
                    <span className="font-bold text-rose-700 font-mono tabular-nums">
                      {t.n("debts.selectedTargetValue", selectedDebtIds.length, { amount: selectedDebtsSum.toLocaleString() })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">{t("debts.amountPaying")}</span>
                  <span className="font-bold text-emerald-700 font-mono tabular-nums">
                    -{payVal.toLocaleString()} {etb}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200/70 pt-2 font-bold text-xs">
                  <span className="text-zinc-900">{t("debts.remainingCustomerDebt")}</span>
                  <span
                    className={`font-mono tabular-nums ${
                      newDebtBalance === 0 ? "text-emerald-700 font-bold" : "text-zinc-900"
                    }`}
                  >
                    {newDebtBalance.toLocaleString()} {etb}
                    {newDebtBalance === 0 && ` ${t("debts.paidInFull")}`}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-200/80 bg-white px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
                >
                  {t("shared.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || payVal <= 0}
                  className="flex items-center gap-1.5 rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    t("debts.processing")
                  ) : newDebtBalance === 0 ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      {t("debts.settleMarkPaid")}
                    </>
                  ) : (
                    <>
                      <Coins className="size-4" />
                      {t("debts.recordRepayment")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Multi-Customer Batch Settle Debts                           */
/* ------------------------------------------------------------------ */
function BatchSettleModal({
  debts,
  customers,
  onClose,
  onSuccess,
}: {
  debts: Debt[];
  customers: Customer[];
  onClose: () => void;
  onSuccess: (settledDebtIds?: string[]) => void;
}) {
  const t = useT();
  const etb = t("shared.etb");
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const totalAmount = debts.reduce(
    (sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"),
    0,
  );

  // Group debts by customer
  const groupedByCustomer = useMemo(() => {
    const map: Record<string, { customer: Customer | null; debts: Debt[]; subtotal: number }> = {};
    debts.forEach((d) => {
      const cId = d.customerId;
      if (!map[cId]) {
        map[cId] = {
          customer: customers.find((c) => c.id === cId) || null,
          debts: [],
          subtotal: 0,
        };
      }
      map[cId].debts.push(d);
      map[cId].subtotal += parseFloat(d.remainingAmount || d.amount || "0");
    });
    return Object.values(map);
  }, [debts, customers]);

  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Mobile Payment">("Cash");
  const [bankName, setBankName] = useState(POPULAR_BANKS[0]);
  const [reference, setReference] = useState(() => `BATCH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const batchPayload = groupedByCustomer.map((grp) => ({
        customerId: grp.debts[0].customerId,
        debtIds: grp.debts.map((d) => d.id),
        debts: grp.debts,
        amount: grp.subtotal,
        paymentMethod,
        bankName: paymentMethod === "Bank Transfer" || paymentMethod === "Mobile Payment" ? bankName : undefined,
        reference: `${reference}-${grp.debts[0].customerId.slice(-4)}`,
        notes: notes || `Batch multi-debt settlement for ${grp.debts.length} vouchers`,
      }));

      await recordBatchDebtPayments(activeShopId, batchPayload);
      onSuccess(debts.map((d) => d.id));
    } catch {
      setErrorMsg(t("debts.errBatch"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-emerald-200/60 bg-emerald-50 text-emerald-600">
              <Coins className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">{t("debts.batchTitle")}</h2>
              <p className="text-[11px] text-zinc-500">
                {t("debts.batchSubtitle", {
                  vouchers: t.n("debts.voucherCount", debts.length),
                  customers: t.n("debts.customerCount", groupedByCustomer.length),
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">{errorMsg}</div>
          )}

          {/* Grouped Customer List */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
            <span className="mb-2 block font-semibold text-zinc-700 text-[11px]">
              {t("debts.customersVouchersIncluded", { count: groupedByCustomer.length })}
            </span>
            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {groupedByCustomer.map((grp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white p-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-zinc-900">
                      {grp.customer?.name || grp.debts[0].customerName || t("debts.customer")}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-zinc-400">
                      ({t.n("debts.voucherCount", grp.debts.length)})
                    </span>
                  </div>
                  <div className="font-mono font-bold text-red-600">
                    {grp.subtotal.toLocaleString()} {etb}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Settlement Amount Card */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 flex items-center justify-between">
            <span className="text-zinc-600 font-medium">{t("debts.totalSettlement")}</span>
            <span className="font-mono font-bold text-base text-zinc-950">
              {totalAmount.toLocaleString()} {etb}
            </span>
          </div>

          {/* Tender Selector */}
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">{t("debts.paymentMethodTender")}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["Cash", "Bank Transfer", "Mobile Payment", "Card"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex h-9 items-center justify-center rounded-xl border text-[11px] font-semibold transition-all ${
                    paymentMethod === method
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {method === "Cash"
                    ? t("debts.method.cash")
                    : method === "Bank Transfer"
                    ? t("debts.tenderBank")
                    : method === "Mobile Payment"
                    ? "Telebirr"
                    : t("debts.method.card")}
                </button>
              ))}
            </div>
          </div>

          {(paymentMethod === "Bank Transfer" || paymentMethod === "Mobile Payment") && (
            <div>
              <label className="mb-1 block font-medium text-zinc-700">{t("debts.bankProvider")}</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {methodLabel(t, b)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-700">{t("debts.batchReference")}</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 px-2.5 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-zinc-700">{t("shared.notes")}</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("debts.bulkSettlementPh")}
                className="h-9 w-full rounded-xl border border-zinc-200 px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                t("debts.processing")
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  {t("debts.settleAll", { amount: totalAmount.toLocaleString() })}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page: Customer-First Master-Detail Debt Ledger                */
/* ------------------------------------------------------------------ */
type SortOrder = "asc" | "desc";
type DebtSortField =
  | "dueDate"
  | "remainingAmount"
  | "amount"
  | "paidAmount"
  | "status"
  | "createdAt"
  | "customerName";
type LedgerSortField = "name" | "openDebts" | "balance" | "creditLimit" | "repaid" | "status";
type VoucherSortField = "createdAt" | "dueDate" | "amount" | "remaining";

/** Clickable table header cell with an asc/desc arrow, shared by every sortable debt table. */
function SortableTh<F extends string>({
  label,
  field,
  activeField,
  order,
  onSort,
  align = "left",
  className = "px-5 py-3.5",
}: {
  label: string;
  field: F;
  activeField: F;
  order: SortOrder;
  onSort: (field: F) => void;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <th className={`${className} ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`flex w-full items-center gap-1.5 ${justify} font-semibold hover:text-zinc-950`}
      >
        <span>{label}</span>
        {activeField === field ? (
          order === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
        ) : (
          <ArrowUpDown className="size-3 text-zinc-400" />
        )}
      </button>
    </th>
  );
}

function compareValues(a: string | number, b: string | number, order: SortOrder) {
  if (a < b) return order === "asc" ? -1 : 1;
  if (a > b) return order === "asc" ? 1 : -1;
  return 0;
}

export default function DebtsPage() {
  const authUser = useAuthStore((state) => state.user);
  const isCashier = authUser?.role === "SALES";
  const t = useT();
  const { formatDate } = useFormat();
  const etb = t("shared.etb");
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary>({
    totalOutstandingDebt: 0,
    totalDebtors: 0,
    collectedThisMonth: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Default to Customer-First Ledger as required by Phase 2
  const [mainTab, setMainTab] = useState<"customers" | "debts">("customers");

  // Customers Filter & Search
  const [customerFilter, setCustomerFilter] = useState<"ALL" | "OVERDUE" | "ACTIVE" | "PAID">("ALL");
  const [customerSearch, setCustomerSearch] = useState("");

  // Debts Filter & Search
  const [debtFilter, setDebtFilter] = useState<
    "ALL" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "DUE_THIS_WEEK"
  >("ALL");
  const [debtSearch, setDebtSearch] = useState("");

  // Modals state
  const [selectedDebtDetail, setSelectedDebtDetail] = useState<Debt | null>(null);
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<Debt | null>(null);
  const [paymentTargetDebts, setPaymentTargetDebts] = useState<Debt[] | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Customer | null>(null);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCreateDebtModalOpen, setIsCreateDebtModalOpen] = useState(false);
  const [addDebtPreselectedCustomer, setAddDebtPreselectedCustomer] = useState<string | undefined>(undefined);

  // Table batch selection
  const [selectedTableDebtIds, setSelectedTableDebtIds] = useState<string[]>([]);

  // Customer Accordion Drawer Expansion
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<string[]>([]);
  function toggleCustomerExpand(id: string) {
    setExpandedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  // Debt Records Sorting
  const [debtSortField, setDebtSortField] = useState<DebtSortField>("createdAt");
  const [debtSortOrder, setDebtSortOrder] = useState<SortOrder>("desc");

  function handleDebtSort(field: DebtSortField) {
    if (debtSortField === field) {
      setDebtSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setDebtSortField(field);
      setDebtSortOrder("desc");
    }
  }

  // Customer ledger (Tab 1) sorting: biggest outstanding balance first by default
  const [ledgerSortField, setLedgerSortField] = useState<LedgerSortField>("balance");
  const [ledgerSortOrder, setLedgerSortOrder] = useState<SortOrder>("desc");

  function handleLedgerSort(field: LedgerSortField) {
    if (ledgerSortField === field) {
      setLedgerSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setLedgerSortField(field);
      setLedgerSortOrder(field === "name" ? "asc" : "desc");
    }
  }

  // Open-voucher peek (nested under each expanded customer) sorting
  const [voucherSortField, setVoucherSortField] = useState<VoucherSortField>("createdAt");
  const [voucherSortOrder, setVoucherSortOrder] = useState<SortOrder>("desc");

  function handleVoucherSort(field: VoucherSortField) {
    if (voucherSortField === field) {
      setVoucherSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setVoucherSortField(field);
      setVoucherSortOrder("desc");
    }
  }

  function sortVouchers(list: Debt[]) {
    const remainingOf = (d: Debt) => parseFloat(d.remainingAmount || d.amount || "0");
    return [...list].sort((a, b) => {
      if (voucherSortField === "dueDate") {
        return compareValues(a.dueDate ? new Date(a.dueDate).getTime() : 0, b.dueDate ? new Date(b.dueDate).getTime() : 0, voucherSortOrder);
      }
      if (voucherSortField === "createdAt") {
        return compareValues(a.createdAt ? new Date(a.createdAt).getTime() : 0, b.createdAt ? new Date(b.createdAt).getTime() : 0, voucherSortOrder);
      }
      if (voucherSortField === "amount") {
        return compareValues(parseFloat(a.amount || "0"), parseFloat(b.amount || "0"), voucherSortOrder);
      }
      return compareValues(remainingOf(a), remainingOf(b), voucherSortOrder);
    });
  }

  const loadData = useCallback(async () => {
    try {
      const [custList, debtList, sum] = await Promise.all([
        getCustomers(activeShopId),
        getDebts(activeShopId),
        getDebtSummary(activeShopId),
      ]);
      setCustomers(custList);
      setDebts(debtList);
      setSummary(sum);
      setLoadError(false);
    } catch (err) {
      console.warn("Error loading debts data:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map individual debts by customer ID
  const debtsByCustomerId = useMemo(() => {
    const map: Record<string, Debt[]> = {};
    debts.forEach((d) => {
      const cId = d.customerId;
      if (!cId) return;
      if (!map[cId]) map[cId] = [];
      map[cId].push(d);
    });
    return map;
  }, [debts]);

  // Filtered Customers (Customer-First Ledger)
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const custDebts = debtsByCustomerId[cust.id] || [];
      const calculatedDebt = custDebts.reduce(
        (sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"),
        0,
      );
      const debt = calculatedDebt > 0 ? calculatedDebt : parseFloat(cust.debtBalance || "0");
      const hasOverdueDebt = custDebts.some(
        (d) => d.status === "OVERDUE" || (d.status !== "PAID" && d.dueDate && new Date(d.dueDate) < new Date()),
      );
      const isOverdue = hasOverdueDebt || cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");

      if (customerFilter === "OVERDUE" && (!isOverdue || debt <= 0)) return false;
      if (customerFilter === "ACTIVE" && debt <= 0) return false;
      if (customerFilter === "PAID" && debt > 0) return false;

      if (customerSearch.trim()) {
        const q = customerSearch.toLowerCase();
        return (
          cust.name.toLowerCase().includes(q) ||
          cust.phone?.toLowerCase().includes(q) ||
          cust.customerId?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customers, debtsByCustomerId, customerFilter, customerSearch]);

  // Sorted Customers (Customer-First Ledger)
  const sortedCustomers = useMemo(() => {
    const metrics = new Map<
      string,
      { name: string; openDebts: number; balance: number; creditLimit: number; repaid: number; status: number }
    >();
    for (const cust of filteredCustomers) {
      const custDebts = debtsByCustomerId[cust.id] || [];
      const calculatedDebt = custDebts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);
      const balance = calculatedDebt > 0 ? calculatedDebt : parseFloat(cust.debtBalance || "0");
      const repaid = custDebts.reduce((sum, d) => sum + parseFloat(d.paidAmount || "0"), 0);
      const hasOverdueDebt = custDebts.some(
        (d) => d.status === "OVERDUE" || (d.status !== "PAID" && d.dueDate && new Date(d.dueDate) < new Date()),
      );
      const isOverdue = hasOverdueDebt || cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");
      metrics.set(cust.id, {
        name: cust.name.toLowerCase(),
        openDebts: custDebts.filter((d) => parseFloat(d.remainingAmount || d.amount || "0") > 0).length,
        balance,
        creditLimit: parseFloat(String(cust.creditLimit || "5000")),
        repaid: repaid > 0 ? repaid : parseFloat(String(cust.totalPaid || "0")),
        // Overdue ranks highest, then active debt, then settled
        status: balance > 0 ? (isOverdue ? 2 : 1) : 0,
      });
    }
    return [...filteredCustomers].sort((a, b) =>
      compareValues(metrics.get(a.id)![ledgerSortField], metrics.get(b.id)![ledgerSortField], ledgerSortOrder),
    );
  }, [filteredCustomers, debtsByCustomerId, ledgerSortField, ledgerSortOrder]);

  // Filtered Debts List
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const remaining = parseFloat(d.remainingAmount || d.amount || "0");
      const isPaid = d.status === "PAID" || remaining <= 0;
      const isOverdue = d.status === "OVERDUE" || (!isPaid && d.dueDate && new Date(d.dueDate) < new Date());

      if (debtFilter === "PAID" && !isPaid) return false;
      if (debtFilter === "PENDING" && (d.status !== "PENDING" || isPaid)) return false;
      if (debtFilter === "PARTIAL" && (d.status !== "PARTIAL" || isPaid)) return false;
      if (debtFilter === "OVERDUE" && (!isOverdue || isPaid)) return false;
      if (debtFilter === "DUE_THIS_WEEK") {
        if (isPaid || !d.dueDate) return false;
        const due = new Date(d.dueDate);
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (due < now || due > in7Days) return false;
      }

      if (debtSearch.trim()) {
        const q = debtSearch.toLowerCase();
        return (
          d.id.toLowerCase().includes(q) ||
          d.customerName?.toLowerCase().includes(q) ||
          d.customerPhone?.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [debts, debtFilter, debtSearch]);

  // Sorted Debts List
  const sortedAndFilteredDebts = useMemo(() => {
    return [...filteredDebts].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      if (debtSortField === "dueDate") {
        valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      } else if (debtSortField === "createdAt") {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (debtSortField === "remainingAmount") {
        valA = parseFloat(a.remainingAmount || a.amount || "0");
        valB = parseFloat(b.remainingAmount || b.amount || "0");
      } else if (debtSortField === "amount") {
        valA = parseFloat(a.amount || "0");
        valB = parseFloat(b.amount || "0");
      } else if (debtSortField === "paidAmount") {
        valA = parseFloat(a.paidAmount || "0");
        valB = parseFloat(b.paidAmount || "0");
      } else if (debtSortField === "status") {
        valA = (a.status || "").toLowerCase();
        valB = (b.status || "").toLowerCase();
      } else if (debtSortField === "customerName") {
        valA = (a.customerName || "").toLowerCase();
        valB = (b.customerName || "").toLowerCase();
      }

      if (valA < valB) return debtSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return debtSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredDebts, debtSortField, debtSortOrder]);

  const ledgerPager = usePagination(sortedCustomers, 15);
  const debtsPager = usePagination(sortedAndFilteredDebts, 15);

  // Visible unpaid debts in table for select-all logic
  const visibleUnpaidDebts = useMemo(() => {
    return sortedAndFilteredDebts.filter((d) => {
      const rem = parseFloat(d.remainingAmount || d.amount || "0");
      return d.status !== "PAID" && rem > 0;
    });
  }, [sortedAndFilteredDebts]);

  const selectedTableDebts = useMemo(() => {
    return debts.filter((d) => selectedTableDebtIds.includes(d.id));
  }, [debts, selectedTableDebtIds]);

  const selectedTableSum = useMemo(() => {
    return selectedTableDebts.reduce(
      (sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"),
      0,
    );
  }, [selectedTableDebts]);

  const selectedTableCustomerIds = useMemo(() => {
    return Array.from(new Set(selectedTableDebts.map((d) => d.customerId)));
  }, [selectedTableDebts]);

  function handleExportCustomerLedger() {
    exportToCsv("customer-debt-ledger", filteredCustomers, [
      { header: t("debts.csvCustomerId"), formatter: (c) => c.customerId || "CUST-001" },
      { header: t("debts.csvCustomerName"), key: "name" },
      { header: t("shared.phone"), key: "phone" },
      {
        header: t("debts.csvOutstandingEtb"),
        formatter: (c) => {
          const cDebts = debtsByCustomerId[c.id] || [];
          const rem = cDebts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);
          return (rem > 0 ? rem : parseFloat(String(c.debtBalance || "0"))).toFixed(2);
        },
      },
      {
        header: t("debts.csvCreditLimitEtb"),
        formatter: (c) => parseFloat(String(c.creditLimit || "5000")).toFixed(2),
      },
      { header: t("shared.status"), formatter: (c) => c.status || t("debts.statusActive") },
    ]);
  }

  function handleExportDebts() {
    exportToCsv("debt-records-ledger", sortedAndFilteredDebts, [
      { header: t("debts.csvDebtId"), key: "id" },
      { header: t("debts.csvCustomerName"), formatter: (d) => d.customerName || t("debts.customer") },
      { header: t("shared.phone"), formatter: (d) => d.customerPhone || "—" },
      { header: t("debts.csvTotalEtb"), formatter: (d) => parseFloat(d.amount).toFixed(2) },
      { header: t("debts.csvPaidEtb"), formatter: (d) => parseFloat(d.paidAmount || "0").toFixed(2) },
      { header: t("debts.csvRemainingEtb"), formatter: (d) => parseFloat(d.remainingAmount || d.amount).toFixed(2) },
      { header: t("debts.dueDate"), formatter: (d) => d.dueDate || "—" },
      { header: t("shared.status"), formatter: (d) => statusLabel(t, d.status) },
      { header: t("shared.notes"), formatter: (d) => d.notes || "—" },
    ]);
  }

  if (loading) {
    return <TablePageSkeleton cards={4} />;
  }

  if (loadError && debts.length === 0 && customers.length === 0) {
    return (
      <LoadError
        what={t("debts.loadWhat")}
        onRetry={() => {
          setLoading(true);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Toolbar                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">{t("debts.title")}</h1>
          <p className="text-xs text-zinc-500">
            {t("debts.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={mainTab === "customers" ? handleExportCustomerLedger : handleExportDebts}
            className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs"
          >
            <Download className="size-3.5 text-zinc-500" />
            <span>{t("debts.exportCsv")}</span>
          </button>
          {!isCashier && (
            <button
              type="button"
              onClick={() => {
                setAddDebtPreselectedCustomer(undefined);
                setIsCreateDebtModalOpen(true);
              }}
              className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs font-medium text-zinc-800 shadow-2xs transition-all hover:bg-zinc-50 hover:text-zinc-950 active:scale-95"
            >
              <Plus className="size-3.5 text-zinc-600" />
              <span>{t("debts.addDebtVoucher")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setPaymentTargetDebt(null);
              setPaymentCustomerId(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
          >
            <Coins className="size-3.5 text-indigo-400" />
            <span>{t("debts.receivePayment")}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Top Summary Metric Cards                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <div className="rounded-xl border border-rose-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-800">
              {t("debts.totalOutstandingDebt")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md border border-rose-200/60 bg-rose-50 text-rose-700">
              <HandCoins className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
              {summary.totalOutstandingDebt.toLocaleString()}
            </span>
            <span className="font-mono text-xs font-semibold text-rose-600">{etb}</span>
          </div>
          <span className="mt-1 block text-xs text-zinc-500">{t.n("debts.acrossDebtors", summary.totalDebtors)}</span>
        </div>

        {/* Active Debtors */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {t("debts.activeDebtors")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 text-zinc-700">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {summary.totalDebtors}
            </span>
            <span className="text-xs font-medium text-zinc-500">{t("debts.customersNoun")}</span>
          </div>
          <span className="mt-1 block text-xs text-zinc-500">{t("debts.unsettledBalances")}</span>
        </div>

        {/* Collected Repayments */}
        <div className="rounded-xl border border-emerald-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              {t("debts.repaymentsRecovered")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md border border-emerald-200/60 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {summary.collectedThisMonth.toLocaleString()}
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-600">{etb}</span>
          </div>
          <span className="mt-1 block text-xs text-zinc-500">{t("debts.recoveredToDate")}</span>
        </div>

        {/* Overdue Accounts */}
        <div className="rounded-xl border border-amber-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {t("debts.overdueDebts")}
            </span>
            <div className="flex size-7 items-center justify-center rounded-md border border-amber-200/60 bg-amber-50 text-amber-700">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {summary.overdueCount}
            </span>
            <span className="text-xs font-medium text-zinc-500">{t("debts.vouchersNoun")}</span>
          </div>
          <span className="mt-1 block text-xs text-zinc-500">{t("debts.pastDueDate")}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Customer-First Dual Tab Switcher                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 flex-wrap items-center gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMainTab("customers")}
          className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            mainTab === "customers"
              ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80 font-semibold"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
          }`}
        >
          <Users className="size-3.5" />
          <span>{t("debts.tabCustomerLedger")}</span>
          <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.2 font-mono text-[10px] tabular-nums text-zinc-600">
            {customers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("debts")}
          className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            mainTab === "debts"
              ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80 font-semibold"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
          }`}
        >
          <Receipt className="size-3.5" />
          <span>{t("debts.tabAllRecords")}</span>
          <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.2 font-mono text-[10px] tabular-nums text-zinc-600">
            {debts.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Tab 1 Content: Customer-First Master-Detail Ledger              */}
      {/* ------------------------------------------------------------------ */}
      {mainTab === "customers" && (
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 px-3.5 sm:px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setCustomerFilter("ALL")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  customerFilter === "ALL" ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80 font-semibold" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
              >
                {t("debts.filterAllCustomers")}
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("ACTIVE")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  customerFilter === "ACTIVE" ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80 font-semibold" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
              >
                {t("debts.activeDebtors")}
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("OVERDUE")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  customerFilter === "OVERDUE" ? "bg-white text-rose-700 shadow-2xs border border-zinc-200/80 font-semibold" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
              >
                {t("debts.statusOverdue")}
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("PAID")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  customerFilter === "PAID" ? "bg-white text-emerald-700 shadow-2xs border border-zinc-200/80 font-semibold" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                }`}
              >
                {t("debts.filterSettledClear")}
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={t("debts.searchCustomer")}
                className="h-8 w-full rounded-md border border-zinc-200/80 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <tr>
                  <th className="w-9 px-3 py-3.5"></th>
                  <SortableTh label={t("debts.customerProfile")} field="name" activeField={ledgerSortField} order={ledgerSortOrder} onSort={handleLedgerSort} />
                  <th className="px-5 py-3.5">{t("debts.phoneNumber")}</th>
                  <SortableTh label={t("debts.openDebts")} field="openDebts" activeField={ledgerSortField} order={ledgerSortOrder} onSort={handleLedgerSort} align="center" />
                  <SortableTh label={t("debts.outstandingBalance")} field="balance" activeField={ledgerSortField} order={ledgerSortOrder} onSort={handleLedgerSort} align="right" />
                  <SortableTh label={t("debts.creditLimit")} field="creditLimit" activeField={ledgerSortField} order={ledgerSortOrder} onSort={handleLedgerSort} align="right" />
                  <SortableTh label={t("debts.totalRepaid")} field="repaid" activeField={ledgerSortField} order={ledgerSortOrder} onSort={handleLedgerSort} align="right" />
                  <SortableTh label={t("shared.status")} field="status" activeField={ledgerSortField} order={ledgerSortOrder} onSort={handleLedgerSort} />
                  <th className="px-5 py-3.5 text-right">{t("debts.ledgerActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedCustomers.length > 0 ? (
                  ledgerPager.pageItems.map((cust) => {
                    const custDebts = debtsByCustomerId[cust.id] || [];
                    const calculatedDebt = custDebts.reduce(
                      (sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"),
                      0,
                    );
                    const debt = calculatedDebt > 0 ? calculatedDebt : parseFloat(cust.debtBalance || "0");
                    const creditLimit = parseFloat(String(cust.creditLimit || "5000"));
                    const totalRepaid = custDebts.reduce((sum, d) => sum + parseFloat(d.paidAmount || "0"), 0);
                    const paidDisplay = totalRepaid > 0 ? totalRepaid : parseFloat(String(cust.totalPaid || "0"));

                    const hasOverdueDebt = custDebts.some(
                      (d) => d.status === "OVERDUE" || (d.status !== "PAID" && d.dueDate && new Date(d.dueDate) < new Date()),
                    );
                    const isOverdue = hasOverdueDebt || cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");

                    const overdueDebts = custDebts.filter(
                      (d) => d.status === "OVERDUE" || (d.status !== "PAID" && d.dueDate && new Date(d.dueDate) < new Date()),
                    );
                    let oldestOverdueDays = 0;
                    let oldestDueDate: string | null = null;
                    if (overdueDebts.length > 0) {
                      const oldestDebt = overdueDebts.reduce((min, d) => {
                        if (!min.dueDate) return d;
                        if (!d.dueDate) return min;
                        return new Date(d.dueDate) < new Date(min.dueDate) ? d : min;
                      });
                      if (oldestDebt.dueDate) {
                        oldestDueDate = oldestDebt.dueDate;
                        oldestOverdueDays = Math.max(
                          1,
                          Math.floor((new Date().getTime() - new Date(oldestDebt.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
                        );
                      }
                    } else if (cust.daysOverdue && cust.daysOverdue !== "-") {
                      oldestOverdueDays = parseInt(String(cust.daysOverdue)) || 0;
                    }

                    const openCustDebts = custDebts.filter((d) => parseFloat(d.remainingAmount || d.amount || "0") > 0);
                    const activeDebtCount = openCustDebts.length;
                    const isExpanded = expandedCustomerIds.includes(cust.id);
                    const utilizationPct = creditLimit > 0 ? Math.min(100, Math.round((debt / creditLimit) * 100)) : 0;

                    return (
                      <Fragment key={cust.id}>
                        <tr
                          onClick={() => toggleCustomerExpand(cust.id)}
                          className={`cursor-pointer transition-colors hover:bg-zinc-50/80 ${
                            isExpanded ? "bg-zinc-50/60" : ""
                          }`}
                        >
                          {/* Chevron Accordion Toggle */}
                          <td className="px-3 py-3.5" onClick={(e) => { e.stopPropagation(); toggleCustomerExpand(cust.id); }}>
                            <button
                              type="button"
                              className="flex size-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-900 transition-colors cursor-pointer"
                              title={isExpanded ? t("debts.collapseVouchers") : t("debts.expandVouchers")}
                            >
                              <ChevronRight
                                className={`size-4 transition-transform duration-200 ${
                                  isExpanded ? "rotate-90 text-zinc-900" : ""
                                }`}
                              />
                            </button>
                          </td>

                          {/* Customer Profile */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-800">
                                {cust.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-900">{cust.name}</div>
                                <div className="font-mono text-[11px] text-zinc-400">{cust.customerId || "CUST-001"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-5 py-3.5 font-mono text-zinc-600">{cust.phone || "—"}</td>

                          {/* Open Debts Count */}
                          <td className="px-5 py-3.5 text-center">
                            {activeDebtCount > 0 ? (
                              <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-800 border border-amber-200/60">
                                {t.n("debts.voucherCount", activeDebtCount)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-zinc-400">{t("shared.none")}</span>
                            )}
                          </td>

                          {/* Outstanding Balance */}
                          <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                            <span className={debt > 0 ? (isOverdue ? "text-rose-600 font-bold" : "text-red-600") : "text-emerald-600"}>
                              {debt.toLocaleString()} {etb}
                            </span>
                          </td>

                          {/* Credit Limit */}
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-zinc-600 tabular-nums">
                            {creditLimit.toLocaleString()} {etb}
                          </td>

                          {/* Total Repaid */}
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-emerald-600 tabular-nums">
                            {paidDisplay.toLocaleString()} {etb}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            {debt === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 border border-emerald-200/60">
                                <Check className="size-3" /> {t("debts.statusSettled")}
                              </span>
                            ) : isOverdue ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 border border-rose-200/60">
                                  <AlertCircle className="size-3" /> {oldestOverdueDays > 0 ? t("debts.overdueDays", { days: oldestOverdueDays }) : t("debts.statusOverdue")}
                                </span>
                                {oldestDueDate && (
                                  <span className="text-[10px] text-zinc-400 font-mono">{t("debts.due")}: {oldestDueDate}</span>
                                )}
                              </div>
                            ) : paidDisplay > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-700 border border-blue-200/60">
                                <Clock className="size-3" /> {t("debts.statusPartial")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 border border-amber-200/60">
                                <Clock className="size-3" /> {t("debts.statusPending")}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {!isCashier && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddDebtPreselectedCustomer(cust.id);
                                    setIsCreateDebtModalOpen(true);
                                  }}
                                  className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                  title={t("debts.addDebtVoucher")}
                                >
                                  <Plus className="size-3" />
                                  {t("debts.addDebtShort")}
                                </button>
                              )}

                              {debt > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentTargetDebt(null);
                                    setPaymentCustomerId(cust.id);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white shadow-2xs hover:bg-slate-800"
                                  title={t("debts.receivePayment")}
                                >
                                  <Coins className="size-3 text-indigo-400" />
                                  {t("debts.payAll")}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setCustomerHistory(cust)}
                                className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                title={t("debts.chronologicalLedger")}
                              >
                                <Receipt className="size-3 text-zinc-500" />
                                {t("debts.ledger")}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Sub-Row: Credit Health Bar & Open Vouchers Peek */}
                        {isExpanded && (
                          <tr className="border-b border-zinc-200 bg-zinc-50/70">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* Credit Health & Limit Progress */}
                                <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-zinc-900">{t("debts.creditHealthLimit")}</span>
                                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700">
                                        {t("debts.utilized", { percent: utilizationPct })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="text-zinc-500">
                                        {t("debts.outstandingLabel")}: <strong className="font-mono text-red-600">{debt.toLocaleString()} {etb}</strong>
                                      </span>
                                      <span className="text-zinc-300">•</span>
                                      <span className="text-zinc-500">
                                        {t("debts.limit")}: <strong className="font-mono text-zinc-800">{creditLimit.toLocaleString()} {etb}</strong>
                                      </span>
                                      <span className="text-zinc-300">•</span>
                                      <span className="text-zinc-500">
                                        {t("debts.available")}:{" "}
                                        <strong className="font-mono text-emerald-600">
                                          {Math.max(0, creditLimit - debt).toLocaleString()} {etb}
                                        </strong>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                      className={`h-full transition-all duration-300 ${
                                        utilizationPct >= 85
                                          ? "bg-rose-500"
                                          : utilizationPct >= 60
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${utilizationPct}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Open Vouchers Peek */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Receipt className="size-3.5 text-zinc-500" />
                                      <span className="text-xs font-bold text-zinc-900">
                                        {t("debts.openDebtVouchers", { count: openCustDebts.length })}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setCustomerHistory(cust)}
                                      className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 underline"
                                    >
                                      {t.n("debts.viewHistory", custDebts.length)}
                                    </button>
                                  </div>

                                  {openCustDebts.length > 0 ? (
                                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                                      <table className="w-full text-left text-xs">
                                        <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600">
                                          <tr>
                                            <th className="px-4 py-2">{t("debts.voucherId")}</th>
                                            <SortableTh label={t("debts.created")} field="createdAt" activeField={voucherSortField} order={voucherSortOrder} onSort={handleVoucherSort} className="px-4 py-2" />
                                            <SortableTh label={t("debts.dueDate")} field="dueDate" activeField={voucherSortField} order={voucherSortOrder} onSort={handleVoucherSort} className="px-4 py-2" />
                                            <th className="px-4 py-2">{t("debts.itemsNotes")}</th>
                                            <SortableTh label={t("debts.original")} field="amount" activeField={voucherSortField} order={voucherSortOrder} onSort={handleVoucherSort} align="right" className="px-4 py-2" />
                                            <SortableTh label={t("debts.remainingDue")} field="remaining" activeField={voucherSortField} order={voucherSortOrder} onSort={handleVoucherSort} align="right" className="px-4 py-2" />
                                            <th className="px-4 py-2 text-right">{t("debts.action")}</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                          {sortVouchers(openCustDebts).map((d) => {
                                            const total = parseFloat(d.amount || "0");
                                            const paid = parseFloat(d.paidAmount || "0");
                                            const remaining = parseFloat(d.remainingAmount || String(Math.max(0, total - paid)));
                                            const isVoucherOverdue = d.status === "OVERDUE" || (d.dueDate && new Date(d.dueDate) < new Date());
                                            const shortId = d.id.includes("-") ? d.id.split("-").pop()?.toUpperCase() : d.id.slice(-6).toUpperCase();

                                            return (
                                              <tr key={d.id} className="hover:bg-zinc-50/60">
                                                <td className="px-4 py-2.5 font-mono font-bold text-zinc-900">
                                                  #{shortId}
                                                </td>
                                                <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                                                  {d.createdAt ? formatDate(d.createdAt, { month: "short", day: "numeric" }) : "—"}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                  {d.dueDate ? (
                                                    <span className={isVoucherOverdue ? "font-semibold text-rose-600" : "text-zinc-600"}>
                                                      {d.dueDate} {isVoucherOverdue && `(${t("debts.statusOverdue")})`}
                                                    </span>
                                                  ) : (
                                                    <span className="text-zinc-400">—</span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-2.5 text-zinc-600 max-w-xs truncate">
                                                  {d.items && d.items.length > 0
                                                    ? d.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")
                                                    : d.notes || "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono text-zinc-500">
                                                  {total.toLocaleString()} {etb}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">
                                                  {remaining.toLocaleString()} {etb}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setPaymentTargetDebt(d);
                                                      setPaymentCustomerId(cust.id);
                                                      setIsPaymentModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-slate-800 active:scale-95"
                                                  >
                                                    <Coins className="size-3 text-indigo-400" /> {t("debts.payVoucher")}
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-center text-xs text-zinc-400">
                                      {t("debts.allSettledFor", { name: cust.name })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-zinc-400">
                      {t("debts.noCustomersFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination pagination={ledgerPager} noun={t("debts.customersLower")} />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. Tab 2 Content: All Debt Records                                 */}
      {/* ------------------------------------------------------------------ */}
      {mainTab === "debts" && (
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 px-3.5 sm:px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 flex-wrap items-center gap-1 text-xs">
              {(
                [
                  { id: "ALL", label: t("debts.allDebts") },
                  { id: "OVERDUE", label: t("debts.statusOverdue") },
                  { id: "DUE_THIS_WEEK", label: t("debts.dueThisWeek") },
                  { id: "PENDING", label: t("debts.statusPending") },
                  { id: "PARTIAL", label: t("debts.statusPartial") },
                  { id: "PAID", label: t("debts.statusSettled") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDebtFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    debtFilter === tab.id
                      ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200/80 font-semibold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={debtSearch}
                onChange={(e) => setDebtSearch(e.target.value)}
                placeholder={t("debts.searchDebt")}
                className="h-8 w-full rounded-md border border-zinc-200/80 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Debts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        visibleUnpaidDebts.length > 0 &&
                        visibleUnpaidDebts.every((d) => selectedTableDebtIds.includes(d.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const unpaidIds = visibleUnpaidDebts.map((d) => d.id);
                          setSelectedTableDebtIds((prev) => Array.from(new Set([...prev, ...unpaidIds])));
                        } else {
                          const unpaidSet = new Set(visibleUnpaidDebts.map((d) => d.id));
                          setSelectedTableDebtIds((prev) => prev.filter((id) => !unpaidSet.has(id)));
                        }
                      }}
                      className="size-4 rounded border-zinc-300 text-zinc-950 focus:ring-0 cursor-pointer"
                      title={t("debts.selectAllVisibleUnpaid")}
                    />
                  </th>
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("createdAt")}
                      className="flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>{t("debts.debtReference")}</span>
                      {debtSortField === "createdAt" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("customerName")}
                      className="flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>{t("debts.customer")}</span>
                      {debtSortField === "customerName" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("amount")}
                      className="ml-auto flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>{t("debts.originalAmount")}</span>
                      {debtSortField === "amount" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <SortableTh label={t("debts.amountPaid")} field="paidAmount" activeField={debtSortField} order={debtSortOrder} onSort={handleDebtSort} align="right" className="px-5 py-3.5 text-zinc-600" />
                  <th className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("remainingAmount")}
                      className="ml-auto flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>{t("debts.remainingDue")}</span>
                      {debtSortField === "remainingAmount" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("dueDate")}
                      className="flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>{t("debts.dueDate")}</span>
                      {debtSortField === "dueDate" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <SortableTh label={t("shared.status")} field="status" activeField={debtSortField} order={debtSortOrder} onSort={handleDebtSort} className="px-5 py-3.5 text-zinc-600" />
                  <th className="px-5 py-3.5 text-right font-semibold text-zinc-600">{t("shared.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedAndFilteredDebts.length > 0 ? (
                  debtsPager.pageItems.map((debt) => {
                    const totalAmount = parseFloat(debt.amount || "0");
                    const paid = parseFloat(debt.paidAmount || "0");
                    const remaining = parseFloat(debt.remainingAmount || String(Math.max(0, totalAmount - paid)));
                    const isPaid = debt.status === "PAID" || remaining <= 0;
                    const isOverdue = debt.status === "OVERDUE" || (!isPaid && debt.dueDate && new Date(debt.dueDate) < new Date());
                    const isSelected = selectedTableDebtIds.includes(debt.id);

                    return (
                      <tr
                        key={debt.id}
                        className={`transition-colors hover:bg-zinc-50/70 ${
                          isSelected ? "bg-zinc-50/90" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3.5">
                          {!isPaid ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedTableDebtIds((prev) =>
                                  prev.includes(debt.id)
                                    ? prev.filter((id) => id !== debt.id)
                                    : [...prev, debt.id]
                                );
                              }}
                              className="size-4 rounded border-zinc-300 text-zinc-950 focus:ring-0 cursor-pointer"
                            />
                          ) : (
                            <span className="size-4 block" />
                          )}
                        </td>

                        {/* Debt ID */}
                        <td className="px-5 py-3.5">
                          <div className="font-mono font-bold text-zinc-900">{debt.id}</div>
                          {debt.notes && (
                            <div className="max-w-[200px] truncate text-[11px] text-zinc-500" title={debt.notes}>
                              {debt.notes}
                            </div>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-zinc-900">{debt.customerName || t("debts.customer")}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{debt.customerPhone || "—"}</div>
                        </td>

                        {/* Original Debt */}
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-zinc-800 tabular-nums">
                          {totalAmount.toLocaleString()} {etb}
                        </td>

                        {/* Amount Paid */}
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600 tabular-nums">
                          {paid.toLocaleString()} {etb}
                        </td>

                        {/* Remaining Balance */}
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              isPaid ? "text-zinc-400" : "text-red-600"
                            }`}
                          >
                            {remaining.toLocaleString()} {etb}
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-3.5 text-zinc-600">
                          <div>
                            {debt.dueDate ? formatDate(debt.dueDate) : "—"}
                          </div>
                          {isOverdue && !isPaid && (
                            <span className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                              {t("debts.statusOverdue")}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="size-3" /> {t("debts.statusPaid")}
                            </span>
                          ) : debt.status === "PARTIAL" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-blue-700 border border-blue-200/60">
                              <Clock className="size-3" /> {t("debts.statusPartial")}
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-rose-700 border border-rose-200/60">
                              <AlertCircle className="size-3" /> {t("debts.statusOverdue")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-700 border border-amber-200/60">
                              <Clock className="size-3" /> {t("debts.statusPending")}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDebtDetail(debt)}
                              className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                              title={t("debts.auditTrail")}
                            >
                              <Receipt className="size-3.5 text-zinc-500" />
                              {t("debts.history")}
                            </button>

                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentTargetDebt(debt);
                                  setPaymentTargetDebts(null);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
                                title={t("debts.settleOrReceive")}
                              >
                                <Coins className="size-3 text-indigo-400" />
                                {t("debts.pay")}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 text-[11px] font-bold text-emerald-600">
                                <Check className="size-3.5" /> {t("debts.statusSettled")}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-zinc-400">
                      {t("debts.noDebtRecords")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination pagination={debtsPager} noun={t("debts.loadWhat")} />

          {/* Floating Batch Action Bar when ≥1 debt is selected */}
          {selectedTableDebtIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-xl bg-slate-900 px-4 sm:px-5 py-2.5 sm:py-3 text-white shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
                <span className="flex size-5.5 items-center justify-center rounded-md bg-white text-zinc-950 font-bold text-xs font-mono">
                  {selectedTableDebtIds.length}
                </span>
                <span className="text-xs font-semibold">
                  {t.n("debts.debtVouchersSelected", selectedTableDebtIds.length)}
                </span>
              </div>

              <div className="font-mono text-xs font-bold text-indigo-400 tabular-nums">
                {selectedTableSum.toLocaleString()} {etb}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTableDebtIds([])}
                  className="rounded-md px-2.5 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  {t("debts.clear")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTableCustomerIds.length === 1) {
                      setPaymentTargetDebt(null);
                      setPaymentTargetDebts(selectedTableDebts);
                      setPaymentCustomerId(selectedTableCustomerIds[0]);
                      setIsPaymentModalOpen(true);
                    } else {
                      setIsBatchModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-950 shadow-2xs hover:bg-zinc-100 active:scale-95 cursor-pointer"
                >
                  <Coins className="size-3.5 text-zinc-950" />
                  {t("debts.settleSelected", { amount: selectedTableSum.toLocaleString() })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. Modals                                                          */}
      {/* ------------------------------------------------------------------ */}
      {selectedDebtDetail && (
        <DebtDetailModal
          debt={selectedDebtDetail}
          onClose={() => setSelectedDebtDetail(null)}
          onOpenPayment={(debt) => {
            setSelectedDebtDetail(null);
            setPaymentTargetDebt(debt);
            setIsPaymentModalOpen(true);
          }}
        />
      )}

      {customerHistory && (
        <CustomerDebtHistoryModal
          customer={customerHistory}
          customerDebts={debtsByCustomerId[customerHistory.id] || []}
          onClose={() => setCustomerHistory(null)}
          onOpenPayment={(cust, debt, multipleDebts) => {
            setCustomerHistory(null);
            setPaymentTargetDebt(debt || null);
            setPaymentTargetDebts(multipleDebts || null);
            setPaymentCustomerId(cust.id);
            setIsPaymentModalOpen(true);
          }}
          onOpenAddDebt={(cust) => {
            setCustomerHistory(null);
            setAddDebtPreselectedCustomer(cust.id);
            setIsCreateDebtModalOpen(true);
          }}
          isCashier={isCashier}
        />
      )}

      {isPaymentModalOpen && (
        <ReceivePaymentModal
          customers={customers}
          targetDebt={paymentTargetDebt}
          targetDebts={paymentTargetDebts}
          allDebts={debts}
          initialCustomerId={paymentCustomerId || undefined}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentTargetDebt(null);
            setPaymentTargetDebts(null);
            setPaymentCustomerId(null);
          }}
          onSuccess={(settledDebtIds, newBal, updatedDebtsList) => {
            setIsPaymentModalOpen(false);
            setPaymentTargetDebt(null);
            setPaymentTargetDebts(null);
            setPaymentCustomerId(null);
            setSelectedTableDebtIds([]);

            if (Array.isArray(settledDebtIds) && settledDebtIds.length > 0) {
              setDebts((prev) =>
                prev.map((d) => {
                  if (settledDebtIds.includes(d.id)) {
                    const match = updatedDebtsList?.find((ud) => ud.id === d.id);
                    if (match) return match;
                    return {
                      ...d,
                      status: "PAID",
                      remainingAmount: "0.00",
                      paidAmount: d.amount,
                    };
                  }
                  return d;
                })
              );

              if (paymentCustomerId && newBal !== undefined) {
                setCustomers((prev) =>
                  prev.map((c) =>
                    c.id === paymentCustomerId ? { ...c, debtBalance: newBal.toFixed(2) } : c
                  )
                );
              }
            }

            loadData();
          }}
        />
      )}

      {isBatchModalOpen && (
        <BatchSettleModal
          debts={selectedTableDebts}
          customers={customers}
          onClose={() => setIsBatchModalOpen(false)}
          onSuccess={(settledDebtIds) => {
            setIsBatchModalOpen(false);
            setSelectedTableDebtIds([]);

            if (Array.isArray(settledDebtIds) && settledDebtIds.length > 0) {
              setDebts((prev) =>
                prev.map((d) => {
                  if (settledDebtIds.includes(d.id)) {
                    return {
                      ...d,
                      status: "PAID",
                      remainingAmount: "0.00",
                      paidAmount: d.amount,
                    };
                  }
                  return d;
                })
              );
            }

            loadData();
          }}
        />
      )}

      {!isCashier && isCreateDebtModalOpen && (
        <CreateDebtModal
          customers={customers}
          initialCustomerId={addDebtPreselectedCustomer}
          onClose={() => {
            setIsCreateDebtModalOpen(false);
            setAddDebtPreselectedCustomer(undefined);
          }}
          onSuccess={() => {
            setIsCreateDebtModalOpen(false);
            setAddDebtPreselectedCustomer(undefined);
            loadData();
          }}
        />
      )}
    </div>
  );
}
