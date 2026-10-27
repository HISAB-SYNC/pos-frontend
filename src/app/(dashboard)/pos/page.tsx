"use client";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Scale,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  UserPlus,
  Users,
  Wallet,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createCustomer, createSale, getCustomers, saveCreditSaleItems } from "@/lib/api/app-data";
import { getProducts } from "@/lib/api/shops";
import type { Customer, Product, Sale } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";
import { cacheProducts, getCachedProducts, queueOfflineSale, useOfflineStatus, type OfflineSale } from "@/lib/offline";
import {
  formatQuantity,
  isFractionalUnit,
  calculateLineTotal,
  calculateQuantityFromAmount,
  FRACTION_PRESETS,
} from "@/lib/utils/units";

type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
  customTotal?: number;
  isCustomPrice?: boolean;
};

type PaymentMethodType = "CASH" | "CARD" | "BANK" | "BANK_TRANSFER" | "TELEBIRR" | "MOBILE" | "DEBT";

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
/* Modal: Quick Add Customer                                          */
/* ------------------------------------------------------------------ */
function QuickAddCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createCustomer(activeShopId, {
        name: name.trim(),
        phone: phone.trim() || "+251912345678",
        address: address.trim() || "Addis Ababa",
      });
      onCreated({
        ...created,
        creditLimit,
        debtBalance: "0",
        totalCreditPurchases: 0,
        totalPaid: 0,
        debtHistory: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xl animate-in zoom-in-95 duration-100">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Register New Customer</h2>
            <p className="text-[11px] text-zinc-500">Record customer profile for cash or debt transactions</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-700">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Ali"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 234 5678"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Address / Location</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Bole, Addis Ababa"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Credit Limit (ETB)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-md bg-slate-900 px-4 py-1.5 font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Debt Confirmation Dialog                                    */
/* ------------------------------------------------------------------ */
/* Modal: Order Review & Confirmation                                 */
/* ------------------------------------------------------------------ */
function OrderConfirmationModal({
  cart,
  subtotal,
  discountVal,
  total,
  effectivePaid,
  changeAmount,
  debtAdditionAmount,
  paymentMethod,
  bankName,
  paymentReference,
  customer,
  currentCustomerDebt,
  newProjectedDebt,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  cart: CartItem[];
  subtotal: number;
  discountVal: number;
  total: number;
  effectivePaid: number;
  changeAmount: number;
  debtAdditionAmount: number;
  paymentMethod: PaymentMethodType;
  bankName?: string;
  paymentReference?: string;
  customer?: Customer | null;
  currentCustomerDebt: number;
  newProjectedDebt: number;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const methodLabel =
    paymentMethod === "BANK"
      ? bankName || "Bank Transfer"
      : paymentMethod === "TELEBIRR"
      ? "Telebirr"
      : "Cash";

  // Keyboard shortcut: Press Enter to confirm, Escape to cancel/back
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !isSubmitting) {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Escape" && !isSubmitting) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, onClose, isSubmitting]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
              <Receipt className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950">Review &amp; Confirm Sale</h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                {cart.length} item type{cart.length === 1 ? "" : "s"} ({formatQuantity(totalItemsCount)} total units) • {customer ? customer.name : "Walk-in Customer"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            title="Close review"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="my-3.5 space-y-3 text-xs">
          {/* Itemized Order Table */}
          <div className="rounded-lg border border-zinc-200/80 bg-white overflow-hidden shadow-2xs">
            <div className="grid grid-cols-[1fr_90px_90px] px-3 py-1.5 font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-50/80 border-b border-zinc-200/70">
              <span>Item &amp; Unit Rate</span>
              <span className="text-center">Qty / Scale</span>
              <span className="text-right">Line Total</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-zinc-100 px-3 py-0.5">
              {cart.map((item) => {
                const lineTotal = calculateLineTotal(item.quantity, item.unitPrice, item.customTotal);

                return (
                  <div key={item.product.id} className="grid grid-cols-[1fr_90px_90px] items-center py-2 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold text-zinc-900" title={item.product.name}>
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                        <span>
                          {item.unitPrice.toLocaleString()} ETB/{item.product.unit || "pcs"}
                        </span>
                        {item.isCustomPrice && (
                          <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-900 border border-amber-200">
                            Deal
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-center font-mono font-bold text-zinc-900 tabular-nums">
                      {formatQuantity(item.quantity)}{" "}
                      <span className="text-[10px] font-normal text-zinc-500">{item.product.unit || "pcs"}</span>
                    </div>
                    <div className="text-right font-mono font-bold text-zinc-950 tabular-nums">
                      {lineTotal.toLocaleString()} ETB
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Financial Breakdown */}
          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-3 space-y-2">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">{subtotal.toLocaleString()} ETB</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Discount Applied:</span>
                  <span className="font-mono tabular-nums">-{discountVal.toLocaleString()} ETB</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-zinc-200/70 pt-1.5 font-bold">
                <span className="text-zinc-900 uppercase text-[11px] tracking-wider">Total Payable:</span>
                <span className="font-mono text-base text-zinc-950 tabular-nums">
                  {total.toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
                </span>
              </div>
            </div>

            {/* Payment Channel Particulars */}
            <div className="border-t border-zinc-200/70 pt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Tender Channel:</span>
                <span className="font-semibold text-zinc-900">{methodLabel}</span>
              </div>
              {paymentMethod === "CASH" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cash Received:</span>
                    <span className="font-mono font-bold text-zinc-900 tabular-nums">
                      {effectivePaid.toLocaleString()} ETB
                    </span>
                  </div>
                  {changeAmount > 0 && (
                    <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 rounded px-2 py-1">
                      <span>Cash Change Due:</span>
                      <span className="font-mono tabular-nums">{changeAmount.toLocaleString()} ETB</span>
                    </div>
                  )}
                </>
              ) : (
                paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">TxID / Reference:</span>
                    <span className="font-mono font-medium text-zinc-900">{paymentReference}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Credit Debt Notice if applicable */}
          {debtAdditionAmount > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <HandCoins className="size-3.5 text-amber-700" />
                <span>Credit / Debt Obligation for {customer?.name || "Customer"}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-zinc-600">
                  <span>Previous Balance:</span>
                  <span className="font-mono tabular-nums">{currentCustomerDebt.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between font-semibold text-amber-800">
                  <span>Added to Debt:</span>
                  <span className="font-mono text-rose-600 tabular-nums">
                    +{debtAdditionAmount.toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-1 text-xs font-bold text-rose-700">
                  <span>New Total Customer Debt:</span>
                  <span className="font-mono tabular-nums">{newProjectedDebt.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ← Back to Cart
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 rounded-md px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 ${
              debtAdditionAmount > 0
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-[#5B4FE9] hover:bg-[#4D40D9]"
            }`}
          >
            {isSubmitting ? (
              <span>Processing Transaction...</span>
            ) : debtAdditionAmount > 0 ? (
              <>
                <HandCoins className="size-3.5" />
                <span>Confirm &amp; Record Credit (Enter)</span>
              </>
            ) : (
              <>
                <Check className="size-3.5 stroke-[3]" />
                <span>Confirm &amp; Complete Sale (Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Sale Receipt / Success                                      */
/* ------------------------------------------------------------------ */
function SaleReceiptModal({
  sale,
  onClose,
  onNewSale,
}: {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const paid = sale.amountPaid !== undefined ? parseFloat(String(sale.amountPaid)) : (sale.splitDetails?.cashAmount ?? parseFloat(sale.totalAmount));
  const debt = sale.debtAmount !== undefined ? parseFloat(String(sale.debtAmount)) : (sale.splitDetails?.debtAmount ?? Math.max(0, parseFloat(sale.totalAmount) - paid));
  const isDebtSale = debt > 0;

  const methodLabel = sale.paymentMethod === "BANK" ? "Bank Transfer" : sale.paymentMethod === "TELEBIRR" ? "Telebirr" : "Cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-100">
        {/* Receipt Header */}
        <div className="flex flex-col items-center border-b border-zinc-100 pb-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="size-5" />
          </div>
          <h2 className="mt-2.5 text-sm font-bold text-zinc-950">Sale Completed Successfully</h2>
          <p className="font-mono text-[10px] text-zinc-400">RECEIPT #{sale.id.slice(0, 12).toUpperCase()}</p>
          {sale.paymentReference?.includes("Offline") && (
            <div className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 border border-amber-200">
              Recorded Offline • Queued for Automatic Sync
            </div>
          )}
        </div>

        {/* Receipt Slip */}
        <div className="my-3 space-y-2.5 text-xs">
          <div className="rounded-md border border-zinc-100 bg-zinc-50/70 p-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Date &amp; Time:</span>
              <span className="font-medium text-zinc-800">{new Date().toLocaleString()}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-bold text-zinc-900">{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Tender Method:</span>
              <span className="font-semibold text-zinc-900">{methodLabel}</span>
            </div>
            {sale.bankName && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Bank / Channel:</span>
                <span className="font-medium text-zinc-800">{sale.bankName}</span>
              </div>
            )}
            {sale.paymentReference && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Reference:</span>
                <span className="font-mono text-zinc-800">{sale.paymentReference}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200/60 pt-1">
              <span className="text-zinc-500">Amount Tendered:</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">{paid.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="max-h-32 overflow-y-auto rounded-md border border-zinc-200/80 p-2.5 space-y-1.5 text-[11px]">
            {sale.items?.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="font-medium text-zinc-800">
                    {formatQuantity(it.quantity, it.product?.unit || it.unit || "pcs")} × {it.product?.name || it.name || `Item #${it.productId.slice(0, 6)}`}
                  </span>
                  {it.isCustomPrice && (
                    <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-800">
                      Deal
                    </span>
                  )}
                </div>
                <span className="font-mono font-semibold text-zinc-900 tabular-nums shrink-0">{it.subtotal} ETB</span>
              </div>
            ))}
          </div>

          {/* Credit Debt Notice if applicable */}
          {isDebtSale && (
            <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2.5 text-[11px] space-y-1">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Credit Balance Added:</span>
                <span className="font-mono text-rose-600 tabular-nums">+{debt.toLocaleString()} ETB</span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-baseline justify-between border-t border-zinc-100 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Grand Total</span>
            <span className="font-mono text-base font-bold text-zinc-950 tabular-nums">
              {parseFloat(sale.totalAmount).toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Printer className="size-3.5 text-zinc-500" />
            Print Docket
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNewSale();
            }}
            className="flex items-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#4D40D9]"
          >
            <span>Next Customer</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Measure Item & Custom Price Calculator                      */
/* ------------------------------------------------------------------ */
function MeasureItemModal({
  item,
  onClose,
  onSave,
}: {
  item: CartItem;
  onClose: () => void;
  onSave: (quantity: number, customTotal?: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<"MEASURE" | "BUDGET">("MEASURE");
  const [quantityInput, setQuantityInput] = useState<string>(String(item.quantity));
  const [budgetInput, setBudgetInput] = useState<string>("");
  const [isCustomPrice, setIsCustomPrice] = useState<boolean>(item.isCustomPrice || false);
  const [customPriceInput, setCustomPriceInput] = useState<string>(
    item.customTotal !== undefined ? String(item.customTotal) : ""
  );

  const unit = item.product.unit || "pcs";
  const unitPrice = item.unitPrice || parseFloat(item.product.price || "0");
  const parsedQty = parseFloat(quantityInput) || 0;
  const standardTotal = calculateLineTotal(parsedQty, unitPrice);
  const effectiveTotal =
    isCustomPrice && parseFloat(customPriceInput) >= 0 ? parseFloat(customPriceInput) : standardTotal;

  const handleBudgetChange = (val: string) => {
    setBudgetInput(val);
    const budgetNum = parseFloat(val) || 0;
    if (budgetNum > 0 && unitPrice > 0) {
      const computedQty = calculateQuantityFromAmount(budgetNum, unitPrice);
      setQuantityInput(String(computedQty));
    }
  };

  const handleApplyPreset = (val: number) => {
    setQuantityInput(String(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty <= 0) return;
    const finalCustomTotal =
      isCustomPrice && parseFloat(customPriceInput) >= 0 ? parseFloat(customPriceInput) : undefined;
    onSave(parsedQty, finalCustomTotal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
              <Scale className="size-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950">{item.product.name}</h2>
              <p className="font-mono text-[11px] text-zinc-500">
                Rate: <span className="font-semibold text-zinc-800">{unitPrice.toLocaleString()} ETB / {unit}</span>
                {item.product.stockQuantity !== undefined && (
                  <span className="text-zinc-400"> • Stock: {formatQuantity(item.product.stockQuantity, unit)}</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="my-3.5 flex rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("MEASURE")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
              activeTab === "MEASURE"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Scale className="size-3.5" />
            <span>By Measurement ({unit})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("BUDGET")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
              activeTab === "BUDGET"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Calculator className="size-3.5" />
            <span>By Birr Amount</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {activeTab === "MEASURE" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">
                  Exact Quantity / Measurement ({unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    placeholder="e.g. 1.5"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-base font-bold text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-zinc-400">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Quick Fraction Presets */}
              <div>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Quick Fractions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {FRACTION_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleApplyPreset(p.value)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                        parseFloat(quantityInput) === p.value
                          ? "border-[#5B4FE9] bg-indigo-50 text-[#5B4FE9] font-bold"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">
                  Customer Budget / Target Cash (ETB)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={budgetInput}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    placeholder="e.g. 50"
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-base font-bold text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-zinc-400">
                    ETB
                  </span>
                </div>
              </div>

              {/* Quick Birr Budget Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[10, 20, 50, 100, 200].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleBudgetChange(String(b))}
                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] text-zinc-700 hover:bg-zinc-100"
                  >
                    +{b} ETB
                  </button>
                ))}
              </div>

              {/* Calculated Weight Card */}
              {parsedQty > 0 && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-2.5 text-emerald-900">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                    Calculated Weight to Measure:
                  </div>
                  <div className="mt-0.5 font-mono text-base font-bold">
                    {formatQuantity(parsedQty, unit)}
                  </div>
                  <p className="mt-0.5 text-[11px] text-emerald-700">
                    {budgetInput || "0"} ETB ÷ {unitPrice} ETB/{unit} = {parsedQty} {unit}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Custom Price / Bargain Override Section */}
          <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-800">
                <input
                  type="checkbox"
                  checked={isCustomPrice}
                  onChange={(e) => {
                    setIsCustomPrice(e.target.checked);
                    if (e.target.checked && !customPriceInput) {
                      setCustomPriceInput(String(standardTotal));
                    }
                  }}
                  className="rounded border-zinc-300 text-[#5B4FE9] focus:ring-[#5B4FE9]"
                />
                <span>Custom Agreed Price (Bargain / Special Deal)</span>
              </label>
              {isCustomPrice && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                  Override Active
                </span>
              )}
            </div>

            {isCustomPrice && (
              <div className="pt-1 space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      placeholder={String(standardTotal)}
                      className="h-8 w-full rounded border border-zinc-200 bg-white px-2.5 font-mono text-xs font-bold text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400">
                      ETB Total
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Standard total would be <span className="font-mono font-medium">{standardTotal.toLocaleString()} ETB</span>.
                  Charging a custom lump sum.
                </p>
              </div>
            )}
          </div>

          {/* Summary Box */}
          <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-100/60 px-3 py-2 text-xs">
            <div>
              <span className="text-zinc-500">Line Total:</span>
              <div className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                {effectiveTotal.toLocaleString()} ETB
              </div>
            </div>
            <div className="text-right">
              <span className="text-zinc-500">Quantity:</span>
              <div className="font-mono text-xs font-semibold text-zinc-800">
                {formatQuantity(parsedQty, unit)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={parsedQty <= 0}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Apply to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main POS Page Component                                            */
/* ------------------------------------------------------------------ */
export default function PosPage() {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const {
    isOnline,
    isForcedOffline,
    isSyncing,
    pendingCount,
    refreshStats,
    triggerSync,
    toggleForceOffline,
    checkConnectivity,
  } = useOfflineStatus(activeShopId, {
    onSyncComplete: (result) => {
      setSyncToastMessage(`✓ Synced ${result.salesSynced} offline sale${result.salesSynced === 1 ? "" : "s"} to database`);
      loadData();
      setTimeout(() => setSyncToastMessage(null), 4000);
    },
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [confirmClearCart, setConfirmClearCart] = useState(false);

  // Payment State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [bankName, setBankName] = useState<string>("Commercial Bank of Ethiopia (CBE)");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [amountPaidInput, setAmountPaidInput] = useState<string>("");

  // Modals
  const [measuringItem, setMeasuringItem] = useState<CartItem | null>(null);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Autofocus search on '/' key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadData = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await getCachedProducts(activeShopId);
        if (cached && cached.length > 0) {
          setProducts(cached);
        }
        return;
      }

      const [prodList, custList] = await Promise.all([
        getProducts(activeShopId),
        getCustomers(activeShopId),
      ]);
      setProducts(prodList);
      setCustomers(custList);

      if (prodList && prodList.length > 0) {
        cacheProducts(activeShopId, prodList).catch(() => {});
      }
    } catch {
      try {
        const cached = await getCachedProducts(activeShopId);
        if (cached && cached.length > 0) {
          setProducts(cached);
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return ["ALL", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "ALL" || p.category?.name === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected Customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + calculateLineTotal(item.quantity, item.unitPrice, item.customTotal),
      0
    );
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountVal);
  }, [subtotal, discountVal]);

  // Amount Paid & Debt
  const effectivePaid = useMemo(() => {
    if (amountPaidInput.trim() === "") return total;
    const val = parseFloat(amountPaidInput);
    return isNaN(val) ? total : Math.max(0, val);
  }, [amountPaidInput, total]);

  const debtAdditionAmount = useMemo(() => {
    return Math.max(0, total - effectivePaid);
  }, [total, effectivePaid]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return Math.max(0, effectivePaid - total);
  }, [paymentMethod, effectivePaid, total]);

  const currentCustomerDebt = selectedCustomer ? parseFloat(selectedCustomer.debtBalance || "0") : 0;
  const newProjectedDebt = currentCustomerDebt + debtAdditionAmount;

  // Cart Operations
  function addToCart(product: Product) {
    setValidationError("");
    if (product.stockQuantity <= 0) {
      setValidationError(`${product.name} is currently out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const step = isFractionalUnit(product.unit) ? 0.25 : 1;
        const nextQty = Math.round((existing.quantity + step) * 1000) / 1000;
        if (nextQty > product.stockQuantity) {
          setValidationError(
            `Max available stock (${formatQuantity(product.stockQuantity, product.unit)}) reached for ${product.name}.`
          );
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty, customTotal: undefined, isCustomPrice: false }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: parseFloat(product.price || "0"),
        },
      ];
    });
  }

  function updateCartItem(productId: string, quantity: number, customTotal?: number) {
    setValidationError("");
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (quantity > item.product.stockQuantity) {
            setValidationError(
              `Cannot exceed available stock (${formatQuantity(item.product.stockQuantity, item.product.unit)}) for ${item.product.name}.`
            );
            return item;
          }
          return {
            ...item,
            quantity: Math.round(quantity * 1000) / 1000,
            customTotal: customTotal !== undefined && customTotal >= 0 ? customTotal : undefined,
            isCustomPrice: customTotal !== undefined && customTotal >= 0,
          };
        }
        return item;
      })
    );
  }

  function updateQuantity(productId: string, delta: number) {
    setValidationError("");
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const isFrac = isFractionalUnit(item.product.unit);
            const step = isFrac ? (delta > 0 ? (delta === 1 ? 0.25 : delta) : (delta === -1 ? -0.25 : delta)) : delta;
            const nextQty = Math.round((item.quantity + step) * 1000) / 1000;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stockQuantity) {
              setValidationError(
                `Cannot exceed available stock (${formatQuantity(item.product.stockQuantity, item.product.unit)}) for ${item.product.name}.`
              );
              return item;
            }
            return {
              ...item,
              quantity: nextQty,
              customTotal: undefined,
              isCustomPrice: false,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function removeFromCart(productId: string) {
    setValidationError("");
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscountVal(0);
    setAmountPaidInput("");
    setPaymentReference("");
    setValidationError("");
  }

  function handleCheckoutClick() {
    setValidationError("");

    if (cart.length === 0) {
      setValidationError("Cart is empty. Please add products to checkout.");
      return;
    }

    for (const it of cart) {
      if (it.quantity > it.product.stockQuantity) {
        setValidationError(`Insufficient stock for "${it.product.name}". Available: ${it.product.stockQuantity}, in cart: ${it.quantity}.`);
        return;
      }
    }

    if (debtAdditionAmount > 0 && !selectedCustomer) {
      setValidationError(`Please select or register a customer for the outstanding credit balance of ${debtAdditionAmount.toLocaleString()} ETB.`);
      return;
    }

    setIsConfirmOrderModalOpen(true);
  }

  const processOfflineSale = async () => {
    if (debtAdditionAmount > 0) {
      setValidationError("Credit / Debt sales require an active internet connection to verify customer balance.");
      return;
    }

    const clientSaleId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "off-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const offlineReference = "OFF-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);

    const offlineSale: OfflineSale = {
      clientSaleId,
      shopId: activeShopId,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || null,
      items: cart.map((it) => {
        const lineTotal = calculateLineTotal(it.quantity, it.unitPrice, it.customTotal);
        const effectiveUnitPrice = it.quantity > 0 ? Math.round((lineTotal / it.quantity) * 100) / 100 : it.unitPrice;
        return {
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: effectiveUnitPrice,
          name: it.product.name,
          unit: it.product.unit,
          customTotal: it.customTotal,
          isCustomPrice: it.isCustomPrice,
        };
      }),
      subtotal,
      taxAmount: 0,
      discountAmount: discountVal,
      totalAmount: total,
      paymentMethod,
      bankName: paymentMethod === "CASH" ? undefined : bankName,
      paymentReference: offlineReference,
      createdAt: new Date().toISOString(),
      status: "PENDING",
    };

    await queueOfflineSale(offlineSale);

    setProducts((prev) =>
      prev.map((p) => {
        const inCart = cart.find((it) => it.product.id === p.id);
        if (inCart) {
          return {
            ...p,
            stockQuantity: Math.max(0, Math.round((p.stockQuantity - inCart.quantity) * 1000) / 1000),
          };
        }
        return p;
      })
    );

    const syntheticSale: Sale = {
      id: clientSaleId,
      shopId: activeShopId,
      customerId: selectedCustomer?.id || null,
      totalAmount: total.toFixed(2),
      amountPaid: effectivePaid.toFixed(2),
      debtAmount: "0.00",
      subtotal: subtotal.toFixed(2),
      discountAmount: discountVal.toFixed(2),
      paymentMethod,
      bankName,
      paymentReference: offlineReference + " (Offline - Pending Sync)",
      status: "COMPLETED",
      createdAt: offlineSale.createdAt,
      items: cart.map((it) => {
        const lineTotal = calculateLineTotal(it.quantity, it.unitPrice, it.customTotal);
        const effectiveUnitPrice = it.quantity > 0 ? Math.round((lineTotal / it.quantity) * 100) / 100 : it.unitPrice;
        return {
          productId: it.product.id,
          name: it.product.name,
          quantity: it.quantity,
          unitPrice: effectiveUnitPrice,
          subtotal: lineTotal.toFixed(2),
          unit: it.product.unit,
          customTotal: it.customTotal,
          isCustomPrice: it.isCustomPrice,
          product: {
            ...it.product,
            unit: it.product.unit,
          },
        };
      }),
      customer: selectedCustomer,
    };

    refreshStats();
    setCompletedSale(syntheticSale);
    setIsConfirmOrderModalOpen(false);
    setIsCartDrawerOpen(false);
    clearCart();
  };

  async function executeSale() {
    setIsProcessing(true);
    setValidationError("");

    // Offline Execution Path
    if (!isOnline) {
      try {
        await processOfflineSale();
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === "object" && "message" in err
            ? String((err as any).message)
            : "Failed to save offline sale.";
        setValidationError(errorMsg);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const sale = await createSale(activeShopId, {
        customerId: selectedCustomer?.id,
        items: cart.map((it) => {
          const lineTotal = calculateLineTotal(it.quantity, it.unitPrice, it.customTotal);
          const effectiveUnitPrice = it.quantity > 0 ? Math.round((lineTotal / it.quantity) * 100) / 100 : it.unitPrice;
          return {
            productId: it.product.id,
            quantity: it.quantity,
            unitPrice: effectiveUnitPrice,
            name: it.product.name,
          };
        }),
        discountAmount: discountVal,
        totalAmount: total,
        amountPaid: effectivePaid,
        paymentMethod,
        bankName: paymentMethod === "CASH" ? undefined : bankName,
        paymentReference: paymentMethod === "CASH" ? undefined : (paymentReference.trim() || undefined),
        notes: debtAdditionAmount > 0
          ? `Sale with ${paymentMethod} paid (${effectivePaid} ETB) + Remaining Debt (${debtAdditionAmount} ETB)`
          : `Full payment via ${paymentMethod}`,
      });

      if (debtAdditionAmount > 0 && selectedCustomer) {
        const debtItems = cart.map((it) => {
          const lineTotal = calculateLineTotal(it.quantity, it.unitPrice, it.customTotal);
          const effectiveUnitPrice = it.quantity > 0 ? Math.round((lineTotal / it.quantity) * 100) / 100 : it.unitPrice;
          return {
            productId: it.product.id,
            quantity: it.quantity,
            unitPrice: effectiveUnitPrice,
            totalPrice: lineTotal,
            name: it.product.name,
          };
        });
        if (sale && sale.id) {
          saveCreditSaleItems(sale.id, debtItems);
        }
        if (selectedCustomer.id) {
          saveCreditSaleItems(selectedCustomer.id, debtItems);
        }
      }

      await loadData();
      setCompletedSale(sale);
      setIsConfirmOrderModalOpen(false);
      setIsCartDrawerOpen(false);
      clearCart();
    } catch (err: unknown) {
      const isNetworkErr =
        (err && typeof err === "object" && "status" in err && (err as any).status === 0) ||
        (err && typeof err === "object" && "message" in err && /connect|fetch|network/i.test(String((err as any).message)));

      // Auto-fallback: If network connection failed and this isn't a debt sale, save to offline queue seamlessly!
      if (isNetworkErr && debtAdditionAmount === 0) {
        try {
          await processOfflineSale();
          checkConnectivity().catch(() => {});
          return;
        } catch (offlineErr: unknown) {
          const offlineMsg =
            offlineErr && typeof offlineErr === "object" && "message" in offlineErr
              ? String((offlineErr as any).message)
              : "Failed to queue offline sale.";
          setValidationError(`Network unavailable. Offline save failed: ${offlineMsg}`);
          return;
        }
      }

      if (isNetworkErr && debtAdditionAmount > 0) {
        setValidationError("Unable to connect to backend. Credit / Debt sales require an active connection to verify debt balance.");
        return;
      }

      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : "Failed to complete sale. Please try again.";
      setValidationError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return <LoadingState />;

  const renderOrderPanel = (isDrawer: boolean) => (
    <>
      <div className="space-y-3">
        {/* Cart Header with Accidental Clear Protection */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
              <ShoppingCart className="size-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950">Current Order</h2>
              <span className="text-[10px] text-zinc-400 font-mono">{cart.length} item{cart.length === 1 ? "" : "s"} in cart</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              confirmClearCart ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-[10px] font-semibold text-rose-600">Clear all?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart();
                      setConfirmClearCart(false);
                    }}
                    className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearCart(false)}
                    className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmClearCart(true);
                    setTimeout(() => setConfirmClearCart(false), 4000);
                  }}
                  className="text-[11px] font-medium text-zinc-400 hover:text-rose-600 transition-colors"
                >
                  Clear All
                </button>
              )
            )}
            {isDrawer && (
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                title="Close drawer"
              >
                <X className="size-3.5" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Validation Message */}
        {validationError && (
          <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs font-medium text-rose-700">
            <AlertCircle className="size-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Customer Account Selector */}
        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Customer Account</label>
            <button
              type="button"
              onClick={() => setIsAddCustModalOpen(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-900 hover:text-[#5B4FE9] transition-colors"
            >
              <UserPlus className="size-3 text-zinc-500" />
              + New Customer
            </button>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
          >
            <option value="">Walk-in Customer (Instant Cash)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({parseFloat(c.debtBalance || "0").toLocaleString()} ETB Debt)
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="flex items-center justify-between rounded-md bg-white p-2 text-[11px] border border-zinc-200/80">
              <div>
                <span className="font-semibold text-zinc-900">{selectedCustomer.name}</span>
                <span className="block text-zinc-400 font-mono text-[10px]">{selectedCustomer.phone || "No phone"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400">Current Debt:</span>
                <div className="font-mono font-bold text-rose-600 tabular-nums">
                  {currentCustomerDebt.toLocaleString()} ETB
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List with Generous Breathing Room */}
        <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {cart.length > 0 ? (
            cart.map((item) => {
              const lineTotal = calculateLineTotal(item.quantity, item.unitPrice, item.customTotal);
              const isFrac = isFractionalUnit(item.product.unit);

              return (
                <div
                  key={item.product.id}
                  className="group rounded-lg border border-zinc-200/80 bg-white p-2 space-y-1.5 transition-colors hover:border-zinc-300 shadow-2xs"
                >
                  {/* Top Line: Name, Unit Price, and Remove */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-zinc-900" title={item.product.name}>
                        {item.product.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                        <span className="font-mono">
                          {item.unitPrice.toLocaleString()} ETB / {item.product.unit || "pcs"}
                        </span>
                        {item.isCustomPrice && (
                          <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-900 border border-amber-200">
                            Deal Override
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Isolated Trash Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Bottom Line: Adjust Control & Line Total */}
                  <div className="flex items-center justify-between border-t border-zinc-100 pt-1.5">
                    {isFrac ? (
                      /* Measured / Scale Item: Single generous tap target without tiny -/+ buttons */
                      <button
                        type="button"
                        onClick={() => setMeasuringItem(item)}
                        className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-950 hover:bg-indigo-100 hover:border-indigo-300 transition-all active:scale-98"
                        title="Tap to weigh, pick fraction, or bargain price"
                      >
                        <Scale className="size-3 text-[#5B4FE9]" />
                        <span className="font-mono font-bold tabular-nums">
                          {formatQuantity(item.quantity)} {item.product.unit || "kg"}
                        </span>
                        <span className="text-[10px] font-medium text-[#5B4FE9]">
                          · Scale / Deal
                        </span>
                      </button>
                    ) : (
                      /* Piece Item: Generous, distinct - [Qty] + stepper */
                      <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="flex size-6 items-center justify-center text-zinc-600 hover:bg-white hover:text-zinc-950 rounded-l transition-colors"
                          title="Subtract 1"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-[28px] px-1 text-center font-mono text-xs font-bold text-zinc-900 tabular-nums">
                          {formatQuantity(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="flex size-6 items-center justify-center text-zinc-600 hover:bg-white hover:text-zinc-950 rounded-r transition-colors"
                          title="Add 1"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    )}

                    {/* Line Total */}
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-zinc-950 tabular-nums">
                        {lineTotal.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              Cart is empty. Select products or scan barcode.
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2 border-t border-zinc-100 pt-2.5 text-xs">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tender Channel</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "CASH", label: "Cash", icon: Banknote },
              { id: "BANK", label: "Bank Transfer", icon: Landmark },
              { id: "TELEBIRR", label: "Telebirr", icon: Smartphone },
            ].map((m) => {
              const isSelected = paymentMethod === m.id;
              const IconComponent = m.icon;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const nextMethod = m.id as PaymentMethodType;
                    setPaymentMethod(nextMethod);
                    if (nextMethod === "TELEBIRR") {
                      setBankName("Telebirr");
                    } else if (nextMethod === "BANK" && bankName === "Telebirr") {
                      setBankName("Commercial Bank of Ethiopia (CBE)");
                    }
                  }}
                  className={`flex flex-col items-center justify-center rounded-md border py-1.5 px-1 text-center transition-all ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <IconComponent className="size-3.5" />
                  <span className="mt-1 text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* CASH ONLY: Amount Paid & Quick Ethiopian Birr Tender Chips */}
          {paymentMethod === "CASH" && (
            <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-2 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cash Received:</label>
                <span className="font-mono text-[11px] font-semibold text-zinc-600">Total: {total.toLocaleString()} ETB</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  placeholder={String(total)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-xs font-bold text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                />
                <span className="text-xs font-semibold text-zinc-500">ETB</span>
              </div>

              {/* Quick Cash Tender Chips */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(total))}
                  className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-800 hover:bg-zinc-100"
                >
                  Exact ({total} ETB)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(total + 50))}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                >
                  +50
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(total + 100))}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(total + 500))}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(Math.round(total / 2)))}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                >
                  Half
                </button>
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput("0")}
                    className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 hover:bg-amber-100"
                    title="Charge 0 ETB cash and record full amount as debt on customer account"
                  >
                    Credit (0 ETB)
                  </button>
                )}
              </div>

              {/* Cash Change Due */}
              {changeAmount > 0 && (
                <div className="flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-800">
                  <span>Cash Change Due:</span>
                  <span className="font-mono text-emerald-900 tabular-nums">{changeAmount.toLocaleString()} ETB</span>
                </div>
              )}
            </div>
          )}

          {/* TELEBIRR ONLY: Clean wallet banner + reference */}
          {paymentMethod === "TELEBIRR" && (
            <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-2.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                <Smartphone className="size-3.5 text-emerald-600" />
                <span>Telebirr Instant Transfer ({total.toLocaleString()} ETB)</span>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  TxID / Reference (Optional):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. FT2409... or Slip #"
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* BANK ONLY: Bank selector + reference */}
          {paymentMethod === "BANK" && (
            <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-2.5 space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Bank Name:
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                >
                  {POPULAR_BANKS.filter((b) => b !== "Telebirr").map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  TxID / Slip # (Optional):
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. CBE12345678"
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Credit Notice Banner */}
        {debtAdditionAmount > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <HandCoins className="size-3.5 text-amber-700" />
              <span>Credit / Debt Notice</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">Target Account:</span>
                <span className={`font-semibold ${selectedCustomer ? "text-zinc-900" : "text-rose-600 font-bold"}`}>
                  {selectedCustomer ? selectedCustomer.name : "⚠️ Required (Select Customer)"}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-amber-800">Added to Debt:</span>
                <span className="font-mono text-rose-600 tabular-nums">+{debtAdditionAmount.toLocaleString()} ETB</span>
              </div>
              {selectedCustomer && (
                <div className="flex justify-between border-t border-amber-200 pt-1 text-xs font-bold text-rose-700">
                  <span>Projected Debt Balance:</span>
                  <span className="font-mono tabular-nums">{newProjectedDebt.toLocaleString()} ETB</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Subtotal, Discount & Checkout Button */}
      <div className="mt-3 space-y-2 border-t border-zinc-100 pt-2.5 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span className="font-mono font-medium text-zinc-900 tabular-nums">{subtotal.toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>Discount</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={discountVal || ""}
                onChange={(e) => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="h-6 w-16 rounded border border-zinc-200 bg-white px-1.5 text-right font-mono text-xs focus:border-[#5B4FE9] focus:outline-none"
              />
              <span>ETB</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-zinc-100 pt-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Payable</span>
            <span className="font-mono text-lg font-bold text-zinc-950 tabular-nums">
              {total.toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isProcessing || cart.length === 0}
          onClick={handleCheckoutClick}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-md text-xs font-bold tracking-tight shadow-2xs transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${
            debtAdditionAmount > 0
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-[#5B4FE9] text-white hover:bg-[#4D40D9]"
          }`}
        >
          {isProcessing ? (
            <span className="font-medium">Processing Transaction...</span>
          ) : debtAdditionAmount > 0 ? (
            <>
              <HandCoins className="size-4" />
              <span>Complete Sale (+{debtAdditionAmount.toLocaleString()} ETB Debt)</span>
            </>
          ) : (
            <>
              <Check className="size-4 stroke-[3]" />
              <span>Charge {total.toLocaleString()} ETB</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1fr_400px]">
        {/* ================================================================= */}
        {/* Left Column: Product Catalog & Category Filters                   */}
        {/* ================================================================= */}
        <div className="min-w-0 space-y-3.5">
          {/* Header & Quick Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-zinc-950">POS Terminal</h1>
                {isOnline ? (
                  <button
                    type="button"
                    onClick={toggleForceOffline}
                    title="Online and connected to backend. Click to switch to Offline Mode manually."
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-all hover:opacity-80 cursor-pointer ${
                      pendingCount > 0
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        pendingCount > 0 ? "bg-indigo-500" : "bg-emerald-500 animate-pulse"
                      }`}
                    />
                    <Wifi className="size-3 text-emerald-600" />
                    <span>{pendingCount > 0 ? `Online (${pendingCount} queued)` : "Online"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleForceOffline}
                    title={isForcedOffline ? "Manual offline mode active. Click to reconnect." : "Backend unreachable. Click to recheck connectivity."}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <WifiOff className="size-3 text-amber-600" />
                    <span>{isForcedOffline ? "Offline (Manual)" : "Offline Mode"} {pendingCount > 0 ? `(${pendingCount} queued)` : ""}</span>
                  </button>
                )}
                {isOnline && pendingCount > 0 && (
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => triggerSync()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
                    title="Upload offline sales to cloud database"
                  >
                    <RefreshCw className={`size-3 text-indigo-600 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500">Scan barcode, search SKU, or tap items to add to cart</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products or SKU (Press / to focus)..."
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-10 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
                />
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                  <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono text-[9px] text-zinc-400">
                    /
                  </kbd>
                </div>
              </div>

              {/* Cart Drawer Trigger for < 2xl screens */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex 2xl:hidden h-9 items-center gap-2 rounded-md bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-[#5B4FE9] active:scale-95 shrink-0"
                title="Open checkout panel"
              >
                <ShoppingCart className="size-3.5 text-indigo-400" />
                <span>Order ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                {cart.length > 0 && (
                  <span className="border-l border-slate-700 pl-2 font-mono font-bold text-indigo-300">
                    {total.toLocaleString()} ETB
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sync Success Notification */}
          {syncToastMessage && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{syncToastMessage}</span>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-2xs font-semibold"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Products Grid: strictly 3 columns on tablet/laptop, 4 on wide desktop */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const inCart = cart.find((it) => it.product.id === product.id);
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <div
                  key={product.id}
                  className={`group flex flex-col justify-between rounded-lg border bg-white p-3 shadow-2xs transition-all hover:border-zinc-300 ${
                    inCart ? "border-[#5B4FE9] ring-1 ring-[#5B4FE9]/30" : "border-zinc-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-600">
                        {product.sku}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
                          isOutOfStock
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : product.stockQuantity < 10
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isOutOfStock ? "Out" : `${product.stockQuantity} left`}
                      </span>
                    </div>

                    <h3 className="mt-2 line-clamp-1 text-xs font-bold text-zinc-900">{product.name}</h3>
                    <p className="text-[10px] text-zinc-400">{product.category?.name || "General"}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                    <div className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                      {parseFloat(product.price || "0").toLocaleString()}{" "}
                      <span className="font-sans text-[10px] font-semibold text-zinc-400">
                        ETB / {product.unit || "pcs"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isFractionalUnit(product.unit) && (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            const existing = cart.find((it) => it.product.id === product.id);
                            if (existing) {
                              setMeasuringItem(existing);
                            } else {
                              const newItem: CartItem = {
                                product,
                                quantity: 1,
                                unitPrice: parseFloat(product.price || "0"),
                              };
                              setCart((prev) => [...prev, newItem]);
                              setMeasuringItem(newItem);
                            }
                          }}
                          className="flex h-7 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-[10px] font-bold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Measure weight or enter custom deal"
                        >
                          <Scale className="size-3 text-[#5B4FE9]" />
                          <span>Measure</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                        className="flex size-7 items-center justify-center rounded-md bg-slate-900 text-white transition-all hover:bg-[#5B4FE9] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Add item to cart"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* Right Column: Static Checkout Panel for 2xl Screens               */}
        {/* ================================================================= */}
        <div className="hidden 2xl:flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs min-w-0">
          {renderOrderPanel(false)}
        </div>
      </div>

      {/* ================================================================= */}
      {/* Slide-Over Checkout Drawer for < 2xl Screens (Laptops, Tablets)   */}
      {/* ================================================================= */}
      {isCartDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsCartDrawerOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-md sm:w-[440px] flex-col justify-between overflow-y-auto bg-white p-4 sm:p-5 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {renderOrderPanel(true)}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar for Screens < 2xl */}
      {cart.length > 0 && !isCartDrawerOpen && (
        <div className="sticky bottom-3 z-30 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-white shadow-xl animate-in slide-in-from-bottom-2 2xl:hidden">
          <div>
            <span className="text-[10px] text-slate-400">
              {cart.reduce((s, i) => s + i.quantity, 0)} items in cart
            </span>
            <div className="font-mono text-sm font-bold text-indigo-300">
              {total.toLocaleString()} ETB
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#4D40D9] active:scale-95"
          >
            <span>Review &amp; Pay</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Modals Container */}
      {isAddCustModalOpen && (
        <QuickAddCustomerModal
          onClose={() => setIsAddCustModalOpen(false)}
          onCreated={(cust) => {
            setCustomers((prev) => [cust, ...prev]);
            setSelectedCustomerId(cust.id);
            setIsAddCustModalOpen(false);
          }}
        />
      )}

      {isConfirmOrderModalOpen && (
        <OrderConfirmationModal
          cart={cart}
          subtotal={subtotal}
          discountVal={discountVal}
          total={total}
          effectivePaid={effectivePaid}
          changeAmount={changeAmount}
          debtAdditionAmount={debtAdditionAmount}
          paymentMethod={paymentMethod}
          bankName={bankName}
          paymentReference={paymentReference}
          customer={selectedCustomer}
          currentCustomerDebt={currentCustomerDebt}
          newProjectedDebt={newProjectedDebt}
          onClose={() => setIsConfirmOrderModalOpen(false)}
          onConfirm={executeSale}
          isSubmitting={isProcessing}
        />
      )}

      {completedSale && (
        <SaleReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            clearCart();
          }}
        />
      )}

      {measuringItem && (
        <MeasureItemModal
          item={measuringItem}
          onClose={() => setMeasuringItem(null)}
          onSave={(qty, customTotal) => {
            updateCartItem(measuringItem.product.id, qty, customTotal);
            setMeasuringItem(null);
          }}
        />
      )}
    </div>
  );
}
