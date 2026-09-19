"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calendar,
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
import type { Customer, Debt, DebtSummary, DebtTransaction } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";


/* ------------------------------------------------------------------ */
/* Modal: Debt Transaction History                                    */
/* ------------------------------------------------------------------ */
function DebtHistoryModal({
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
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="mb-5 flex items-start justify-between border-b border-[#f3f4f6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#111827]">Debt & Credit History</h2>
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

        {/* Customer Credit KPI Row */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Current Outstanding</span>
            <p className="mt-1 text-sm font-bold text-[#dc2626]">{debt.toLocaleString()} ETB</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Credit Limit</span>
            <p className="mt-1 text-sm font-bold text-[#111827]">{creditLimit.toLocaleString()} ETB</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Total Credit Purchases</span>
            <p className="mt-1 text-sm font-bold text-[#2563eb]">{totalCredit.toLocaleString()} ETB</p>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <span className="text-[11px] font-medium text-[#6b7280]">Total Repaid</span>
            <p className="mt-1 text-sm font-bold text-[#16a34a]">{totalPaid.toLocaleString()} ETB</p>
          </div>
        </div>

        {/* Transaction History Table */}
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

        {/* Footer */}
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
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
/* Modal: Receive Payment / Pay Debt                                   */
/* ------------------------------------------------------------------ */
function ReceivePaymentModal({
  customers,
  initialCustomerId,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  initialCustomerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [selectedCustId, setSelectedCustId] = useState(
    initialCustomerId || customers.find((c) => parseFloat(c.debtBalance || "0") > 0)?.id || customers[0]?.id || "",
  );
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "Telebirr">("Cash");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState(`PAY-${Math.floor(100 + Math.random() * 900)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustId) || null,
    [customers, selectedCustId],
  );

  const currentDebt = selectedCustomer ? parseFloat(selectedCustomer.debtBalance || "0") : 0;
  const payVal = parseFloat(amount) || 0;
  const newDebtBalance = Math.max(0, currentDebt - payVal);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMsg("Please select a customer.");
      return;
    }
    if (payVal <= 0) {
      setErrorMsg("Payment amount must be greater than zero.");
      return;
    }
    if (payVal > currentDebt) {
      setErrorMsg(`Payment cannot exceed outstanding balance of ${currentDebt.toLocaleString()} ETB.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await recordDebtPayment(activeShopId, {
        customerId: selectedCustomer.id,
        amount: payVal,
        paymentMethod,
        reference,
        notes: notes || `Debt repayment via ${paymentMethod}`,
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="size-4" />
            </div>
            <h2 className="text-base font-semibold text-[#111827]">Receive Debt Payment</h2>
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
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{errorMsg}</div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="mb-1 block font-medium text-[#374151]">Customer</label>
            <select
              value={selectedCustId}
              onChange={(e) => setSelectedCustId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({parseFloat(c.debtBalance || "0").toLocaleString()} ETB Debt)
                </option>
              ))}
            </select>
          </div>

          {/* Balance Preview Card */}
          {selectedCustomer && (
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Current Outstanding Debt:</span>
                <span className="font-bold text-[#dc2626]">{currentDebt.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Amount Paying:</span>
                <span className="font-semibold text-emerald-600">-{payVal.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between border-t border-[#e5e7eb] pt-2 font-bold">
                <span className="text-[#111827]">New Outstanding Balance:</span>
                <span className={newDebtBalance === 0 ? "text-emerald-600" : "text-[#111827]"}>
                  {newDebtBalance.toLocaleString()} ETB
                </span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-medium text-[#374151]">Payment Amount (ETB)</label>
              <button
                type="button"
                onClick={() => setAmount(String(currentDebt))}
                className="text-[11px] font-semibold text-zinc-900 underline underline-offset-2 hover:text-black"
              >
                Pay Full Balance
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
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
            <div className="grid grid-cols-3 gap-2">
              {(["Cash", "Bank", "Telebirr"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    paymentMethod === method
                      ? "border-zinc-950 bg-zinc-950 text-[#c0e763] shadow-sm"
                      : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                  }`}
                >
                  {method === "Cash" && <Banknote className="size-3.5" />}
                  {method === "Bank" && <Landmark className="size-3.5" />}
                  {method === "Telebirr" && <Smartphone className="size-3.5" />}
                  {method}
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
              <label className="mb-1 block font-medium text-[#374151]">Notes (Optional)</label>
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
              className="rounded-lg bg-[#c0e763] px-5 py-2 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page: Customer Debt Management                                 */
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

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "OVERDUE" | "ACTIVE" | "PAID">("ALL");

  // Modals
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
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
    } catch {
      // Fallback handled in API
    } finally {
      setLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const debt = parseFloat(cust.debtBalance || "0");
      const isOverdue = cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");

      if (activeTab === "OVERDUE" && (!isOverdue || debt <= 0)) return false;
      if (activeTab === "ACTIVE" && debt <= 0) return false;
      if (activeTab === "PAID" && debt > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cust.name.toLowerCase().includes(q);
        const matchesPhone = cust.phone?.toLowerCase().includes(q);
        const matchesId = cust.customerId?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId;
      }
      return true;
    });
  }, [customers, activeTab, searchQuery]);

  function handleExportLedger() {
    exportToCsv("customer-debt-ledger", filteredCustomers, [
      { header: "Customer ID", formatter: (c) => c.customerId || "CUST-001" },
      { header: "Customer Name", key: "name" },
      { header: "Phone", key: "phone" },
      { header: "Address", key: "address" },
      {
        header: "Outstanding Balance (ETB)",
        formatter: (c) => parseFloat(String(c.debtBalance || "0")).toFixed(2),
      },
      {
        header: "Credit Limit (ETB)",
        formatter: (c) => parseFloat(String(c.creditLimit || "5000")).toFixed(2),
      },

      {
        header: "Days Overdue",
        formatter: (c) => c.daysOverdue || "-",
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
          <h1 className="text-lg font-semibold text-[#111827]">Customer Debt Management</h1>
          <p className="text-xs text-[#6b7280]">
            Track credit purchases, overdue accounts, customer balances, and repayments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportLedger}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            <Download className="size-3.5 text-[#6b7280]" />
            Export Ledger
          </button>
          <button
            type="button"
            onClick={() => setIsCreateDebtModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 active:scale-95"
          >
            <Plus className="size-3.5 text-zinc-600" />
            Record Debt
          </button>
          <button
            type="button"
            onClick={() => {
              setPaymentCustomerId(null);
              setIsPaymentModalOpen(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#c0e763] px-4 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95"
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
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Total Outstanding Debt</span>
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
          <span className="mt-1 block text-[11px] text-[#9ca3af]">From {summary.totalDebtors} debtors</span>
        </div>

        {/* Active Debtors */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Active Debtors</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {summary.totalDebtors}
            </span>
            <span className="text-xs font-medium text-[#6b7280]">Customers</span>
          </div>
          <span className="mt-1 block text-[11px] text-[#9ca3af]">Accounts with active balances</span>
        </div>

        {/* Collected Repayments */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Collected Repayments</span>
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
          <span className="mt-1 block text-[11px] text-[#9ca3af]">Recorded repayments</span>
        </div>

        {/* Overdue Accounts */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6b7280]">Overdue Accounts</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
              {summary.overdueCount}
            </span>
            <span className="text-xs font-medium text-[#6b7280]">Customers</span>
          </div>
          <span className="mt-1 block text-[11px] text-[#9ca3af]">Past due payment date</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Catalog Table Card                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-4 border-b border-[#e5e7eb] p-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-[#f3f4f6] p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeTab === "ALL"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              All Debtors
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("OVERDUE")}
              className={`rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeTab === "OVERDUE"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              Overdue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeTab === "ACTIVE"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              Active Debt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PAID")}
              className={`rounded-lg px-3.5 py-1.5 font-medium transition-all ${
                activeTab === "PAID"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              Settled
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, ID..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-zinc-950 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#e5e7eb] bg-[#f9fafb] font-medium text-[#6b7280]">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5">Current Debt</th>
                <th className="px-5 py-3.5">Total Credit</th>
                <th className="px-5 py-3.5">Total Repaid</th>
                <th className="px-5 py-3.5">Last Transaction</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const debt = parseFloat(cust.debtBalance || "0");
                  const totalCredit = parseFloat(String(cust.totalCreditPurchases || debt));
                  const totalPaid = parseFloat(String(cust.totalPaid || "0"));
                  const isOverdue = cust.status === "Overdue" || (cust.daysOverdue && cust.daysOverdue !== "-");

                  return (
                    <tr key={cust.id} className="transition-colors hover:bg-[#f9fafb]/80">
                      {/* Customer Name & ID */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827]">{cust.name}</div>
                        <div className="font-mono text-[11px] text-[#9ca3af]">{cust.customerId || "CUST-001"}</div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-[#4b5563]">{cust.phone || "+251912345678"}</td>

                      {/* Outstanding Debt */}
                      <td className="px-5 py-4">
                        <span className={`font-mono font-bold tabular-nums ${debt > 0 ? "text-[#dc2626]" : "text-emerald-600"}`}>
                          {debt.toLocaleString()} ETB
                        </span>
                      </td>

                      {/* Total Credit */}
                      <td className="px-5 py-4 font-mono font-medium text-[#374151] tabular-nums">
                        {totalCredit.toLocaleString()} ETB
                      </td>

                      {/* Total Repaid */}
                      <td className="px-5 py-4 font-mono font-medium text-[#16a34a] tabular-nums">
                        {totalPaid.toLocaleString()} ETB
                      </td>

                      {/* Last Transaction */}
                      <td className="px-5 py-4 text-[#6b7280]">
                        {cust.lastTransactionDate || cust.date || "Aug 20, 2026"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {debt === 0 ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            Settled
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                            Overdue ({cust.daysOverdue || "5 days"})
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                            Active Debt
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHistoryCustomer(cust)}
                            className="flex h-8 items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
                            title="View Debt History"
                          >
                            <Receipt className="size-3.5 text-[#6b7280]" />
                            History
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentCustomerId(cust.id);
                              setIsPaymentModalOpen(true);
                            }}
                            className="flex h-8 items-center gap-1 rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-[#c0e763] shadow-sm transition-all hover:bg-zinc-800"
                            title="Receive Payment"
                          >
                            <Coins className="size-3.5 text-[#c0e763]" />
                            Pay
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#9ca3af]">
                    No debt records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Modals                                                          */}
      {/* ------------------------------------------------------------------ */}
      {historyCustomer && (
        <DebtHistoryModal
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
          onOpenPayment={(cust) => {
            setHistoryCustomer(null);
            setPaymentCustomerId(cust.id);
            setIsPaymentModalOpen(true);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <ReceivePaymentModal
          customers={customers}
          initialCustomerId={paymentCustomerId || undefined}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
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
