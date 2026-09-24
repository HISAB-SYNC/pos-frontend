"use client";

import {
  Banknote,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { getSales, processSaleReturn } from "@/lib/api/app-data";
import type { Sale } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

const PAGE_SIZE = 10;

type DatePreset = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

/* ------------------------------------------------------------------ */
/* Financial Helpers                                                  */
/* ------------------------------------------------------------------ */
function computeSaleFinancials(sale: Sale) {
  const revenue = parseFloat(String(sale.totalAmount || "0")) || 0;
  let cogs = 0;
  let hasCostData = false;

  if (sale.items && sale.items.length > 0) {
    for (const it of sale.items) {
      const bp =
        it.product?.buyingPrice !== undefined && it.product?.buyingPrice !== null
          ? parseFloat(String(it.product.buyingPrice))
          : undefined;
      if (bp !== undefined && !isNaN(bp)) {
        cogs += it.quantity * bp;
        hasCostData = true;
      }
    }
  }

  const netProfit = hasCostData ? revenue - cogs : undefined;
  const marginPct =
    netProfit !== undefined && revenue > 0 ? (netProfit / revenue) * 100 : undefined;

  return { revenue, cogs, netProfit, marginPct, hasCostData };
}

function isDateInFilter(
  dateStr: string,
  preset: DatePreset,
  startStr: string,
  endStr: string,
): boolean {
  if (preset === "ALL") return true;
  const d = new Date(dateStr);
  const now = new Date();

  if (preset === "TODAY") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  if (preset === "THIS_WEEK") {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= oneWeekAgo && d <= now;
  }

  if (preset === "THIS_MONTH") {
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }

  if (preset === "CUSTOM") {
    if (startStr) {
      const start = new Date(startStr);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (endStr) {
      const end = new Date(endStr);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/* Modal: Product Return & Refund Flow                                */
/* ------------------------------------------------------------------ */
function SaleReturnModal({
  sale,
  shopId,
  onClose,
  onSuccess,
}: {
  sale: Sale;
  shopId: string;
  onClose: () => void;
  onSuccess: (updatedSale: Sale) => void;
}) {
  const [returnItems, setReturnItems] = useState<
    Array<{
      productId: string;
      name: string;
      soldQty: number;
      unitPrice: number;
      returnQty: number;
      reason: string;
    }>
  >(() => {
    return (sale.items || []).map((it) => ({
      productId: it.productId,
      name: it.product?.name || it.name || "Item",
      soldQty: it.quantity,
      unitPrice: parseFloat(String(it.unitPrice || "0")),
      returnQty: 0,
      reason: "Defective / Damaged",
    }));
  });

  const [refundMethod, setRefundMethod] = useState<string>("CASH");
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalRefundAmount = useMemo(() => {
    return returnItems.reduce(
      (sum, item) => sum + item.returnQty * item.unitPrice,
      0,
    );
  }, [returnItems]);

  const totalReturnQty = useMemo(() => {
    return returnItems.reduce((sum, item) => sum + item.returnQty, 0);
  }, [returnItems]);

  function updateItemQty(productId: string, qty: number) {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const clamped = Math.max(0, Math.min(item.soldQty, qty));
          return { ...item, returnQty: clamped };
        }
        return item;
      }),
    );
  }

  function updateItemReason(productId: string, reason: string) {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, reason } : item,
      ),
    );
  }

  async function handleConfirmReturn(e: React.FormEvent) {
    e.preventDefault();
    if (totalReturnQty === 0) {
      setErrorMsg("Please select at least 1 item quantity to return.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const activeReturns = returnItems
        .filter((it) => it.returnQty > 0)
        .map((it) => ({
          productId: it.productId,
          quantity: it.returnQty,
          refundAmount: it.returnQty * it.unitPrice,
          reason: it.reason,
        }));

      await processSaleReturn(shopId, sale.id, {
        items: activeReturns,
        refundMethod,
        notes: generalNotes || `Return for Receipt #${sale.id.slice(0, 8)}`,
      });

      const isAllReturned = returnItems.every(
        (it) => it.returnQty === it.soldQty,
      );
      const updated: Sale = {
        ...sale,
        status: isAllReturned ? "REFUNDED" : "PARTIALLY_REFUNDED",
      };

      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to process sale return. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Process Sale Return & Refund
              </h3>
              <p className="font-mono text-[10px] text-zinc-400">
                #RCP-{sale.id.slice(0, 8).toUpperCase()} • Customer:{" "}
                {sale.customer?.name || "Walk-in"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleConfirmReturn} className="mt-4 space-y-4 text-xs">
          {/* Items Selector */}
          <div className="space-y-2">
            <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-500">
              Select Items to Return & Restock:
            </label>
            <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-zinc-50/50 p-2">
              {returnItems.map((item) => (
                <div key={item.productId} className="py-2.5 px-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        Sold: {item.soldQty} pcs @ {item.unitPrice.toFixed(2)} ETB
                      </p>
                    </div>
                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQty(item.productId, item.returnQty - 1)}
                        disabled={item.returnQty <= 0}
                        className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-zinc-900 w-6 text-center">
                        {item.returnQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(item.productId, item.returnQty + 1)}
                        disabled={item.returnQty >= item.soldQty}
                        className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-white font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {item.returnQty > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-zinc-200">
                      <select
                        value={item.reason}
                        onChange={(e) => updateItemReason(item.productId, e.target.value)}
                        className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-[10px] text-zinc-800"
                      >
                        <option value="Defective / Damaged">Defective / Damaged</option>
                        <option value="Customer Changed Mind">Customer Changed Mind</option>
                        <option value="Wrong Item Supplied">Wrong Item Supplied</option>
                        <option value="Expired / Quality Issue">Expired / Quality Issue</option>
                        <option value="Other">Other Reason</option>
                      </select>
                      <span className="font-mono font-bold text-purple-700 text-[11px]">
                        Refund: {(item.returnQty * item.unitPrice).toFixed(2)} ETB
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Refund Tender Method */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700">
              Refund Payment Tender:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "CASH", label: "Cash Refund" },
                { id: "BANK", label: "Bank Return" },
                { id: "TELEBIRR", label: "Telebirr Return" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRefundMethod(m.id)}
                  className={`rounded-xl border py-2 text-center text-xs font-semibold transition-all ${
                    refundMethod === m.id
                      ? "border-zinc-950 bg-zinc-900 text-white shadow-xs"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Refund Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-zinc-700">
              Return Audit Notes (Optional):
            </label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Return approved by manager"
              className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          {/* Summary Box */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-900 block">
                Total Refund Payout
              </span>
              <span className="text-[10px] text-purple-700">
                {totalReturnQty} items returning to shop inventory
              </span>
            </div>
            <span className="font-mono text-base font-bold text-purple-900">
              {totalRefundAmount.toFixed(2)} ETB
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalReturnQty === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800 disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              <span>{isSubmitting ? "Processing..." : "Confirm Return & Restock"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Digital Sale Receipt                                        */
/* ------------------------------------------------------------------ */
function SaleReceiptModal({
  sale,
  shopName,
  isCashier,
  onClose,
  onOpenReturn,
}: {
  sale: Sale | null;
  shopName: string;
  isCashier: boolean;
  onClose: () => void;
  onOpenReturn?: (sale: Sale) => void;
}) {
  if (!sale) return null;

  const totalNum = parseFloat(String(sale.totalAmount || "0"));
  const subtotalNum = sale.subtotal
    ? parseFloat(String(sale.subtotal))
    : Math.round((totalNum / 1.15) * 100) / 100;
  const taxNum = sale.taxAmount
    ? parseFloat(String(sale.taxAmount))
    : Math.round((totalNum - subtotalNum) * 100) / 100;
  const discountNum = sale.discountAmount
    ? parseFloat(String(sale.discountAmount))
    : 0;

  const method = (sale.paymentMethod || "CASH").toUpperCase();
  const paymentMethodLabel =
    method === "BANK" || method === "CARD" || method === "BANK_TRANSFER"
      ? "Bank Transfer"
      : method === "TELEBIRR" || method === "MOBILE"
      ? "Telebirr"
      : "Cash";

  const financials = computeSaleFinancials(sale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Receipt className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Sale Receipt</h3>
              <p className="font-mono text-[10px] text-zinc-400">
                #RCP-{sale.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="my-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 text-xs space-y-3">
          <div className="text-center pb-2 border-b border-dashed border-zinc-200">
            <h4 className="font-bold text-sm text-zinc-900">{shopName}</h4>
            <p className="text-[11px] text-zinc-500">Official Checkout Register</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-400">
              {new Date(sale.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500">Customer:</span>
            <span className="font-semibold text-zinc-800">
              {sale.customer?.name || "Walk-in Customer"}
            </span>
          </div>

          {/* Items List */}
          <div className="border-t border-b border-zinc-200/80 py-2 space-y-1.5">
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex justify-between items-center text-[11px]"
                >
                  <div>
                    <p className="font-medium text-zinc-800">
                      {item.product?.name || item.name || `Item #${idx + 1}`}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-400">
                      {item.quantity} ×{" "}
                      {parseFloat(String(item.unitPrice || "0")).toFixed(2)} ETB
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-zinc-900">
                    {(
                      item.quantity *
                      (parseFloat(String(item.unitPrice || "0")) || 0)
                    ).toFixed(2)}{" "}
                    ETB
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-600">General POS Checkout Sale</span>
                <span className="font-mono font-semibold text-zinc-900">
                  {totalNum.toFixed(2)} ETB
                </span>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-mono">{subtotalNum.toFixed(2)} ETB</span>
            </div>
            {taxNum > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>VAT / Tax (15%):</span>
                <span className="font-mono">{taxNum.toFixed(2)} ETB</span>
              </div>
            )}
            {discountNum > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">-{discountNum.toFixed(2)} ETB</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-xs font-bold text-zinc-900">
              <span>Total Amount:</span>
              <span className="font-mono text-sm">
                {totalNum.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* Payment & Channel Details */}
          <div className="pt-2 border-t border-dashed border-zinc-200 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment Tender:</span>
              <span className="font-semibold text-zinc-800">{paymentMethodLabel}</span>
            </div>
            {sale.bankName && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Bank / Channel:</span>
                <span className="font-semibold text-zinc-800">{sale.bankName}</span>
              </div>
            )}
            {sale.paymentReference && (
              <div className="flex justify-between">
                <span className="text-zinc-500">TxID / Reference:</span>
                <span className="font-mono font-semibold text-zinc-800">
                  {sale.paymentReference}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Status:</span>
              <span className="font-bold text-zinc-900">{sale.status || "COMPLETED"}</span>
            </div>
          </div>

          {/* Manager/Admin Profit Insight */}
          {!isCashier && financials.netProfit !== undefined && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2 text-[11px] space-y-0.5">
              <div className="flex justify-between text-emerald-900 font-semibold">
                <span>Net Gross Margin:</span>
                <span className="font-mono">
                  +{financials.netProfit.toFixed(2)} ETB ({financials.marginPct?.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 text-[10px]">
                <span>Cost of Goods (COGS):</span>
                <span className="font-mono">{financials.cogs.toFixed(2)} ETB</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
          {!isCashier && onOpenReturn && sale.status !== "CANCELLED" && sale.status !== "REFUNDED" ? (
            <button
              type="button"
              onClick={() => onOpenReturn(sale)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              <span>Process Return</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              <Printer className="size-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Financial Audit Report & Print Ledger                       */
/* ------------------------------------------------------------------ */
function FinancialAuditReportModal({
  sales,
  shopName,
  dateLabel,
  isCashier,
  onClose,
}: {
  sales: Sale[];
  shopName: string;
  dateLabel: string;
  isCashier: boolean;
  onClose: () => void;
}) {
  const activeSales = sales.filter((s) => s.status !== "CANCELLED");

  const totalRevenue = activeSales.reduce(
    (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
    0,
  );

  const totalCOGS = activeSales.reduce((sum, s) => {
    const f = computeSaleFinancials(s);
    return sum + (f.hasCostData ? f.cogs : 0);
  }, 0);

  const netGrossProfit = totalRevenue - totalCOGS;
  const overallMargin = totalRevenue > 0 ? (netGrossProfit / totalRevenue) * 100 : 0;

  // Tender Breakdown
  const cashTotal = activeSales
    .filter((s) => (s.paymentMethod || "").toUpperCase() === "CASH")
    .reduce((sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0), 0);

  const bankTotal = activeSales
    .filter((s) => {
      const m = (s.paymentMethod || "").toUpperCase();
      return m === "BANK" || m === "CARD" || m === "BANK_TRANSFER";
    })
    .reduce((sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0), 0);

  const telebirrTotal = activeSales
    .filter((s) => {
      const m = (s.paymentMethod || "").toUpperCase();
      return m === "TELEBIRR" || m === "MOBILE";
    })
    .reduce((sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Financial Audit Report
              </h3>
              <p className="text-xs text-zinc-500">
                {shopName} • Timeframe: {dateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Audit Content for print/review */}
        <div className="my-5 space-y-4 text-xs">
          {/* Top High-level Figures */}
          <div
            className={`grid gap-3 ${
              isCashier ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Gross Revenue
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-zinc-900">
                {Math.round(totalRevenue).toLocaleString()}{" "}
                <span className="text-xs font-normal text-zinc-500">ETB</span>
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {activeSales.length} Transactions
              </p>
            </div>

            {!isCashier && (
              <>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Cost of Goods (COGS)
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold text-zinc-700">
                    {Math.round(totalCOGS).toLocaleString()}{" "}
                    <span className="text-xs font-normal text-zinc-500">ETB</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">Wholesale cost base</p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Net Gross Profit
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold text-emerald-700">
                    +{Math.round(netGrossProfit).toLocaleString()}{" "}
                    <span className="text-xs font-normal text-emerald-600">ETB</span>
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-800">
                    {overallMargin.toFixed(1)}% Margin
                  </p>
                </div>
              </>
            )}

            {isCashier && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Average Ticket
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-zinc-900">
                  {activeSales.length > 0
                    ? Math.round(totalRevenue / activeSales.length).toLocaleString()
                    : 0}{" "}
                  <span className="text-xs font-normal text-zinc-500">ETB</span>
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Per transaction</p>
              </div>
            )}
          </div>

          {/* Tender Settlement Breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2.5">
            <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-wider">
              Settlement Channels Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5">
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Cash Register</span>
                </div>
                <span className="font-mono font-bold text-emerald-950">
                  {cashTotal.toLocaleString()} ETB
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                <div className="flex items-center gap-2">
                  <Landmark className="size-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Bank Transfer</span>
                </div>
                <span className="font-mono font-bold text-blue-950">
                  {bankTotal.toLocaleString()} ETB
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-amber-600" />
                  <span className="font-semibold text-amber-900">Telebirr Mobile</span>
                </div>
                <span className="font-mono font-bold text-amber-950">
                  {telebirrTotal.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Sales Register */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex justify-between items-center">
              <span className="font-bold text-zinc-800 text-[11px] uppercase tracking-wider">
                Audited Transactions ({activeSales.length})
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Printed: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 text-[11px]">
              {activeSales.map((s) => {
                const f = computeSaleFinancials(s);
                return (
                  <div
                    key={s.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900">
                          #RCP-{s.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-zinc-500">
                          {s.customer?.name || "Walk-in"}
                        </span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                          {s.paymentMethod || "CASH"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(s.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        •{" "}
                        {s.items && s.items.length > 0
                          ? s.items
                              .map(
                                (it) =>
                                  `${it.quantity}x ${it.product?.name || it.name || "Item"}`,
                              )
                              .join(", ")
                          : "General Sale"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-zinc-900">
                        {parseFloat(String(s.totalAmount || "0")).toFixed(2)} ETB
                      </p>
                      {!isCashier && f.netProfit !== undefined && (
                        <p className="font-mono text-[10px] font-medium text-emerald-600">
                          Profit: +{f.netProfit.toFixed(2)} ETB
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800"
          >
            <Printer className="size-3.5" />
            <span>Print Audit Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component: Sales History & Receipts Ledger                    */
/* ------------------------------------------------------------------ */
export default function SalesHistoryPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const activeShopName = useShopStore((state) => state.activeShopName) || "Shop";
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const authUser = useAuthStore((state) => state.user);
  const isCashier = authUser?.role === "SALES";

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DatePreset>("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal State
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [returnTargetSale, setReturnTargetSale] = useState<Sale | null>(null);
  const [notificationToast, setNotificationToast] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSales(shopId);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load sales history:", err);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleReturnSuccess(updatedSale: Sale) {
    setSales((prev) =>
      prev.map((s) => (s.id === updatedSale.id ? { ...s, status: updatedSale.status } : s)),
    );
    setNotificationToast(
      `Return processed successfully for Receipt #RCP-${updatedSale.id.slice(0, 8).toUpperCase()}. Products restocked.`,
    );
    setTimeout(() => {
      setNotificationToast("");
    }, 5000);
  }

  // Client-side filtering including item-level matching & date ranges
  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();

    return sales.filter((s) => {
      // 1. Text Search: receipt id, customer name, phone, tx reference, bank, and inside sale.items
      const idMatch = s.id.toLowerCase().includes(q);
      const custMatch = Boolean(s.customer?.name?.toLowerCase().includes(q));
      const phoneMatch = Boolean(s.customer?.phone?.includes(q));
      const refMatch = Boolean(s.paymentReference?.toLowerCase().includes(q));
      const bankMatch = Boolean(s.bankName?.toLowerCase().includes(q));
      const itemMatch = Boolean(
        s.items &&
          s.items.some((it) =>
            (it.product?.name || it.name || "").toLowerCase().includes(q),
          ),
      );

      const matchesSearch =
        !q || idMatch || custMatch || phoneMatch || refMatch || bankMatch || itemMatch;

      // 2. Tender Filter
      const methodUpper = (s.paymentMethod || "").toUpperCase();
      let matchesMethod = selectedMethod === "ALL";
      if (selectedMethod === "CASH") matchesMethod = methodUpper === "CASH";
      else if (selectedMethod === "BANK")
        matchesMethod =
          methodUpper === "BANK" ||
          methodUpper === "CARD" ||
          methodUpper === "BANK_TRANSFER";
      else if (selectedMethod === "TELEBIRR")
        matchesMethod = methodUpper === "TELEBIRR" || methodUpper === "MOBILE";

      // 3. Status Filter
      const matchesStatus =
        selectedStatus === "ALL" ||
        (s.status || "COMPLETED").toUpperCase() === selectedStatus;

      // 4. Date Range Filter
      const matchesDate = isDateInFilter(
        s.createdAt,
        dateFilter,
        customStartDate,
        customEndDate,
      );

      return matchesSearch && matchesMethod && matchesStatus && matchesDate;
    });
  }, [
    sales,
    search,
    selectedMethod,
    selectedStatus,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const currentSales = useMemo(
    () => filteredSales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredSales, page],
  );

  // Financial Summary Metrics
  const activeFilteredSales = useMemo(
    () => filteredSales.filter((s) => s.status !== "CANCELLED"),
    [filteredSales],
  );

  const totalRevenue = useMemo(
    () =>
      activeFilteredSales.reduce(
        (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
        0,
      ),
    [activeFilteredSales],
  );

  const totalCOGS = useMemo(
    () =>
      activeFilteredSales.reduce((sum, s) => {
        const f = computeSaleFinancials(s);
        return sum + (f.hasCostData ? f.cogs : 0);
      }, 0),
    [activeFilteredSales],
  );

  const totalNetProfit = totalRevenue - totalCOGS;
  const overallMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  const todayDateStr = new Date().toDateString();
  const todaySalesList = useMemo(
    () =>
      sales.filter(
        (s) =>
          new Date(s.createdAt).toDateString() === todayDateStr &&
          s.status !== "CANCELLED",
      ),
    [sales, todayDateStr],
  );
  const todayRevenue = useMemo(
    () =>
      todaySalesList.reduce(
        (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
        0,
      ),
    [todaySalesList],
  );

  const completedCount = activeFilteredSales.length;
  const avgTicket = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  // Date label description for reports
  const dateLabel = useMemo(() => {
    switch (dateFilter) {
      case "TODAY":
        return "Today";
      case "THIS_WEEK":
        return "This Past 7 Days";
      case "THIS_MONTH":
        return "This Month";
      case "CUSTOM":
        return `${customStartDate || "Start"} to ${customEndDate || "Now"}`;
      default:
        return "All Time";
    }
  }, [dateFilter, customStartDate, customEndDate]);

  // Comprehensive Financial Export to CSV
  function handleDownload() {
    const columns: Parameters<typeof exportToCsv<Sale>>[2] = [
      {
        header: "Receipt ID",
        formatter: (s) => `#RCP-${s.id.slice(0, 8).toUpperCase()}`,
      },
      {
        header: "Date & Time",
        formatter: (s) => new Date(s.createdAt).toLocaleString(),
      },
      {
        header: "Customer",
        formatter: (s) => s.customer?.name || "Walk-in Customer",
      },
      {
        header: "Items Sold",
        formatter: (s) =>
          s.items && s.items.length > 0
            ? s.items
                .map((it) => {
                  const name = it.product?.name || it.name || "Item";
                  const sp = it.unitPrice || it.product?.price;
                  const bp = it.product?.buyingPrice;
                  const priceDetails =
                    bp !== undefined && bp !== null
                      ? ` (Buy: ${parseFloat(String(bp)).toFixed(2)} ETB, Sell: ${sp ? parseFloat(String(sp)).toFixed(2) : "—"} ETB)`
                      : sp
                      ? ` (Sell: ${parseFloat(String(sp)).toFixed(2)} ETB)`
                      : "";
                  return `${it.quantity}x ${name}${priceDetails}`;
                })
                .join("; ")
            : "General Sale",
      },
      { header: "Payment Channel", key: "paymentMethod" },
      { header: "Bank / Provider", formatter: (s) => s.bankName || "-" },
      { header: "TxID Reference", formatter: (s) => s.paymentReference || "-" },
      {
        header: "Subtotal (ETB)",
        formatter: (s) =>
          s.subtotal
            ? parseFloat(String(s.subtotal)).toFixed(2)
            : (parseFloat(String(s.totalAmount || "0")) / 1.15).toFixed(2),
      },
      {
        header: "Discount (ETB)",
        formatter: (s) =>
          s.discountAmount
            ? parseFloat(String(s.discountAmount)).toFixed(2)
            : "0.00",
      },
      {
        header: "VAT (ETB)",
        formatter: (s) =>
          s.taxAmount ? parseFloat(String(s.taxAmount)).toFixed(2) : "0.00",
      },
      {
        header: "Total Revenue (ETB)",
        formatter: (s) => parseFloat(String(s.totalAmount || "0")).toFixed(2),
      },
    ];

    if (!isCashier) {
      columns.push(
        {
          header: "COGS (ETB)",
          formatter: (s) => {
            const f = computeSaleFinancials(s);
            return f.hasCostData ? f.cogs.toFixed(2) : "N/A";
          },
        },
        {
          header: "Net Profit (ETB)",
          formatter: (s) => {
            const f = computeSaleFinancials(s);
            return f.netProfit !== undefined ? f.netProfit.toFixed(2) : "N/A";
          },
        },
        {
          header: "Profit Margin %",
          formatter: (s) => {
            const f = computeSaleFinancials(s);
            return f.marginPct !== undefined
              ? `${f.marginPct.toFixed(1)}%`
              : "N/A";
          },
        },
      );
    }

    columns.push({
      header: "Status",
      formatter: (s) => s.status || "COMPLETED",
    });

    exportToCsv(`sales-audit-${dateFilter.toLowerCase()}`, filteredSales, columns);
  }

  return (
    <>
      <SaleReceiptModal
        sale={activeReceipt}
        shopName={activeShopName}
        isCashier={isCashier}
        onClose={() => setActiveReceipt(null)}
        onOpenReturn={(s) => {
          setActiveReceipt(null);
          setReturnTargetSale(s);
        }}
      />

      {returnTargetSale && (
        <SaleReturnModal
          sale={returnTargetSale}
          shopId={shopId}
          onClose={() => setReturnTargetSale(null)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {isAuditModalOpen && (
        <FinancialAuditReportModal
          sales={filteredSales}
          shopName={activeShopName}
          dateLabel={dateLabel}
          isCashier={isCashier}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      <div className="space-y-4">
        {/* Notification Toast */}
        {notificationToast && (
          <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-purple-700 shrink-0" />
              <span className="font-medium">{notificationToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificationToast("")}
              className="text-purple-600 hover:text-purple-900"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Total Revenue ({dateLabel})
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              {Math.round(totalRevenue).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {completedCount} completed sales
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Today&apos;s Revenue
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {Math.round(todayRevenue).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {todaySalesList.length} sales today
            </p>
          </div>

          {/* If Owner/Admin show Net Profit, else show Completed Transactions */}
          {!isCashier ? (
            <div className="rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Net Gross Profit
                </p>
                <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <TrendingUp className="size-3" />
                  {overallMargin.toFixed(1)}% Margin
                </span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                +{Math.round(totalNetProfit).toLocaleString()}{" "}
                <span className="text-xs font-semibold text-emerald-600">ETB</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                COGS: {Math.round(totalCOGS).toLocaleString()} ETB
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Completed Transactions
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
                {completedCount}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                All registered checkout tickets
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Average Ticket (AOV)
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              {avgTicket.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">Per checkout transaction</p>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
          {/* Header Toolbar with Date Presets & Search */}
          <div className="border-b border-zinc-200/80 px-3.5 sm:px-5 py-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                  Sales History & Ledger
                </h1>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
                  {filteredSales.length}
                </span>
              </div>

              {/* Action Buttons: Audit Print & Export */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(true)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <FileText className="size-3.5 text-zinc-500" />
                  <span>Audit Statement</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <Download className="size-3.5 text-zinc-500" />
                  <span>Export CSV</span>
                </button>

                <Link
                  href="/pos"
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-[#c0e763] px-3 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
                >
                  <ShoppingCart className="size-3.5" />
                  <span>New Sale</span>
                </Link>
              </div>
            </div>

            {/* Filter Bar: Date Preset Pills & Search Input */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              {/* Date Presets */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {(
                  [
                    { id: "ALL", label: "All Time" },
                    { id: "TODAY", label: "Today" },
                    { id: "THIS_WEEK", label: "This Week" },
                    { id: "THIS_MONTH", label: "This Month" },
                    { id: "CUSTOM", label: "Custom Range" },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setDateFilter(preset.id);
                      setPage(1);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      dateFilter === preset.id
                        ? "bg-zinc-900 text-white shadow-xs"
                        : "border border-zinc-200 bg-zinc-50/80 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Search Bar & Advanced Filter Popover */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search receipt, item, customer, TxID..."
                    className="h-8 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                      selectedMethod !== "ALL" || selectedStatus !== "ALL"
                        ? "border-[#c0e763] bg-[#c0e763]/20 text-zinc-950 font-semibold"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <Filter className="size-3.5" />
                    <span>Filters</span>
                    {(selectedMethod !== "ALL" || selectedStatus !== "ALL") && (
                      <span className="size-1.5 rounded-full bg-[#82a823]" />
                    )}
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 top-10 z-30 w-64 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xl text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="font-bold text-zinc-900">
                          Filter Transactions
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMethod("ALL");
                            setSelectedStatus("ALL");
                            setDateFilter("ALL");
                            setCustomStartDate("");
                            setCustomEndDate("");
                            setShowFilterDropdown(false);
                          }}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900"
                        >
                          <RotateCcw className="size-3" />
                          Reset
                        </button>
                      </div>

                      <div>
                        <label className="mb-1 block font-medium text-zinc-600">
                          Payment Tender
                        </label>
                        <select
                          value={selectedMethod}
                          onChange={(e) => setSelectedMethod(e.target.value)}
                          className="h-8 w-full rounded-md border border-zinc-200 px-2 text-zinc-900"
                        >
                          <option value="ALL">All Tenders</option>
                          <option value="CASH">Cash</option>
                          <option value="BANK">Bank Transfer / Card</option>
                          <option value="TELEBIRR">Telebirr / Mobile</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block font-medium text-zinc-600">
                          Status
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="h-8 w-full rounded-md border border-zinc-200 px-2 text-zinc-900"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                          <option value="REFUNDED">Refunded</option>
                          <option value="CANCELLED">Voided / Cancelled</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Range Picker row when "CUSTOM" selected */}
            {dateFilter === "CUSTOM" && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2.5 text-xs animate-in fade-in duration-150">
                <CalendarDays className="size-4 text-zinc-500" />
                <span className="font-semibold text-zinc-700">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs font-mono text-zinc-800"
                />
                <span className="font-semibold text-zinc-700 ml-1">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs font-mono text-zinc-800"
                />
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 ml-2"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sales History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Receipt #</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold">Customer & Items</th>
                  <th className="px-5 py-3 font-semibold">Tender Channel</th>
                  <th className="px-5 py-3 font-semibold">Total Revenue</th>
                  {!isCashier && (
                    <th className="px-5 py-3 font-semibold text-emerald-800">
                      Est. Profit
                    </th>
                  )}
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={isCashier ? 7 : 8} className="py-12 text-center">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isCashier ? 7 : 8}
                      className="py-12 text-center text-zinc-400"
                    >
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                        <Receipt className="size-6" />
                      </div>
                      <p className="mt-3 text-xs font-bold text-zinc-800">
                        No sales transactions match your filters
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Try clearing search keywords or selecting a broader date
                        timeframe.
                      </p>
                      <Link
                        href="/pos"
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Plus className="size-3.5" />
                        <span>Go to POS Register</span>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  currentSales.map((sale) => {
                    const method = (sale.paymentMethod || "").toUpperCase();
                    const isCash = method === "CASH";
                    const isBank =
                      method === "BANK" ||
                      method === "CARD" ||
                      method === "BANK_TRANSFER";
                    const isTelebirr = method === "TELEBIRR" || method === "MOBILE";
                    const totalVal = parseFloat(String(sale.totalAmount || "0"));
                    const f = computeSaleFinancials(sale);

                    return (
                      <tr
                        key={sale.id}
                        className="transition-colors hover:bg-zinc-50/80"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-900">
                          #RCP-{sale.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">
                          {new Date(sale.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="font-semibold text-zinc-900 truncate">
                            {sale.customer?.name || "Walk-in Customer"}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {sale.items && sale.items.length > 0
                              ? sale.items
                                  .map(
                                    (it) =>
                                      `${it.quantity}x ${it.product?.name || it.name || "Item"}`,
                                  )
                                  .join(", ")
                              : "Standard POS Sale"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            {isCash && (
                              <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                <Banknote className="size-3 text-emerald-600" />
                                Cash
                              </span>
                            )}
                            {isBank && (
                              <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                                <Landmark className="size-3 text-blue-600" />
                                {sale.bankName
                                  ? sale.bankName.slice(0, 18)
                                  : "Bank Transfer"}
                              </span>
                            )}
                            {isTelebirr && (
                              <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                <Smartphone className="size-3 text-amber-600" />
                                Telebirr
                              </span>
                            )}
                            {!isCash && !isBank && !isTelebirr && (
                              <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                                {sale.paymentMethod || "Other"}
                              </span>
                            )}
                            {sale.paymentReference && (
                              <span className="font-mono text-[10px] text-zinc-400">
                                Ref: {sale.paymentReference}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 tabular-nums">
                          {totalVal.toLocaleString()} ETB
                        </td>
                        {!isCashier && (
                          <td className="px-5 py-3.5 font-mono tabular-nums">
                            {f.netProfit !== undefined ? (
                              <div>
                                <span className="font-bold text-emerald-700">
                                  +{f.netProfit.toFixed(2)} ETB
                                </span>
                                <span className="block text-[10px] text-emerald-800 font-sans">
                                  {f.marginPct?.toFixed(1)}% margin
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 text-[11px]">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-5 py-3.5">
                          {sale.status === "CANCELLED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              <span className="size-1.5 rounded-full bg-red-600" />
                              Voided
                            </span>
                          ) : sale.status === "REFUNDED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                              <span className="size-1.5 rounded-full bg-purple-600" />
                              Refunded
                            </span>
                          ) : sale.status === "PARTIALLY_REFUNDED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              <span className="size-1.5 rounded-full bg-amber-600" />
                              Part-Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(sale)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              <Eye className="size-3.5 text-zinc-500" />
                              <span>Receipt</span>
                            </button>
                            {!isCashier &&
                              sale.status !== "CANCELLED" &&
                              sale.status !== "REFUNDED" && (
                                <button
                                  type="button"
                                  onClick={() => setReturnTargetSale(sale)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition-colors"
                                >
                                  <RotateCcw className="size-3 text-purple-600" />
                                  <span>Return</span>
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
                <span className="font-semibold text-zinc-900 font-mono">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-zinc-900 font-mono">
                  {Math.min(page * PAGE_SIZE, filteredSales.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-zinc-900 font-mono">
                  {filteredSales.length}
                </span>{" "}
                receipts
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-zinc-200 px-2.5 py-1 font-medium hover:bg-zinc-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-xs">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-zinc-200 px-2.5 py-1 font-medium hover:bg-zinc-50 disabled:opacity-40"
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
