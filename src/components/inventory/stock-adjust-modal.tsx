"use client";

import { Banknote, Landmark, ReceiptText, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { REASON_LABELS, REASONS_FOR, RecentProductChanges } from "@/components/inventory/stock-log";
import { PriceIssuesBox, usePriceGuard } from "@/components/products/price-guard";
import { createPurchase, createStockAdjustment, getFundsSummary, getSuppliers } from "@/lib/api";
import type {
  FundAccount,
  FundsSummary,
  MoneyAddedReason,
  Product,
  PurchaseFunding,
  StockAdjustmentReason,
  Supplier,
} from "@/lib/api/types";
import { balanceAfter as moneyBalanceAfter, lineTotal, shortfall as moneyShortfall } from "@/lib/utils/money";
import { formatQuantity, isFractionalUnit } from "@/lib/utils/units";

/* ------------------------------------------------------------------ */
/* Modal: Stock Adjustment                                            */
/* ------------------------------------------------------------------ */
const PAID_FROM_OPTIONS: Array<{
  key: PurchaseFunding;
  label: string;
  hint: string;
  icon: typeof Banknote;
}> = [
  { key: "CASH_DRAWER", label: "Cash Till", hint: "Paid with cash from the till", icon: Banknote },
  { key: "BANK", label: "Bank", hint: "Paid by bank transfer or card", icon: Landmark },
  { key: "TELEBIRR", label: "Telebirr", hint: "Paid from the shop's Telebirr", icon: Smartphone },
  { key: "SUPPLIER_CREDIT", label: "Pay later", hint: "Supplier gave it on credit. Money Left changes when you pay them (dashboard or Suppliers page).", icon: ReceiptText },
];

const ALREADY_IN_LABEL: Record<FundAccount, string> = {
  CASH_DRAWER: "Was already in the till",
  BANK: "Was already in the bank",
  TELEBIRR: "Was already in Telebirr",
};

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function StockAdjustModal({
  product,
  onClose,
  onAdjusted,
  shopId,
}: {
  product: Product | null;
  onClose: () => void;
  onAdjusted: () => void;
  shopId: string;
}) {
  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "REMOVE" | "SET">("ADD");
  const [quantity, setQuantity] = useState("");
  // Why stock changes when no money is paid; must fit the kind of change.
  const [reasonChoice, setReasonChoice] = useState<StockAdjustmentReason | "">("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [storeLocation, setStoreLocation] = useState("Main Store");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restock purchase details
  const [isPurchase, setIsPurchase] = useState(true);
  const [unitCost, setUnitCost] = useState(product?.buyingPrice ? String(product.buyingPrice) : "");
  // Optional: update the selling price while restocking (blank = keep it).
  const [sellingPrice, setSellingPrice] = useState("");
  // Typo / below-cost checks on the new buying price (and optional selling price).
  const restockPriceGuard = usePriceGuard({
    price: (parseFloat(sellingPrice) || 0) > 0 ? parseFloat(sellingPrice) : Number(product?.price || 0),
    buyingPrice: parseFloat(unitCost) || 0,
    previousPrice: product ? Number(product.price) || 0 : null,
    previousBuyingPrice: product ? Number(product.buyingPrice) || 0 : null,
  });
  const [paidFrom, setPaidFrom] = useState<PurchaseFunding>("CASH_DRAWER");
  const [supplierId, setSupplierId] = useState(product?.supplierId || "");
  const [supplierName, setSupplierName] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  // Answer to "where did the extra money come from?", tied to the account and amount it was given for.
  const [extraMoneyAnswer, setExtraMoneyAnswer] = useState<{ key: string; reason: MoneyAddedReason } | null>(null);

  useEffect(() => {
    let mounted = true;
    getSuppliers(shopId)
      .then((data) => {
        if (mounted && Array.isArray(data)) setSuppliers(data);
      })
      .catch(() => {});
    getFundsSummary(shopId)
      .then((data) => {
        if (mounted) setFunds(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [shopId]);

  if (!product) return null;

  const currentQty = product.stockQuantity || 0;
  const adjustQtyNum = parseFloat(quantity) || 0;
  const unitCostNum = parseFloat(unitCost) || 0;
  const totalCostNum = lineTotal(adjustQtyNum, unitCostNum);
  const isRestock = adjustmentType === "ADD" && isPurchase;
  const sellingPriceNum = parseFloat(sellingPrice) || 0;
  const currentSellingPrice = Number(product.price || 0);
  const reasonOptions = REASONS_FOR[adjustmentType];
  const reason: StockAdjustmentReason =
    reasonChoice && reasonOptions.includes(reasonChoice) ? reasonChoice : reasonOptions[0];

  let newQuantity = currentQty;
  if (adjustmentType === "ADD") newQuantity = Math.round((currentQty + adjustQtyNum) * 1000) / 1000;
  else if (adjustmentType === "REMOVE") newQuantity = Math.max(0, Math.round((currentQty - adjustQtyNum) * 1000) / 1000);
  else if (adjustmentType === "SET") newQuantity = Math.max(0, Math.round(adjustQtyNum * 1000) / 1000);

  const delta = Math.round((newQuantity - currentQty) * 1000) / 1000;

  // Money preview for the paying account
  const paidAccount = paidFrom === "SUPPLIER_CREDIT" ? null : (paidFrom as FundAccount);
  // A different account or amount needs a fresh answer about extra money.
  const answerKey = `${paidFrom}|${totalCostNum}`;
  const extraMoneyReason = extraMoneyAnswer?.key === answerKey ? extraMoneyAnswer.reason : null;
  const accountBalance = paidAccount && funds
    ? funds.accounts.find((a) => a.account === paidAccount)?.balance ?? 0
    : null;
  const shortfall = isRestock ? moneyShortfall(accountBalance, totalCostNum) : 0;
  const balanceAfter = moneyBalanceAfter(accountBalance, totalCostNum, extraMoneyReason ? shortfall : 0);
  const paidLabel = PAID_FROM_OPTIONS.find((o) => o.key === paidFrom)?.label ?? "";

  // Pay-later restocks must name who is owed, so the debt can be paid off later.
  const needsSupplier = isRestock && paidFrom === "SUPPLIER_CREDIT" && !supplierId && !supplierName.trim();

  const canSubmit =
    adjustQtyNum > 0 &&
    !needsSupplier &&
    !(isRestock && restockPriceGuard.blocked) &&
    (!isRestock || (unitCostNum > 0 && (shortfall === 0 || extraMoneyReason !== null)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      if (isRestock) {
        const selectedSupplier = suppliers.find((s) => s.id === supplierId);
        await createPurchase(shopId, {
          productId: product.id,
          quantity: adjustQtyNum,
          unitCost: unitCostNum,
          sellingPrice: sellingPriceNum > 0 ? sellingPriceNum : undefined,
          ...restockPriceGuard.flags,
          fundingSource: paidFrom,
          supplierId: selectedSupplier?.id,
          supplier: selectedSupplier ? undefined : supplierName.trim() || undefined,
          moneyAdded: shortfall > 0 && extraMoneyReason
            ? { amount: shortfall, reason: extraMoneyReason }
            : undefined,
        });
      } else {
        await createStockAdjustment(shopId, {
          productId: product.id,
          type: adjustmentType,
          quantity: adjustQtyNum,
          reason,
          notes: adjustNotes.trim() || undefined,
          location: storeLocation.trim() || undefined,
        });
      }

      onAdjusted();
      onClose();
    } catch (err) {
      if (isRestock && restockPriceGuard.handleServerError(err)) return;
      const message = (err as { message?: string })?.message;
      setError(message || "Could not save. Nothing was changed, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel = isSubmitting
    ? "Saving..."
    : isRestock && totalCostNum > 0
    ? paidFrom === "SUPPLIER_CREDIT"
      ? `Restock · ${formatEtb(totalCostNum)} ETB on credit`
      : `Restock · ${formatEtb(totalCostNum)} ETB from ${paidLabel}`
    : "Apply Adjustment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">Adjust Inventory Stock</h2>
            <p className="text-xs text-zinc-500">
              Product: <span className="font-semibold text-zinc-800">{product.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">Adjustment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("ADD")}
                className={`rounded-md border py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "ADD"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("REMOVE")}
                className={`rounded-md border py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "REMOVE"
                    ? "border-rose-600 bg-rose-50 text-rose-800 shadow-2xs"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                }`}
              >
                - Deduct Stock
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("SET")}
                className={`rounded-md border py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "SET"
                    ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                }`}
              >
                Set Fixed Qty
              </button>
            </div>
          </div>

          {adjustmentType === "ADD" && (
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
              <button
                type="button"
                onClick={() => setIsPurchase(true)}
                className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                  isPurchase ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                I bought this stock
              </button>
              <button
                type="button"
                onClick={() => setIsPurchase(false)}
                className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
                  !isPurchase ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                No money paid
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">
                {adjustmentType === "SET" ? "New Total Count *" : "Quantity *"}
              </label>
              <input
                type="number"
                min="0.001"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={isFractionalUnit(product.unit) ? "e.g. 1.5" : "e.g. 10"}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>

            {isRestock ? (
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">Buying price per unit (ETB) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="e.g. 1500"
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">Store Location</label>
                <input
                  type="text"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {isRestock && (
            <>
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">New selling price (optional)</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder={`Now ${formatEtb(currentSellingPrice)} ETB — leave blank to keep`}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono font-semibold text-zinc-900 placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                />
                {(() => {
                  const price = sellingPriceNum > 0 ? sellingPriceNum : currentSellingPrice;
                  if (unitCostNum <= 0 || price <= 0) return null;
                  const margin = ((price - unitCostNum) / price) * 100;
                  return (
                    <p className={`mt-1 text-[10px] ${price < unitCostNum ? "text-rose-700" : "text-zinc-500"}`}>
                      {price < unitCostNum
                        ? `Selling below buying price: you lose ${formatEtb(unitCostNum - price)} ETB per unit.`
                        : `Profit ${formatEtb(price - unitCostNum)} ETB per unit (${margin.toFixed(1)}% margin)${sellingPriceNum > 0 ? "" : " at the current price"}.`}
                    </p>
                  );
                })()}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-zinc-700">
                  {paidFrom === "SUPPLIER_CREDIT" ? "Supplier you owe *" : "Supplier (optional)"}
                </label>
                {suppliers.length > 0 ? (
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                  >
                    <option value="">Walk-in wholesaler</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Supplier name"
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                  />
                )}
                {needsSupplier && (
                  <p className="mt-1 text-[10px] text-amber-800">Pick the supplier for a pay-later restock, so you can pay them off later.</p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="font-semibold text-zinc-700">Paid from *</label>
                  {totalCostNum > 0 && (
                    <span className="font-mono text-xs font-bold text-zinc-900 tabular-nums">
                      Total {formatEtb(totalCostNum)} ETB
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAID_FROM_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = paidFrom === option.key;
                    const balance = option.key === "SUPPLIER_CREDIT"
                      ? null
                      : funds?.accounts.find((a) => a.account === option.key)?.balance;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setPaidFrom(option.key)}
                        className={`flex flex-col items-start gap-1 rounded-md border px-2.5 py-2 text-left transition-all ${
                          selected
                            ? "border-[#5B4FE9] bg-indigo-50/60 ring-1 ring-[#5B4FE9]/20"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${selected ? "text-zinc-900" : "text-zinc-600"}`}>
                          <Icon className={`size-3.5 ${selected ? "text-[#5B4FE9]" : "text-zinc-400"}`} />
                          {option.label}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
                          {option.key === "SUPPLIER_CREDIT"
                            ? "on credit"
                            : balance !== undefined && balance !== null
                            ? `${formatEtb(balance)} ETB`
                            : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-zinc-500">
                  {PAID_FROM_OPTIONS.find((o) => o.key === paidFrom)?.hint}
                </p>
              </div>

              {shortfall > 0 && paidAccount && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                  <p className="text-xs text-amber-900">
                    <span className="font-semibold">{paidLabel}</span> only shows{" "}
                    <span className="font-mono font-semibold tabular-nums">{formatEtb(Math.max(accountBalance ?? 0, 0))} ETB</span>.
                    Where did the other{" "}
                    <span className="font-mono font-semibold tabular-nums">{formatEtb(shortfall)} ETB</span> come from?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["OWNER_MONEY", "Owner's own money"],
                        ["ALREADY_IN_ACCOUNT", ALREADY_IN_LABEL[paidAccount]],
                      ] as Array<[MoneyAddedReason, string]>
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setExtraMoneyAnswer({ key: answerKey, reason: value })}
                        className={`rounded-md border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                          extraMoneyReason === value
                            ? "border-amber-600 bg-white text-amber-900 ring-1 ring-amber-500/20"
                            : "border-amber-200 bg-white/70 text-amber-800 hover:bg-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!isRestock && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">Why? *</label>
                <select
                  value={reason}
                  onChange={(e) => setReasonChoice(e.target.value as StockAdjustmentReason)}
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                >
                  {reasonOptions.map((r) => (
                    <option key={r} value={r}>
                      {REASON_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-zinc-700">Note (optional)</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. 2 bags torn in delivery"
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {!isRestock && <RecentProductChanges shopId={shopId} productId={product.id} unit={product.unit} />}

          {/* Real-time stock and money preview */}
          <div className="rounded-md border border-zinc-200 bg-zinc-50/80 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Stock</span>
              <div className="flex items-center gap-2">
                {adjustQtyNum > 0 && (
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      delta > 0 ? "text-emerald-600" : delta < 0 ? "text-rose-600" : "text-zinc-500"
                    }`}
                  >
                    ({delta > 0 ? `+${formatQuantity(delta)}` : formatQuantity(delta)})
                  </span>
                )}
                <span className="font-mono font-semibold text-zinc-500 tabular-nums">
                  {formatQuantity(currentQty, product.unit || "pcs")}
                </span>
                <span className="text-zinc-400">→</span>
                <span className="font-mono font-bold text-zinc-900 tabular-nums">
                  {formatQuantity(newQuantity, product.unit || "pcs")}
                </span>
              </div>
            </div>
            {isRestock && totalCostNum > 0 && (
              <div className="mt-1.5 flex items-center justify-between border-t border-zinc-200/60 pt-1.5 text-xs">
                <span className="text-zinc-500">
                  {paidFrom === "SUPPLIER_CREDIT" ? "Owed to supplier" : `${paidLabel} after this restock`}
                </span>
                {paidFrom === "SUPPLIER_CREDIT" ? (
                  <span className="font-mono font-bold text-amber-800 tabular-nums">+{formatEtb(totalCostNum)} ETB</span>
                ) : accountBalance !== null && balanceAfter !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-zinc-500 tabular-nums">{formatEtb(accountBalance)}</span>
                    <span className="text-zinc-400">→</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${balanceAfter < 0 ? "text-rose-700" : "text-zinc-900"}`}
                    >
                      {formatEtb(balanceAfter)} ETB
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-zinc-900 tabular-nums">−{formatEtb(totalCostNum)} ETB</span>
                )}
              </div>
            )}
          </div>

          {isRestock && (
            <PriceIssuesBox
              issues={restockPriceGuard.issues}
              confirmed={restockPriceGuard.confirmed}
              onConfirmChange={restockPriceGuard.setConfirmed}
            />
          )}

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="rounded-md bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
