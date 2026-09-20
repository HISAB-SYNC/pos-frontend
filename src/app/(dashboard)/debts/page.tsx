"use client";

import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  HandCoins,
  Landmark,
  Plus,
  Receipt,
  Search,
  Smartphone,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createDebt, getCustomers, getDebts, getDebtSummary, recordDebtPayment } from "@/lib/api/app-data";
import type { Customer, Debt, DebtPayment, DebtSummary, DebtTransaction } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

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
        <div className="mb-5 flex items-start justify-between border-b border-[#f3f4f6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900">Debt Record & Audit Trail</h2>
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
                  <th className="px-4 py-2">Method</th>
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
                    <td colSpan={4} className="py-6 text-center text-zinc-400">
                      No payments recorded yet for this debt.
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
              className="flex items-center gap-1.5 rounded-lg bg-[#c0e763] px-4 py-2 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952]"
            >
              <Coins className="size-3.5" />
              Receive Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Debt Transaction History (Customer-Centric)                 */
/* ------------------------------------------------------------------ */
function CustomerDebtHistoryModal({
  customer,
  onClose,
  onOpenPayment,
}: {
  customer: Customer | null;
  onClose: () => void;
  onOpenPayment: (customer: Customer) => void;
}) {
  if (!customer) return null;

  const debt = parseFloat(customer.debtBalance || "0");
  const creditLimit = parseFloat(String(customer.creditLimit || "5000"));
  const totalCredit = parseFloat(String(customer.totalCreditPurchases || debt));
  const totalPaid = parseFloat(String(customer.totalPaid || "0"));
  const transactions = customer.debtHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-start justify-between border-b border-[#f3f4f6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#111827]">Customer Credit & Debt Profile</h2>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-800">
                {customer.customerId || "CUST-001"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#6b7280]">
              {customer.name} • {customer.phone || "No phone"} • {customer.address || "Addis Ababa"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPayment(customer)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#c0e763] px-3.5 text-xs font-bold text-zinc-950 transition-all hover:bg-[#b0d952]"
            >
              <Coins className="size-3.5 text-zinc-950" />
              Receive Payment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Current Outstanding</span>
            <p className="mt-1 text-sm font-bold text-[#dc2626] font-mono tabular-nums">{debt.toLocaleString()} ETB</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Credit Limit</span>
            <p className="mt-1 text-sm font-bold text-[#111827] font-mono tabular-nums">{creditLimit.toLocaleString()} ETB</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Total Credit Purchases</span>
            <p className="mt-1 text-sm font-bold text-[#2563eb] font-mono tabular-nums">{totalCredit.toLocaleString()} ETB</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Total Repaid</span>
            <p className="mt-1 text-sm font-bold text-[#16a34a] font-mono tabular-nums">{totalPaid.toLocaleString()} ETB</p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold text-[#111827]">Ledger / Transaction Records</h3>
          <div className="max-h-[320px] overflow-y-auto rounded-xl border border-[#e5e7eb]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-[#e5e7eb] bg-[#f9fafb] font-medium text-[#6b7280]">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Method / Note</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const isSale = tx.type === "Debt Sale" || tx.type === "DEBT_SALE" || tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-[#f9fafb]/80">
                        <td className="whitespace-nowrap px-4 py-3 text-[#374151]">{tx.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              isSale ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isSale ? (
                              <ArrowUpRight className="size-3" />
                            ) : (
                              <ArrowDownRight className="size-3" />
                            )}
                            {isSale ? "Debt Sale" : "Debt Payment"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-semibold text-[#111827]">
                          {tx.reference}
                        </td>
                        <td className="px-4 py-3 text-[#6b7280]">
                          <span className="font-medium text-[#374151]">{tx.paymentMethod || "Debt"}</span>
                          {tx.notes && <p className="truncate text-[10px] text-[#9ca3af]">{tx.notes}</p>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                          <span className={isSale ? "text-red-600" : "text-emerald-600"}>
                            {isSale ? `+${Math.abs(tx.amount).toLocaleString()}` : `-${Math.abs(tx.amount).toLocaleString()}`}{" "}
                            ETB
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#111827]">
                          {tx.remainingBalance.toLocaleString()} ETB
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#9ca3af]">
                      No debt transactions recorded for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-[#f3f4f6] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Create Standalone Debt                                      */
/* ------------------------------------------------------------------ */
function CreateDebtModal({
  customers,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [customerId, setCustomerId] = useState(customers[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !amount || parseFloat(amount) <= 0) {
      setErrorMsg("Please select a customer and enter a valid debt amount.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await createDebt(activeShopId, {
        customerId,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
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
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Record Standalone Debt</h2>
            <p className="text-xs text-[#6b7280]">Issue store credit or register manual debt</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-medium text-[#374151]">Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || "No phone"}) — Debt: {parseFloat(c.debtBalance || "0").toLocaleString()} ETB
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#374151]">Debt Amount (ETB) *</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500.00"
              required
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#374151]">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#374151]">Notes / Purpose</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Emergency store credit"
              className="w-full rounded-lg border border-[#e5e7eb] p-2.5 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-lg bg-[#c0e763] px-4 py-2 font-bold text-zinc-950 hover:bg-[#b0d952] disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Confirm Debt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Receive Payment / Settle Debt                               */
/* ------------------------------------------------------------------ */
function ReceivePaymentModal({
  customers,
  targetDebt,
  initialCustomerId,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  targetDebt?: Debt | null;
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const defaultCustId =
    targetDebt?.customerId ||
    initialCustomerId ||
    customers.find((c) => parseFloat(c.debtBalance || "0") > 0)?.id ||
    customers[0]?.id ||
    "";

  const [selectedCustId, setSelectedCustId] = useState(defaultCustId);
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustId) || null,
    [customers, selectedCustId],
  );

  // Remaining debt to pay
  const debtRemaining = targetDebt
    ? parseFloat(targetDebt.remainingAmount || targetDebt.amount || "0")
    : selectedCustomer
    ? parseFloat(selectedCustomer.debtBalance || "0")
    : 0;

  const [amount, setAmount] = useState(debtRemaining > 0 ? String(debtRemaining) : "");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Mobile Payment">("Cash");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState(`PAY-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const payVal = parseFloat(amount) || 0;
  const newDebtBalance = Math.max(0, debtRemaining - payVal);

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
    if (payVal > debtRemaining + 0.01) {
      setErrorMsg(`Payment cannot exceed the outstanding balance of ${debtRemaining.toLocaleString()} ETB.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await recordDebtPayment(activeShopId, {
        customerId: selectedCustId,
        debtId: targetDebt?.id,
        amount: payVal,
        paymentMethod,
        reference,
        notes: notes || (targetDebt ? `Repayment for debt ${targetDebt.id}` : `Debt repayment via ${paymentMethod}`),
      });
      onSuccess();
    } catch {
      setErrorMsg("Failed to record debt payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">
                {targetDebt ? "Settle / Pay Debt Record" : "Receive Debt Payment"}
              </h2>
              {targetDebt && (
                <span className="font-mono text-[11px] text-zinc-500">Ref: {targetDebt.id}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 font-medium">{errorMsg}</div>
          )}

          {/* Customer Selection / Label */}
          {targetDebt ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <span className="text-[11px] text-zinc-500">Customer</span>
              <div className="font-semibold text-zinc-900">{targetDebt.customerName || "Customer"}</div>
              <div className="font-mono text-[11px] text-zinc-500">{targetDebt.customerPhone}</div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block font-medium text-[#374151]">Customer *</label>
              <select
                value={selectedCustId}
                onChange={(e) => {
                  setSelectedCustId(e.target.value);
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) setAmount(cust.debtBalance || "0");
                }}
                className="h-10 w-full rounded-xl border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({parseFloat(c.debtBalance || "0").toLocaleString()} ETB Debt)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Balance Preview Card */}
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Outstanding Amount:</span>
              <span className="font-bold text-[#dc2626] font-mono tabular-nums">{debtRemaining.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Amount Paying:</span>
              <span className="font-semibold text-emerald-600 font-mono tabular-nums">-{payVal.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between border-t border-[#e5e7eb] pt-2 font-bold">
              <span className="text-[#111827]">New Balance:</span>
              <span className={`font-mono tabular-nums ${newDebtBalance === 0 ? "text-emerald-600 font-bold" : "text-[#111827]"}`}>
                {newDebtBalance.toLocaleString()} ETB
                {newDebtBalance === 0 && " (Will be marked PAID)"}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-medium text-[#374151]">Payment Amount (ETB) *</label>
              <button
                type="button"
                onClick={() => setAmount(String(debtRemaining))}
                className="text-[11px] font-semibold text-zinc-900 underline underline-offset-2 hover:text-black"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="h-10 w-full rounded-xl border border-[#e5e7eb] px-3 pr-12 font-mono text-sm font-semibold text-[#111827] focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 tabular-nums"
                required
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-[#9ca3af]">
                ETB
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-1 block font-medium text-[#374151]">Repayment Method</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["Cash", "Bank Transfer", "Mobile Payment", "Card"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex h-9 items-center justify-center rounded-lg border text-[11px] font-semibold transition-all ${
                    paymentMethod === method
                      ? "border-zinc-950 bg-zinc-950 text-[#c0e763] shadow-xs"
                      : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                  }`}
                >
                  {method === "Cash" ? "Cash" : method === "Bank Transfer" ? "Bank" : method === "Mobile Payment" ? "Telebirr" : "Card"}
                </button>
              ))}
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-[#374151]">Reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-2.5 font-mono text-xs text-[#111827] focus:border-zinc-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-[#374151]">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid at counter"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-2.5 text-xs text-[#111827] focus:border-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || payVal <= 0}
              className="flex items-center gap-1.5 rounded-lg bg-[#c0e763] px-5 py-2 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                "Recording..."
              ) : newDebtBalance === 0 ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Settle & Mark as Paid
                </>
              ) : (
                "Confirm Payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page: Customer Debt & Credit Management                       */
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

  // Top Tabs: "debts" (Individual Ledger) vs "customers" (Customer Balances)
  const [mainTab, setMainTab] = useState<"debts" | "customers">("debts");

  // Debts Tab Sub-filter
  const [debtFilter, setDebtFilter] = useState<"ALL" | "PENDING" | "PARTIAL" | "PAID" | "OVERDUE">("ALL");
  const [debtSearch, setDebtSearch] = useState("");

  // Customers Tab Sub-filter
  const [customerFilter, setCustomerFilter] = useState<"ALL" | "OVERDUE" | "ACTIVE" | "PAID">("ALL");
  const [customerSearch, setCustomerSearch] = useState("");

  // Modals
  const [selectedDebtDetail, setSelectedDebtDetail] = useState<Debt | null>(null);
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<Debt | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Customer | null>(null);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreateDebtModalOpen, setIsCreateDebtModalOpen] = useState(false);

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

  // Filtered Customers List
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const debt = parseFloat(cust.debtBalance || "0");
      const isOverdue = cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");

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
  }, [customers, customerFilter, customerSearch]);

  function handleExportDebts() {
    exportToCsv("debt-records-ledger", filteredDebts, [
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

  function handleExportCustomerLedger() {
    exportToCsv("customer-debt-ledger", filteredCustomers, [
      { header: "Customer ID", formatter: (c) => c.customerId || "CUST-001" },
      { header: "Customer Name", key: "name" },
      { header: "Phone", key: "phone" },
      {
        header: "Outstanding Balance (ETB)",
        formatter: (c) => parseFloat(String(c.debtBalance || "0")).toFixed(2),
      },
      {
        header: "Credit Limit (ETB)",
        formatter: (c) => parseFloat(String(c.creditLimit || "5000")).toFixed(2),
      },
      { header: "Status", formatter: (c) => c.status || "Active" },
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
          <h1 className="text-lg font-bold tracking-tight text-zinc-900">Debt & Credit Ledger</h1>
          <p className="text-xs text-zinc-500">
            Track individual store credits, record partial/full repayments, and audit customer balances.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={mainTab === "debts" ? handleExportDebts : handleExportCustomerLedger}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Download className="size-3.5 text-zinc-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setIsCreateDebtModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-800 shadow-xs transition-all hover:bg-zinc-50 active:scale-95"
          >
            <Plus className="size-3.5 text-zinc-600" />
            Record Debt
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentTargetDebt(null);
              setPaymentCustomerId(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#c0e763] px-4 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
          >
            <Coins className="size-3.5 text-zinc-950" />
            Receive Payment
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Top Summary Metric Cards                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-zinc-300">
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
          <span className="mt-1 block text-[11px] text-zinc-400">From {summary.totalDebtors} active debtors</span>
        </div>

        {/* Active Debtors */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-zinc-300">
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
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Repayments Collected</span>
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
          <span className="mt-1 block text-[11px] text-zinc-400">Total recovered across ledger</span>
        </div>

        {/* Overdue Accounts */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-zinc-300">
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
            <span className="text-xs font-medium text-zinc-500">Records</span>
          </div>
          <span className="mt-1 block text-[11px] text-zinc-400">Past payment due date</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Main Dual Tab Switcher                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex border-b border-zinc-200 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setMainTab("debts")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs font-bold transition-all ${
            mainTab === "debts"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Receipt className="size-4" />
          <span>Debt Records & Ledger</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-700">
            {debts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("customers")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs font-bold transition-all ${
            mainTab === "customers"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Users className="size-4" />
          <span>Customer Balances Directory</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-700">
            {customers.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Tab 1 Content: Debt Records & Ledger                            */}
      {/* ------------------------------------------------------------------ */}
      {mainTab === "debts" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs">
          {/* Table Toolbar */}
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
              {(
                [
                  { id: "ALL", label: "All Debts" },
                  { id: "PENDING", label: "Pending" },
                  { id: "PARTIAL", label: "Partial" },
                  { id: "PAID", label: "Paid / Settled" },
                  { id: "OVERDUE", label: "Overdue" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDebtFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    debtFilter === tab.id
                      ? "bg-white text-zinc-950 shadow-xs font-bold"
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
                placeholder="Search debt ID, customer, note..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Debts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600">
                <tr>
                  <th className="px-5 py-3.5">Debt Reference</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5 text-right">Original Debt</th>
                  <th className="px-5 py-3.5 text-right">Amount Paid</th>
                  <th className="px-5 py-3.5 text-right">Remaining Balance</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredDebts.length > 0 ? (
                  filteredDebts.map((debt) => {
                    const totalAmount = parseFloat(debt.amount || "0");
                    const paid = parseFloat(debt.paidAmount || "0");
                    const remaining = parseFloat(debt.remainingAmount || String(Math.max(0, totalAmount - paid)));
                    const isPaid = debt.status === "PAID" || remaining <= 0;
                    const isOverdue = debt.status === "OVERDUE" || (!isPaid && debt.dueDate && new Date(debt.dueDate) < new Date());

                    return (
                      <tr key={debt.id} className="transition-colors hover:bg-zinc-50/70">
                        {/* Debt ID */}
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-zinc-900">{debt.id}</div>
                          {debt.notes && (
                            <div className="max-w-[180px] truncate text-[11px] text-zinc-500" title={debt.notes}>
                              {debt.notes}
                            </div>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900">{debt.customerName || "Customer"}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{debt.customerPhone || "—"}</div>
                        </td>

                        {/* Original Debt */}
                        <td className="px-5 py-4 text-right font-mono font-semibold text-zinc-800 tabular-nums">
                          {totalAmount.toLocaleString()} ETB
                        </td>

                        {/* Amount Paid */}
                        <td className="px-5 py-4 text-right font-mono font-semibold text-emerald-600 tabular-nums">
                          {paid.toLocaleString()} ETB
                        </td>

                        {/* Remaining Balance */}
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`font-mono font-bold tabular-nums ${
                              isPaid ? "text-zinc-400" : "text-red-600"
                            }`}
                          >
                            {remaining.toLocaleString()} ETB
                          </span>
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-4 text-zinc-600">
                          <div>{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</div>
                          {isOverdue && !isPaid && (
                            <span className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                              Overdue
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4">
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
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDebtDetail(debt)}
                              className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
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
                                  setIsPaymentModalOpen(true);
                                }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-zinc-950 px-3 text-xs font-bold text-[#c0e763] shadow-xs transition-all hover:bg-zinc-800 active:scale-95"
                                title="Settle or Receive Payment"
                              >
                                <Coins className="size-3.5 text-[#c0e763]" />
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
                    <td colSpan={8} className="py-12 text-center text-xs text-zinc-400">
                      No debt records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. Tab 2 Content: Customer Balances Directory                      */}
      {/* ------------------------------------------------------------------ */}
      {mainTab === "customers" && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs">
          {/* Table Toolbar */}
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomerFilter("ALL")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "ALL" ? "bg-white text-zinc-950 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                All Debtors
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("OVERDUE")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "OVERDUE" ? "bg-white text-red-600 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Overdue
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("ACTIVE")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "ACTIVE" ? "bg-white text-zinc-950 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Active Debt
              </button>
              <button
                type="button"
                onClick={() => setCustomerFilter("PAID")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  customerFilter === "PAID" ? "bg-white text-emerald-600 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Settled
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer, phone, ID..."
                className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Phone Number</th>
                  <th className="px-5 py-3.5 text-right">Outstanding Debt</th>
                  <th className="px-5 py-3.5 text-right">Credit Limit</th>
                  <th className="px-5 py-3.5 text-right">Total Repaid</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => {
                    const debt = parseFloat(cust.debtBalance || "0");
                    const creditLimit = parseFloat(String(cust.creditLimit || "5000"));
                    const totalPaid = parseFloat(String(cust.totalPaid || "0"));
                    const isOverdue = cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");

                    return (
                      <tr key={cust.id} className="transition-colors hover:bg-zinc-50/70">
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900">{cust.name}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{cust.customerId || "CUST-001"}</div>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-4 font-mono text-zinc-700">{cust.phone || "—"}</td>

                        {/* Outstanding Debt */}
                        <td className="px-5 py-4 text-right font-mono font-bold tabular-nums">
                          <span className={debt > 0 ? "text-[#dc2626]" : "text-emerald-600"}>
                            {debt.toLocaleString()} ETB
                          </span>
                        </td>

                        {/* Credit Limit */}
                        <td className="px-5 py-4 text-right font-mono font-medium text-zinc-700 tabular-nums">
                          {creditLimit.toLocaleString()} ETB
                        </td>

                        {/* Total Repaid */}
                        <td className="px-5 py-4 text-right font-mono font-medium text-emerald-600 tabular-nums">
                          {totalPaid.toLocaleString()} ETB
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {debt === 0 ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                              Settled
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60">
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                              Active Debt
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCustomerHistory(cust)}
                              className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                              title="Customer Profile & Ledger"
                            >
                              <Receipt className="size-3.5 text-zinc-500" />
                              Ledger
                            </button>
                            {debt > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentTargetDebt(null);
                                  setPaymentCustomerId(cust.id);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-zinc-950 px-3 text-xs font-bold text-[#c0e763] shadow-xs transition-all hover:bg-zinc-800"
                                title="Receive Payment"
                              >
                                <Coins className="size-3.5 text-[#c0e763]" />
                                Pay
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 text-[11px] font-bold text-emerald-600">
                                <Check className="size-3.5" /> Clear
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-zinc-400">
                      No customer debt records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
          onClose={() => setCustomerHistory(null)}
          onOpenPayment={(cust) => {
            setCustomerHistory(null);
            setPaymentTargetDebt(null);
            setPaymentCustomerId(cust.id);
            setIsPaymentModalOpen(true);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <ReceivePaymentModal
          customers={customers}
          targetDebt={paymentTargetDebt}
          initialCustomerId={paymentCustomerId || undefined}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentTargetDebt(null);
            setPaymentCustomerId(null);
          }}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setPaymentTargetDebt(null);
            setPaymentCustomerId(null);
            loadData();
          }}
        />
      )}

      {isCreateDebtModalOpen && (
        <CreateDebtModal
          customers={customers}
          onClose={() => setIsCreateDebtModalOpen(false)}
          onSuccess={() => {
            setIsCreateDebtModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
