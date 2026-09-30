"use client";

import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  HandCoins,
  Landmark,
  Package,
  Plus,
  Receipt,
  Search,
  Smartphone,
  Trash2,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createDebt, getCustomers, getDebts, getDebtSummary, recordDebtPayment, recordBatchDebtPayments } from "@/lib/api/app-data";
import type { Customer, Debt, DebtPayment, DebtSummary, DebtTransaction } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
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
  if (!debt) return null;

  const totalAmount = parseFloat(debt.amount || "0");
  const paidAmount = parseFloat(debt.paidAmount || "0");
  const remaining = parseFloat(debt.remainingAmount || String(Math.max(0, totalAmount - paidAmount)));
  const isPaid = debt.status === "PAID" || remaining <= 0;
  const payments = debt.payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="mb-5 flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">Debt Voucher Details</h2>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                {debt.id}
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 className="size-3" /> PAID
                </span>
              ) : debt.status === "PARTIAL" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200/60">
                  <Clock className="size-3" /> PARTIALLY PAID
                </span>
              ) : debt.status === "OVERDUE" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200/60">
                  <AlertCircle className="size-3" /> OVERDUE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                  <Clock className="size-3" /> PENDING
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Customer: <span className="font-semibold text-zinc-800">{debt.customerName || "Customer"}</span> • Phone:{" "}
              <span className="font-mono text-zinc-800">{debt.customerPhone || "—"}</span>
              {debt.dueDate && ` • Due: ${debt.dueDate}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Amount Breakdown Cards */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
            <span className="text-[11px] font-medium text-zinc-500">Original Debt</span>
            <p className="mt-1 text-sm font-bold text-zinc-900 font-mono tabular-nums">
              {totalAmount.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-emerald-50/50 p-3">
            <span className="text-[11px] font-medium text-emerald-700">Total Repaid</span>
            <p className="mt-1 text-sm font-bold text-emerald-700 font-mono tabular-nums">
              {paidAmount.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-red-50/50 p-3">
            <span className="text-[11px] font-medium text-red-600">Remaining Balance</span>
            <p className="mt-1 text-sm font-bold text-red-600 font-mono tabular-nums">
              {remaining.toLocaleString()} ETB
            </p>
          </div>
        </div>

        {/* Itemized Goods List (if available) */}
        {debt.items && debt.items.length > 0 && (
          <div className="mb-4 rounded-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-3.5 py-2 border-b border-zinc-200 text-xs font-semibold text-zinc-800">
              Itemized Products ({debt.items.length})
            </div>
            <div className="divide-y divide-zinc-100 text-xs">
              {debt.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2">
                  <div>
                    <span className="font-semibold text-zinc-900">{item.name}</span>
                    <span className="text-zinc-400 ml-2">× {item.quantity}</span>
                  </div>
                  <div className="font-mono font-medium text-zinc-800">
                    {(item.totalPrice || (item.unitPrice || 0) * item.quantity).toLocaleString()} ETB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {debt.notes && (
          <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">Notes / Purpose:</span> {debt.notes}
          </div>
        )}

        {/* Payments History Table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900">Payment Installments ({payments.length})</h3>
            {!isPaid && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(debt);
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#4d7c0f] hover:underline"
              >
                <Plus className="size-3" /> Record Payment
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-zinc-200 bg-zinc-50 font-medium text-zinc-600">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Method / Tender</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {payments.length > 0 ? (
                  payments.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-zinc-50/60">
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-700">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-800">
                          {p.paymentMethod || "Cash"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-zinc-600">
                        {p.reference || `PAY-${idx + 1}`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                        +{parseFloat(String(p.amount || "0")).toLocaleString()} ETB
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-7 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                          <Coins className="size-4" />
                        </div>
                        <p className="font-semibold text-xs text-zinc-700">No repayment installments recorded yet</p>
                        <p className="text-[11px] text-zinc-400 max-w-xs text-center">
                          {isPaid
                            ? "This debt voucher is already settled in full."
                            : "Installments will appear here automatically when payments are recorded."}
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
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Close
          </button>
          {!isPaid && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPayment(debt);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800"
            >
              <Coins className="size-3.5 text-indigo-400" />
              Receive Payment
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
function CustomerDebtHistoryModal({
  customer,
  customerDebts,
  onClose,
  onOpenPayment,
  onOpenAddDebt,
}: {
  customer: Customer | null;
  customerDebts: Debt[];
  onClose: () => void;
  onOpenPayment: (customer: Customer, debt?: Debt, multipleDebts?: Debt[]) => void;
  onOpenAddDebt: (customer: Customer) => void;
}) {
  if (!customer) return null;

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
    if (!customer) return;
    const stmt =
      `*Debt Statement - ${customer.name}*\n` +
      `Customer ID: ${customer.customerId || "CUST-001"}\n` +
      `Phone: ${customer.phone || "—"}\n` +
      `Total Outstanding: ${totalOutstanding.toLocaleString()} ETB\n` +
      `Open Vouchers: ${unpaidDebts.length}\n` +
      `Credit Limit: ${creditLimit.toLocaleString()} ETB\n` +
      `Date: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n\n` +
      (unpaidDebts.length > 0
        ? `*Pending Vouchers:*\n` +
          unpaidDebts
            .map(
              (d) =>
                `• #${d.id.slice(-6).toUpperCase()} - Remaining: ${parseFloat(
                  d.remainingAmount || d.amount || "0",
                ).toLocaleString()} ETB${d.dueDate ? ` (Due: ${d.dueDate})` : ""}`,
            )
            .join("\n")
        : `All debt vouchers currently settled in full.`);

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
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Customer Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 font-bold text-zinc-900 text-base">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900">{customer.name}</h2>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                  {customer.customerId || "CUST-001"}
                </span>
                {totalOutstanding <= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 className="size-3" /> SETTLED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 border border-red-200/60">
                    ACTIVE DEBT
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Phone: <span className="font-mono text-zinc-800">{customer.phone || "No phone"}</span>
                {customer.address && ` • ${customer.address}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyStatement}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95"
              title="Copy customer debt statement"
            >
              {copiedStatement ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-zinc-500" />
                  <span>Copy Statement</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenAddDebt(customer)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 active:scale-95"
            >
              <Plus className="size-3.5 text-zinc-500" />
              Add Debt
            </button>
            {totalOutstanding > 0 && (
              <button
                type="button"
                onClick={() => onOpenPayment(customer)}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
              >
                <Coins className="size-3.5 text-indigo-400" />
                Receive Payment
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">Current Outstanding</span>
            <p className="mt-1 font-mono text-base font-bold text-red-600 tabular-nums">
              {totalOutstanding.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">Credit Limit</span>
            <p className="mt-1 font-mono text-base font-bold text-zinc-900 tabular-nums">
              {creditLimit.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
            <span className="text-[11px] font-medium text-zinc-500">Total Credit Purchases</span>
            <p className="mt-1 font-mono text-base font-bold text-blue-600 tabular-nums">
              {totalOriginal.toLocaleString()} ETB
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-emerald-50/40 p-3.5">
            <span className="text-[11px] font-medium text-emerald-800">Total Repaid</span>
            <p className="mt-1 font-mono text-base font-bold text-emerald-700 tabular-nums">
              {totalRepaid.toLocaleString()} ETB
            </p>
          </div>
        </div>

        {/* Chronological Debt Vouchers Header */}
        <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-zinc-700" />
              <h3 className="text-xs font-bold text-zinc-900">
                Debt Vouchers &amp; Purchases ({displayedDebts.length})
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
                All ({sortedDebts.length})
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
                Unpaid Only ({unpaidDebts.length})
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
                  ? "Deselect All"
                  : `Select All Unpaid (${unpaidDebts.length})`}
              </button>
            )}
            <span className="text-[11px] text-zinc-400">All credit vouchers &amp; repayments</span>
          </div>
        </div>

        {/* Chronological Debt Vouchers List */}
        <div className="space-y-3.5">
          {displayedDebts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-400 text-xs">
              {historyFilter === "UNPAID"
                ? `No unpaid vouchers for ${customer.name}. All debt accounts are settled!`
                : `No debt vouchers recorded for ${customer.name}.`}
            </div>
          ) : (
            displayedDebts.map((d) => {
                const totalAmt = parseFloat(d.amount || "0");
                const paidAmt = parseFloat(d.paidAmount || "0");
                const remAmt = parseFloat(d.remainingAmount || String(Math.max(0, totalAmt - paidAmt)));
                const isPaid = d.status === "PAID" || remAmt <= 0;
                const isOverdue = d.status === "OVERDUE" || (!isPaid && d.dueDate && new Date(d.dueDate) < new Date());
                const debtPayments = d.payments || [];

                const shortVoucherId = d.id.includes("-")
                  ? `Voucher #${d.id.split("-").pop()?.toUpperCase()}`
                  : `Voucher #${d.id.slice(-6).toUpperCase()}`;

                return (
                  <div
                    key={d.id}
                    className={`rounded-2xl border bg-white p-4 shadow-2xs transition-all ${
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
                            title="Select voucher for batch payment"
                          />
                        )}
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-800"
                          title={`Full Debt ID: ${d.id}`}
                        >
                          <Receipt className="size-3 text-zinc-500" />
                          {shortVoucherId}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </span>
                        {isPaid ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            PAID
                          </span>
                        ) : d.status === "PARTIAL" ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                            PARTIAL
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                            PENDING
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {d.dueDate && (
                          <span className="text-[11px] text-zinc-500">
                            Due: <span className="font-semibold text-zinc-800">{new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          </span>
                        )}
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => onOpenPayment(customer, d)}
                            className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95"
                          >
                            <Coins className="size-3 text-indigo-400" />
                            Pay This Debt
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial details per debt voucher */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase">Original Amount</span>
                        <p className="font-mono font-bold text-zinc-900">{totalAmt.toLocaleString()} ETB</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase">Repaid Amount</span>
                        <p className="font-mono font-bold text-emerald-600">{paidAmt.toLocaleString()} ETB</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-zinc-400 uppercase">Remaining Due</span>
                        <p className={`font-mono font-bold ${remAmt > 0 ? "text-red-600" : "text-zinc-500"}`}>
                          {remAmt.toLocaleString()} ETB
                        </p>
                      </div>
                    </div>

                    {/* Itemized Goods (if any) */}
                    {d.items && d.items.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-2.5">
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-zinc-700">
                          <span className="flex items-center gap-1.5">
                            <Package className="size-3.5 text-zinc-500" />
                            <span>Purchased Items ({d.items.length})</span>
                          </span>
                        </div>
                        <div className="divide-y divide-zinc-200/60 rounded-lg border border-zinc-200/70 bg-white text-xs">
                          {d.items.map((it, idx) => {
                            const itemName = it.name && it.name !== "Product" ? it.name : (it as any).product?.name || it.name || "Item";
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
                                    {lineTotal > 0 ? `${lineTotal.toLocaleString()} ETB` : "—"}
                                  </span>
                                  {unitPrice > 0 && it.quantity > 1 && (
                                    <span className="block text-[10px] text-zinc-400">
                                      (@ {unitPrice.toLocaleString()} ETB)
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
                          <span>Purchased Goods &amp; Notes</span>
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
                        <span className="text-[11px] font-bold text-zinc-700">Repayment Installments:</span>
                        <div className="mt-1 space-y-1">
                          {debtPayments.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="flex items-center justify-between rounded-lg bg-zinc-50/80 px-2.5 py-1 text-[11px] text-zinc-600"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-zinc-500">{p.reference || `PAY-${idx + 1}`}</span>
                                <span className="rounded bg-zinc-200/70 px-1.5 py-0.2 font-medium text-zinc-800">
                                  {p.paymentMethod || "Cash"}
                                </span>
                                <span>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-600">
                                +{parseFloat(String(p.amount || 0)).toLocaleString()} ETB
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
                {selectedHistoryDebtIds.length === 1 ? "1 voucher selected" : `${selectedHistoryDebtIds.length} vouchers selected`}
              </span>
              <span className="font-mono text-xs font-bold text-indigo-400">
                {selectedHistoryDebtsSum.toLocaleString()} ETB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedHistoryDebtIds([])}
                className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Clear
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
                Pay Selected Debts
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
            Close
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
      setErrorMsg("Please select a customer and enter a valid debt amount.");
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
          : "Failed to record debt.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Add Debt Voucher for Customer</h2>
            <p className="text-xs text-zinc-500">Record itemized credit goods or standalone customer debt</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
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
            <label className="mb-1 block font-semibold text-zinc-700">Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || "No phone"}) — Debt: {parseFloat(c.debtBalance || "0").toLocaleString()} ETB
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Credit Limit: {parseFloat(String(selectedCustomer.creditLimit || "5000")).toLocaleString()} ETB</span>
                <span>Current Debt: {parseFloat(selectedCustomer.debtBalance || "0").toLocaleString()} ETB</span>
              </div>
            )}
          </div>

          {/* Itemized Goods Section */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800">Itemized Goods / Products</span>
              <button
                type="button"
                onClick={() => setIsItemized(!isItemized)}
                className="text-[11px] font-semibold text-zinc-600 underline"
              >
                {isItemized ? "Switch to Simple Amount" : "Itemize Products"}
              </button>
            </div>

            {isItemized ? (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Item name (e.g. Bread)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value, 10) || 1)}
                      className="h-8 w-14 rounded-lg border border-zinc-200 bg-white px-2 text-center text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="h-8 w-20 rounded-lg border border-zinc-200 bg-white px-2 text-right text-xs font-mono text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
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
                  <Plus className="size-3" /> Add Another Item
                </button>
              </div>
            ) : null}
          </div>

          {/* Debt Amount Input */}
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">Total Debt Amount (ETB) *</label>
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
                ETB
              </span>
            </div>
          </div>

          {/* Due Date & Purpose Notes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-zinc-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-zinc-700">Notes / Agreement</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Month-end repayment"
                className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Record Debt Voucher"}
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
  const [reference, setReference] = useState(`PAY-${Math.floor(1000 + Math.random() * 9000)}`);
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
      setErrorMsg("Please select a customer.");
      return;
    }
    if (payVal <= 0) {
      setErrorMsg("Payment amount must be greater than zero.");
      return;
    }
    if (payVal > targetCeiling + 0.05) {
      setErrorMsg(`Payment cannot exceed the selected balance of ${targetCeiling.toLocaleString()} ETB.`);
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
      setErrorMsg("Failed to record debt payment. Please check values.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 font-bold">
              <Coins className="size-4 text-zinc-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  {targetDebt
                    ? "Settle Debt Voucher"
                    : selectedDebtIds.length > 1
                    ? `Settle Multiple Vouchers (${selectedDebtIds.length})`
                    : "Receive Debt Payment"}
                </h2>
                {targetDebt && (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-700">
                    #{targetDebt.id.slice(-6).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {selectedCustomer
                  ? `${selectedCustomer.name} • ${selectedCustomer.phone || "No phone"} • ${customerOpenDebts.length} open vouchers`
                  : "Choose customer to settle debt vouchers"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Debtor Profile</span>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {selectedCustomer?.name || targetDebt?.customerName || targetDebts?.[0]?.customerName || "Customer"}
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
                      <span className="text-zinc-500">Credit Limit Utilization</span>
                      <span className="font-mono font-semibold text-zinc-800">
                        {creditUtilizationPct}% ({totalCustomerDebt.toLocaleString()} / {creditLimit.toLocaleString()} ETB)
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
                <div className="space-y-2 rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Select Debtor Customer *
                  </label>
                  <select
                    value={selectedCustId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 font-semibold text-zinc-900 focus:border-slate-900 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {parseFloat(c.debtBalance || "0").toLocaleString()} ETB Debt ({c.phone || "No phone"})
                      </option>
                    ))}
                  </select>

                  {selectedCustomer && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Credit Utilization</span>
                        <span className="font-mono font-semibold text-zinc-800">
                          {creditUtilizationPct}% ({totalCustomerDebt.toLocaleString()} / {creditLimit.toLocaleString()} ETB)
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
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="mb-2.5 flex items-center justify-between border-b border-zinc-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="size-3.5 text-zinc-600" />
                      <span className="font-bold text-zinc-900 text-xs">
                        Open Vouchers ({selectedDebtIds.length}/{customerOpenDebts.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllDebts}
                        className="text-[11px] font-bold text-zinc-900 underline hover:text-black"
                      >
                        Select All
                      </button>
                      <span className="text-zinc-300">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800"
                      >
                        Clear
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
                                  OVERDUE
                                </span>
                              )}
                              {d.dueDate && (
                                <span className="text-[10px] text-zinc-400">Due: {d.dueDate}</span>
                              )}
                            </div>

                            {/* Settlement Badge */}
                            <div>
                              {!isSelected ? (
                                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                                  Not Selected
                                </span>
                              ) : alloc?.status === "FULLY_PAID" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <Check className="size-2.5" /> Fully Paid
                                </span>
                              ) : alloc?.status === "PARTIAL" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                  Partial (+{alloc.allocated.toLocaleString()} ETB)
                                </span>
                              ) : (
                                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                                  Unchanged
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
                            <span className="text-zinc-400 font-mono">Orig: {total.toLocaleString()} ETB</span>
                            <span className="font-mono font-bold text-red-600">
                              Due: {remaining.toLocaleString()} ETB
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-zinc-400 text-xs">
                  No open debt vouchers found for this customer.
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT COLUMN: Amount, Tender, Reference & Financial Summary   */}
            {/* ------------------------------------------------------------ */}
            <div className="space-y-4 md:col-span-6">
              {/* Payment Amount Card */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-900 text-xs">Payment Amount (ETB) *</label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(targetCeiling))}
                    className="text-[11px] font-bold text-zinc-900 underline hover:text-black"
                  >
                    Pay Full ({targetCeiling.toLocaleString()} ETB)
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
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3.5 pr-14 font-mono text-base font-bold text-zinc-900 focus:border-slate-900 focus:outline-none tabular-nums"
                    required
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-zinc-400">
                    ETB
                  </span>
                </div>

                {/* Quick Increment Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[100, 500, 1000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => addAmountIncrement(inc)}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      +{inc.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(String(totalCustomerDebt))}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                  >
                    Clear All Balance
                  </button>
                </div>
              </div>

              {/* 1-Tap Tender Chips */}
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs space-y-2">
                <label className="block font-bold text-zinc-900 text-xs">Payment Method / Tender</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {(
                    [
                      { id: "Cash", label: "Cash", icon: Banknote },
                      { id: "Telebirr", label: "Telebirr", icon: Smartphone },
                      { id: "CBE Bank", label: "CBE Bank", icon: Landmark },
                      { id: "Card", label: "Card", icon: CreditCard },
                      { id: "Other Bank", label: "Other Bank", icon: Landmark },
                    ] as const
                  ).map((tender) => {
                    const Icon = tender.icon;
                    const isActive = activeTenderKey === tender.id;
                    return (
                      <button
                        key={tender.id}
                        type="button"
                        onClick={() => selectTender(tender.id)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-all ${
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white font-bold shadow-xs ring-1 ring-slate-900"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
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
                    <label className="mb-1 block font-medium text-zinc-700 text-[11px]">Select Bank Name</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-900 focus:border-slate-900 focus:outline-none"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Reference & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-zinc-700 text-[11px]">Reference / Txn ID</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="PAY-0001"
                    className="h-9 w-full rounded-xl border border-zinc-200 px-2.5 font-mono text-xs text-zinc-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-zinc-700 text-[11px]">Notes (Optional)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Counter repayment"
                    className="h-9 w-full rounded-xl border border-zinc-200 px-2.5 text-xs text-zinc-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Financial Balance Ledger Summary */}
              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total Customer Debt:</span>
                  <span className="font-bold text-zinc-900 font-mono tabular-nums">
                    {totalCustomerDebt.toLocaleString()} ETB
                  </span>
                </div>
                {customerOpenDebts.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Selected Vouchers Target:</span>
                    <span className="font-bold text-red-600 font-mono tabular-nums">
                      {selectedDebtsSum.toLocaleString()} ETB ({selectedDebtIds.length} vouchers)
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Amount Paying:</span>
                  <span className="font-bold text-emerald-600 font-mono tabular-nums">
                    -{payVal.toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-xs">
                  <span className="text-zinc-900">Remaining Customer Debt:</span>
                  <span
                    className={`font-mono tabular-nums ${
                      newDebtBalance === 0 ? "text-emerald-600 font-bold" : "text-zinc-900"
                    }`}
                  >
                    {newDebtBalance.toLocaleString()} ETB
                    {newDebtBalance === 0 && " (PAID IN FULL ✓)"}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || payVal <= 0}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : newDebtBalance === 0 ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Settle &amp; Mark Paid
                    </>
                  ) : (
                    <>
                      <Coins className="size-4" />
                      Record Repayment
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
  const [reference, setReference] = useState(`BATCH-${Math.floor(1000 + Math.random() * 9000)}`);
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
      setErrorMsg("Failed to process batch settlement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Batch Settle Debts</h2>
              <p className="text-[11px] text-zinc-500">
                Settling {debts.length} vouchers across {groupedByCustomer.length} customers at once
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
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
              Customers &amp; Vouchers Included ({groupedByCustomer.length})
            </span>
            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {groupedByCustomer.map((grp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white p-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-zinc-900">
                      {grp.customer?.name || grp.debts[0].customerName || "Customer"}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-zinc-400">
                      ({grp.debts.length} {grp.debts.length === 1 ? "voucher" : "vouchers"})
                    </span>
                  </div>
                  <div className="font-mono font-bold text-red-600">
                    {grp.subtotal.toLocaleString()} ETB
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Settlement Amount Card */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 flex items-center justify-between">
            <span className="text-zinc-600 font-medium">Total Settlement Amount:</span>
            <span className="font-mono font-bold text-base text-zinc-950">
              {totalAmount.toLocaleString()} ETB
            </span>
          </div>

          {/* Tender Selector */}
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">Tender / Payment Method</label>
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
                  {method === "Cash" ? "Cash" : method === "Bank Transfer" ? "Bank" : method === "Mobile Payment" ? "Telebirr" : "Card"}
                </button>
              ))}
            </div>
          </div>

          {(paymentMethod === "Bank Transfer" || paymentMethod === "Mobile Payment") && (
            <div>
              <label className="mb-1 block font-medium text-zinc-700">Bank / Provider</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 focus:border-zinc-900 focus:outline-none"
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-700">Batch Reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-200 px-2.5 font-mono text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-zinc-700">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bulk settlement"
                className="h-9 w-full rounded-xl border border-zinc-200 px-2.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAmount <= 0}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Settle All ({totalAmount.toLocaleString()} ETB)
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
export default function DebtsPage() {
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
  const [debtSortField, setDebtSortField] = useState<
    "dueDate" | "remainingAmount" | "amount" | "createdAt" | "customerName"
  >("createdAt");
  const [debtSortOrder, setDebtSortOrder] = useState<"asc" | "desc">("desc");

  function handleDebtSort(field: "dueDate" | "remainingAmount" | "amount" | "createdAt" | "customerName") {
    if (debtSortField === field) {
      setDebtSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setDebtSortField(field);
      setDebtSortOrder("desc");
    }
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
    } catch (err) {
      console.warn("Error loading debts data:", err);
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
      } else if (debtSortField === "customerName") {
        valA = (a.customerName || "").toLowerCase();
        valB = (b.customerName || "").toLowerCase();
      }

      if (valA < valB) return debtSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return debtSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredDebts, debtSortField, debtSortOrder]);

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
      { header: "Customer ID", formatter: (c) => c.customerId || "CUST-001" },
      { header: "Customer Name", key: "name" },
      { header: "Phone", key: "phone" },
      {
        header: "Outstanding Balance (ETB)",
        formatter: (c) => {
          const cDebts = debtsByCustomerId[c.id] || [];
          const rem = cDebts.reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);
          return (rem > 0 ? rem : parseFloat(String(c.debtBalance || "0"))).toFixed(2);
        },
      },
      {
        header: "Credit Limit (ETB)",
        formatter: (c) => parseFloat(String(c.creditLimit || "5000")).toFixed(2),
      },
      { header: "Status", formatter: (c) => c.status || "Active" },
    ]);
  }

  function handleExportDebts() {
    exportToCsv("debt-records-ledger", sortedAndFilteredDebts, [
      { header: "Debt ID", key: "id" },
      { header: "Customer Name", formatter: (d) => d.customerName || "Customer" },
      { header: "Phone", formatter: (d) => d.customerPhone || "—" },
      { header: "Total Amount (ETB)", formatter: (d) => parseFloat(d.amount).toFixed(2) },
      { header: "Paid (ETB)", formatter: (d) => parseFloat(d.paidAmount || "0").toFixed(2) },
      { header: "Remaining Balance (ETB)", formatter: (d) => parseFloat(d.remainingAmount || d.amount).toFixed(2) },
      { header: "Due Date", formatter: (d) => d.dueDate || "—" },
      { header: "Status", formatter: (d) => d.status },
      { header: "Notes", formatter: (d) => d.notes || "—" },
    ]);
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Toolbar                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Debt &amp; Credit Ledger</h1>
          <p className="text-xs text-zinc-500">
            Customer-centric debt hierarchy, itemized vouchers, chronological records, and payment tracking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={mainTab === "customers" ? handleExportCustomerLedger : handleExportDebts}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Download className="size-3.5 text-zinc-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setAddDebtPreselectedCustomer(undefined);
              setIsCreateDebtModalOpen(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-800 shadow-2xs transition-all hover:bg-zinc-50 active:scale-95"
          >
            <Plus className="size-3.5 text-zinc-600" />
            Add Debt Voucher
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentTargetDebt(null);
              setPaymentCustomerId(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
          >
            <Coins className="size-3.5 text-indigo-400" />
            Receive Payment
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Top Summary Metric Cards                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Outstanding Debt</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <HandCoins className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-[#dc2626] tabular-nums">
              {summary.totalOutstandingDebt.toLocaleString()}
            </span>
            <span className="font-mono text-xs font-bold text-[#dc2626]">ETB</span>
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">Across {summary.totalDebtors} active debtors</span>
        </div>

        {/* Active Debtors */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Active Debtors</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {summary.totalDebtors}
            </span>
            <span className="text-xs font-medium text-zinc-500">Customers</span>
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">Unsettled credit balances</span>
        </div>

        {/* Collected Repayments */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Repayments Recovered</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
              {summary.collectedThisMonth.toLocaleString()}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600">ETB</span>
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">Total recovered to date</span>
        </div>

        {/* Overdue Accounts */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Overdue Debts</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
              {summary.overdueCount}
            </span>
            <span className="text-xs font-medium text-zinc-500">Vouchers</span>
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">Past payment due date</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Customer-First Dual Tab Switcher                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex border-b border-zinc-200 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setMainTab("customers")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs font-bold transition-all ${
            mainTab === "customers"
              ? "border-slate-900 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Users className="size-4" />
          <span>Customer Debt Ledger</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-700">
            {customers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("debts")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs font-bold transition-all ${
            mainTab === "debts"
              ? "border-slate-900 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Receipt className="size-4" />
          <span>All Debt Records</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-700">
            {debts.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Tab 1 Content: Customer-First Master-Detail Ledger              */}
      {/* ------------------------------------------------------------------ */}
      {mainTab === "customers" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          {/* Table Toolbar */}
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomerFilter("ALL")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "ALL" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                All Customers
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("ACTIVE")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "ACTIVE" ? "bg-white text-zinc-950 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Active Debtors
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("OVERDUE")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "OVERDUE" ? "bg-white text-red-600 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Overdue
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("PAID")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "PAID" ? "bg-white text-emerald-600 shadow-2xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Settled / Clear
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer, phone, code..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 font-semibold text-zinc-600">
                <tr>
                  <th className="w-9 px-3 py-3.5"></th>
                  <th className="px-5 py-3.5">Customer Profile</th>
                  <th className="px-5 py-3.5">Phone Number</th>
                  <th className="px-5 py-3.5 text-center">Open Debts</th>
                  <th className="px-5 py-3.5 text-right">Outstanding Balance</th>
                  <th className="px-5 py-3.5 text-right">Credit Limit</th>
                  <th className="px-5 py-3.5 text-right">Total Repaid</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ledger Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => {
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
                              title={isExpanded ? "Collapse vouchers" : "Expand vouchers peek"}
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
                                {activeDebtCount} {activeDebtCount === 1 ? "voucher" : "vouchers"}
                              </span>
                            ) : (
                              <span className="text-[11px] text-zinc-400">None</span>
                            )}
                          </td>

                          {/* Outstanding Balance */}
                          <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums">
                            <span className={debt > 0 ? (isOverdue ? "text-rose-600 font-bold" : "text-red-600") : "text-emerald-600"}>
                              {debt.toLocaleString()} ETB
                            </span>
                          </td>

                          {/* Credit Limit */}
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-zinc-600 tabular-nums">
                            {creditLimit.toLocaleString()} ETB
                          </td>

                          {/* Total Repaid */}
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-emerald-600 tabular-nums">
                            {paidDisplay.toLocaleString()} ETB
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            {debt === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                                <Check className="size-3" /> SETTLED
                              </span>
                            ) : isOverdue ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                                  <AlertCircle className="size-3" /> {oldestOverdueDays > 0 ? `${oldestOverdueDays}d OVERDUE` : "OVERDUE"}
                                </span>
                                {oldestDueDate && (
                                  <span className="text-[10px] text-zinc-400 font-mono">Due: {oldestDueDate}</span>
                                )}
                              </div>
                            ) : paidDisplay > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                                <Clock className="size-3" /> PARTIAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                                <Clock className="size-3" /> PENDING
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setAddDebtPreselectedCustomer(cust.id);
                                  setIsCreateDebtModalOpen(true);
                                }}
                                className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                title="Add Debt Voucher"
                              >
                                <Plus className="size-3" />
                                Debt
                              </button>

                              {debt > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentTargetDebt(null);
                                    setPaymentCustomerId(cust.id);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="flex h-7 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white shadow-2xs hover:bg-slate-800"
                                  title="Receive Payment"
                                >
                                  <Coins className="size-3 text-indigo-400" />
                                  Pay All
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setCustomerHistory(cust)}
                                className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                title="Chronological Customer Ledger"
                              >
                                <Receipt className="size-3 text-zinc-500" />
                                Ledger
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
                                      <span className="text-xs font-bold text-zinc-900">Credit Health &amp; Limit</span>
                                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-700">
                                        {utilizationPct}% Utilized
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="text-zinc-500">
                                        Outstanding: <strong className="font-mono text-red-600">{debt.toLocaleString()} ETB</strong>
                                      </span>
                                      <span className="text-zinc-300">•</span>
                                      <span className="text-zinc-500">
                                        Limit: <strong className="font-mono text-zinc-800">{creditLimit.toLocaleString()} ETB</strong>
                                      </span>
                                      <span className="text-zinc-300">•</span>
                                      <span className="text-zinc-500">
                                        Available:{" "}
                                        <strong className="font-mono text-emerald-600">
                                          {Math.max(0, creditLimit - debt).toLocaleString()} ETB
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
                                        Open Debt Vouchers ({openCustDebts.length})
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setCustomerHistory(cust)}
                                      className="text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 underline"
                                    >
                                      View Complete History ({custDebts.length} records)
                                    </button>
                                  </div>

                                  {openCustDebts.length > 0 ? (
                                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                                      <table className="w-full text-left text-xs">
                                        <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600">
                                          <tr>
                                            <th className="px-4 py-2">Voucher ID</th>
                                            <th className="px-4 py-2">Created</th>
                                            <th className="px-4 py-2">Due Date</th>
                                            <th className="px-4 py-2">Items / Notes</th>
                                            <th className="px-4 py-2 text-right">Original</th>
                                            <th className="px-4 py-2 text-right">Remaining Due</th>
                                            <th className="px-4 py-2 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                          {openCustDebts.map((d) => {
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
                                                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                  {d.dueDate ? (
                                                    <span className={isVoucherOverdue ? "font-semibold text-rose-600" : "text-zinc-600"}>
                                                      {d.dueDate} {isVoucherOverdue && "(OVERDUE)"}
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
                                                  {total.toLocaleString()} ETB
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">
                                                  {remaining.toLocaleString()} ETB
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
                                                    <Coins className="size-3 text-indigo-400" /> Pay Voucher
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
                                      All debt vouchers for {cust.name} are fully settled!
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
                      No customers found matching the search and status filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. Tab 2 Content: All Debt Records                                 */}
      {/* ------------------------------------------------------------------ */}
      {mainTab === "debts" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs">
          {/* Table Toolbar */}
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
              {(
                [
                  { id: "ALL", label: "All Debts" },
                  { id: "OVERDUE", label: "Overdue" },
                  { id: "DUE_THIS_WEEK", label: "Due This Week" },
                  { id: "PENDING", label: "Pending" },
                  { id: "PARTIAL", label: "Partial" },
                  { id: "PAID", label: "Settled" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDebtFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    debtFilter === tab.id
                      ? "bg-white text-zinc-950 shadow-2xs font-bold"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={debtSearch}
                onChange={(e) => setDebtSearch(e.target.value)}
                placeholder="Search debt ID, customer, items, note..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Debts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 font-semibold text-zinc-600">
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
                      title="Select all visible unpaid vouchers"
                    />
                  </th>
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("createdAt")}
                      className="flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>Debt Reference</span>
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
                      <span>Customer</span>
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
                      <span>Original Amount</span>
                      {debtSortField === "amount" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-zinc-600">Amount Paid</th>
                  <th className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDebtSort("remainingAmount")}
                      className="ml-auto flex items-center gap-1.5 font-semibold text-zinc-600 hover:text-zinc-950"
                    >
                      <span>Remaining Due</span>
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
                      <span>Due Date</span>
                      {debtSortField === "dueDate" ? (
                        debtSortOrder === "asc" ? <ChevronUp className="size-3 text-zinc-900" /> : <ChevronDown className="size-3 text-zinc-900" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-zinc-600">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedAndFilteredDebts.length > 0 ? (
                  sortedAndFilteredDebts.map((debt) => {
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
                          <div className="font-semibold text-zinc-900">{debt.customerName || "Customer"}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{debt.customerPhone || "—"}</div>
                        </td>

                        {/* Original Debt */}
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-zinc-800 tabular-nums">
                          {totalAmount.toLocaleString()} ETB
                        </td>

                        {/* Amount Paid */}
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-emerald-600 tabular-nums">
                          {paid.toLocaleString()} ETB
                        </td>

                        {/* Remaining Balance */}
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              isPaid ? "text-zinc-400" : "text-red-600"
                            }`}
                          >
                            {remaining.toLocaleString()} ETB
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-3.5 text-zinc-600">
                          <div>
                            {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </div>
                          {isOverdue && !isPaid && (
                            <span className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                              Overdue
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="size-3" /> PAID
                            </span>
                          ) : debt.status === "PARTIAL" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200/60">
                              <Clock className="size-3" /> PARTIAL
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200/60">
                              <AlertCircle className="size-3" /> OVERDUE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                              <Clock className="size-3" /> PENDING
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
                              title="Audit Trail / Payment History"
                            >
                              <Receipt className="size-3.5 text-zinc-500" />
                              History
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
                                title="Settle or Receive Payment"
                              >
                                <Coins className="size-3 text-indigo-400" />
                                Pay
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 text-[11px] font-bold text-emerald-600">
                                <Check className="size-3.5" /> Settled
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
                      No debt records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Floating Batch Action Bar when ≥1 debt is selected */}
          {selectedTableDebtIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-zinc-950 font-bold text-xs">
                  {selectedTableDebtIds.length}
                </span>
                <span className="text-xs font-semibold">
                  {selectedTableDebtIds.length === 1
                    ? "1 debt voucher selected"
                    : `${selectedTableDebtIds.length} debt vouchers selected`}
                </span>
              </div>

              <div className="font-mono text-xs font-bold text-indigo-400">
                {selectedTableSum.toLocaleString()} ETB
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTableDebtIds([])}
                  className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Clear
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
                  className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-xs hover:bg-zinc-100 active:scale-95 cursor-pointer"
                >
                  <Coins className="size-3.5 text-zinc-950" />
                  Settle Selected ({selectedTableSum.toLocaleString()} ETB)
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

      {isCreateDebtModalOpen && (
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
