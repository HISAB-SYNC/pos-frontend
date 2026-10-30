"use client";

import { Banknote, Landmark, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getFundsSummary, getSupplierPayables, getSupplierPayments, paySupplier } from "@/lib/api/app-data";
import type {
  FundAccount,
  FundsSummary,
  MoneyAddedReason,
  SupplierPayable,
  SupplierPayables,
  SupplierPayment,
} from "@/lib/api/types";

const ACCOUNT_OPTIONS: Array<{ key: FundAccount; label: string; icon: typeof Banknote }> = [
  { key: "CASH_DRAWER", label: "Cash Till", icon: Banknote },
  { key: "BANK", label: "Bank", icon: Landmark },
  { key: "TELEBIRR", label: "Telebirr", icon: Smartphone },
];

const ALREADY_IN_LABEL: Record<FundAccount, string> = {
  CASH_DRAWER: "Was already in the till",
  BANK: "Was already in the bank",
  TELEBIRR: "Was already in Telebirr",
};

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Stable key for a supplier: its id, or its name for suppliers without a record. */
export function supplierKey(s: { supplierId: string | null; supplierName: string | null }) {
  return s.supplierId ? `id:${s.supplierId}` : `name:${(s.supplierName || "").toLowerCase()}`;
}

export function PaySupplierModal({
  shopId,
  initialSupplierKey,
  onClose,
  onPaid,
}: {
  shopId: string;
  /** Preselects a supplier (see supplierKey). */
  initialSupplierKey?: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [payables, setPayables] = useState<SupplierPayables | null>(null);
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedKey, setSelectedKey] = useState(initialSupplierKey ?? "");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState<FundAccount>("CASH_DRAWER");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<SupplierPayment[]>([]);
  const [extraMoneyAnswer, setExtraMoneyAnswer] = useState<{ key: string; reason: MoneyAddedReason } | null>(null);
  // Restocks picked for this supplier; null means all of them.
  const [picked, setPicked] = useState<{ supplier: string; ids: Set<string> } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSupplierPayables(shopId), getFundsSummary(shopId).catch(() => null)])
      .then(([p, f]) => {
        if (!mounted) return;
        setPayables(p);
        setFunds(f);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      });
    return () => {
      mounted = false;
    };
  }, [shopId]);

  const suppliers = payables?.suppliers ?? [];
  // Fall back to the supplier owed the most when nothing (or something stale) is selected.
  const selected: SupplierPayable | undefined =
    suppliers.find((s) => supplierKey(s) === selectedKey) ?? suppliers[0];
  const activeKey = selected ? supplierKey(selected) : "";

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    getSupplierPayments(shopId, { supplierId: selected.supplierId, supplierName: selected.supplierName, limit: 3 })
      .then((rows) => {
        if (mounted) setHistory(rows);
      })
      .catch(() => {
        if (mounted) setHistory([]);
      });
    return () => {
      mounted = false;
    };
  }, [shopId, selected]);

  const owed = selected?.owed ?? 0;
  const restocks = selected?.purchases ?? [];
  const pickedIds = picked?.supplier === activeKey ? picked.ids : null;
  const isPicked = (id: string) => !pickedIds || pickedIds.has(id);
  const pickedRestocks = restocks.filter((p) => isPicked(p.id));
  const allPicked = pickedRestocks.length === restocks.length;
  // What the picked restocks still need; payments can't go above it.
  const payable = Math.round(pickedRestocks.reduce((sum, p) => sum + p.remaining, 0) * 100) / 100;
  const amountNum = Math.round((parseFloat(amount) || 0) * 100) / 100;
  const tooMuch = amountNum > payable + 0.001;

  function setPickedIds(ids: Set<string>) {
    setPicked({ supplier: activeKey, ids });
    const sum = restocks.filter((p) => ids.has(p.id)).reduce((total, p) => total + p.remaining, 0);
    setAmount(sum > 0 ? String(Math.round(sum * 100) / 100) : "");
  }

  function toggleRestock(id: string) {
    const ids = new Set(pickedRestocks.map((p) => p.id));
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    setPickedIds(ids);
  }

  function toggleAll() {
    setPickedIds(allPicked ? new Set() : new Set(restocks.map((p) => p.id)));
  }

  const balance = funds?.accounts.find((a) => a.account === account)?.balance ?? null;
  const shortfall = balance !== null && amountNum > balance ? Math.round((amountNum - balance) * 100) / 100 : 0;
  const answerKey = `${activeKey}|${account}|${amountNum}`;
  const extraMoneyReason = extraMoneyAnswer?.key === answerKey ? extraMoneyAnswer.reason : null;
  const balanceAfter =
    balance !== null ? Math.round((balance + (extraMoneyReason ? shortfall : 0) - amountNum) * 100) / 100 : null;
  const accountLabel = ACCOUNT_OPTIONS.find((o) => o.key === account)?.label ?? "";

  const canSubmit =
    !!selected &&
    pickedRestocks.length > 0 &&
    amountNum > 0 &&
    !tooMuch &&
    (shortfall === 0 || extraMoneyReason !== null) &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await paySupplier(shopId, {
        supplierId: selected.supplierId,
        supplierName: selected.supplierName,
        amount: amountNum,
        account,
        purchaseIds: allPicked ? undefined : pickedRestocks.map((p) => p.id),
        notes: notes.trim() || undefined,
        moneyAdded: shortfall > 0 && extraMoneyReason ? { amount: shortfall, reason: extraMoneyReason } : undefined,
      });
      onPaid();
      onClose();
    } catch (err) {
      const message = (err as { message?: string })?.message;
      setError(message || "Could not save the payment. Nothing was changed, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Pay supplier</h2>
            <p className="text-xs text-zinc-500">Settles pay-later restocks, oldest first.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {loadError ? (
          <p className="py-8 text-center text-xs text-zinc-500">Couldn&apos;t load what is owed. Please try again.</p>
        ) : !payables ? (
          <p className="py-8 text-center text-xs text-zinc-400">Loading…</p>
        ) : suppliers.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500">Nothing is owed to suppliers.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">Supplier</label>
              <select value={activeKey} onChange={(e) => setSelectedKey(e.target.value)} className={inputClass}>
                {suppliers.map((s) => (
                  <option key={supplierKey(s)} value={supplierKey(s)}>
                    {s.supplierName || "Unnamed supplier"} — owes {formatEtb(s.owed)} ETB
                  </option>
                ))}
              </select>
            </div>

            {restocks.length > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-semibold text-zinc-700">Restocks to settle</label>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-[11px] font-semibold text-[#5B4FE9] hover:underline"
                  >
                    {allPicked ? "Clear all" : "Select all"}
                  </button>
                </div>
                <ul className="max-h-44 divide-y divide-zinc-100 overflow-y-auto rounded-md border border-zinc-200/80">
                  {restocks.map((p) => (
                    <li key={p.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-zinc-50">
                        <input
                          type="checkbox"
                          checked={isPicked(p.id)}
                          onChange={() => toggleRestock(p.id)}
                          className="size-3.5 accent-[#5B4FE9]"
                        />
                        <span className="min-w-0 flex-1 truncate text-zinc-700">
                          {p.productName} × {p.quantity}
                          <span className="ml-1.5 font-mono text-[10px] text-zinc-400">{formatDate(p.purchasedAt)}</span>
                          {p.amountPaid > 0 && (
                            <span className="ml-1.5 text-[10px] text-zinc-400">({formatEtb(p.amountPaid)} paid)</span>
                          )}
                        </span>
                        <span className="shrink-0 font-mono font-semibold tabular-nums text-zinc-900">
                          {formatEtb(p.remaining)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {pickedRestocks.length} of {restocks.length} selected · {formatEtb(payable)} ETB. A smaller amount
                  pays the oldest selected first.
                </p>
              </div>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-semibold text-zinc-700">Amount (ETB) *</label>
                <button
                  type="button"
                  onClick={() => setAmount(String(payable))}
                  className="text-[11px] font-semibold text-[#5B4FE9] hover:underline"
                >
                  {allPicked ? "Pay all" : "Pay selected"} {formatEtb(payable)}
                </button>
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Up to ${formatEtb(payable)}`}
                className={`${inputClass} font-mono font-semibold`}
              />
              {tooMuch && (
                <p className="mt-1 text-[10px] text-rose-700">
                  That&apos;s more than the {formatEtb(payable)} ETB {allPicked ? "owed" : "for the selected restocks"}.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">Paid from *</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = account === option.key;
                  const optionBalance = funds?.accounts.find((a) => a.account === option.key)?.balance;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setAccount(option.key)}
                      className={`flex flex-col items-start gap-1 rounded-md border px-2.5 py-2 text-left transition-all ${
                        isSelected
                          ? "border-[#5B4FE9] bg-indigo-50/60 ring-1 ring-[#5B4FE9]/20"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${isSelected ? "text-zinc-900" : "text-zinc-600"}`}
                      >
                        <Icon className={`size-3.5 ${isSelected ? "text-[#5B4FE9]" : "text-zinc-400"}`} />
                        {option.label}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                        {optionBalance !== undefined ? `${formatEtb(optionBalance)} ETB` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {shortfall > 0 && !tooMuch && (
              <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                <p className="text-xs text-amber-900">
                  <span className="font-semibold">{accountLabel}</span> only shows{" "}
                  <span className="font-mono font-semibold tabular-nums">{formatEtb(Math.max(balance ?? 0, 0))} ETB</span>.
                  Where did the other{" "}
                  <span className="font-mono font-semibold tabular-nums">{formatEtb(shortfall)} ETB</span> come from?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["OWNER_MONEY", "Owner's own money"],
                      ["ALREADY_IN_ACCOUNT", ALREADY_IN_LABEL[account]],
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

            <div>
              <label className="mb-1 block font-semibold text-zinc-700">Note (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. CBE transfer ref"
                className={inputClass}
              />
            </div>

            {amountNum > 0 && !tooMuch && (
              <div className="space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Owed to {selected?.supplierName || "supplier"}</span>
                  <span className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="font-semibold text-zinc-500">{formatEtb(owed)}</span>
                    <span className="text-zinc-400">→</span>
                    <span className="font-bold text-zinc-900">{formatEtb(Math.round((owed - amountNum) * 100) / 100)} ETB</span>
                  </span>
                </div>
                {balance !== null && balanceAfter !== null && (
                  <div className="flex items-center justify-between border-t border-zinc-200/60 pt-1.5">
                    <span className="text-zinc-500">{accountLabel} after this payment</span>
                    <span className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-semibold text-zinc-500">{formatEtb(balance)}</span>
                      <span className="text-zinc-400">→</span>
                      <span className={`font-bold ${balanceAfter < 0 ? "text-rose-700" : "text-zinc-900"}`}>
                        {formatEtb(balanceAfter)} ETB
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {history.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Recent payments
                </p>
                <ul className="divide-y divide-zinc-100">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between py-1.5">
                      <span className="text-zinc-600">
                        {formatDate(h.paidAt)} · {ACCOUNT_OPTIONS.find((o) => o.key === h.account)?.label}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-zinc-900">−{formatEtb(h.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>
            )}

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-md bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : amountNum > 0 && !tooMuch
                  ? `Pay ${formatEtb(amountNum)} ETB from ${accountLabel}`
                  : "Pay supplier"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
