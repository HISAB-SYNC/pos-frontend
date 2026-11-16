"use client";

import { Banknote, Landmark, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { getFundsSummary, getSupplierPayables, getSupplierPayments, paySupplier } from "@/lib/api/app-data";
import {
  balanceAfter as moneyBalanceAfter,
  roundMoney,
  shortfall as moneyShortfall,
  sumMoney,
} from "@/lib/utils/money";
import type {
  FundAccount,
  FundsSummary,
  MoneyAddedReason,
  SupplierPayable,
  SupplierPayables,
  SupplierPayment,
} from "@/lib/api/types";

const ACCOUNT_OPTIONS: Array<{
  key: FundAccount;
  label: "payments.cashTill" | "payments.bank" | "payments.telebirr";
  icon: typeof Banknote;
}> = [
  { key: "CASH_DRAWER", label: "payments.cashTill", icon: Banknote },
  { key: "BANK", label: "payments.bank", icon: Landmark },
  { key: "TELEBIRR", label: "payments.telebirr", icon: Smartphone },
];

const ALREADY_IN_LABEL = {
  CASH_DRAWER: "payments.alreadyInTill",
  BANK: "payments.alreadyInBank",
  TELEBIRR: "payments.alreadyInTelebirr",
} as const;

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
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
  const t = useT();
  const { formatDate } = useFormat();
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
  const payable = sumMoney(pickedRestocks.map((p) => p.remaining));
  const amountNum = roundMoney(parseFloat(amount) || 0);
  const tooMuch = amountNum > payable + 0.001;

  function setPickedIds(ids: Set<string>) {
    setPicked({ supplier: activeKey, ids });
    const sum = sumMoney(restocks.filter((p) => ids.has(p.id)).map((p) => p.remaining));
    setAmount(sum > 0 ? String(sum) : "");
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
  const shortfall = moneyShortfall(balance, amountNum);
  const answerKey = `${activeKey}|${account}|${amountNum}`;
  const extraMoneyReason = extraMoneyAnswer?.key === answerKey ? extraMoneyAnswer.reason : null;
  const balanceAfter = moneyBalanceAfter(balance, amountNum, extraMoneyReason ? shortfall : 0);
  const accountLabelKey = ACCOUNT_OPTIONS.find((o) => o.key === account)?.label;
  const accountLabel = accountLabelKey ? t(accountLabelKey) : "";

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
      setError(message || t("payments.saveError"));
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
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("payments.title")}</h2>
            <p className="text-xs text-zinc-500">{t("payments.subtitle")}</p>
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
          <p className="py-8 text-center text-xs text-zinc-500">{t("payments.loadError")}</p>
        ) : !payables ? (
          <p className="py-8 text-center text-xs text-zinc-400">{t("shared.loading")}</p>
        ) : suppliers.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500">{t("payments.nothingOwed")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">{t("payments.supplier")}</label>
              <select value={activeKey} onChange={(e) => setSelectedKey(e.target.value)} className={inputClass}>
                {suppliers.map((s) => (
                  <option key={supplierKey(s)} value={supplierKey(s)}>
                    {t("payments.owesLine", { name: s.supplierName || t("payments.unnamedSupplier"), amount: formatEtb(s.owed) })}
                  </option>
                ))}
              </select>
            </div>

            {restocks.length > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-semibold text-zinc-700">{t("payments.restocksToSettle")}</label>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-[11px] font-semibold text-[#5B4FE9] hover:underline"
                  >
                    {allPicked ? t("payments.clearAll") : t("payments.selectAll")}
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
                            <span className="ml-1.5 text-[10px] text-zinc-400">{t("payments.paidSoFar", { amount: formatEtb(p.amountPaid) })}</span>
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
                  {t("payments.selectedSummary", {
                    picked: pickedRestocks.length,
                    total: restocks.length,
                    amount: formatEtb(payable),
                  })}
                </p>
              </div>
            )}

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-semibold text-zinc-700">{t("payments.amountEtb")}</label>
                <button
                  type="button"
                  onClick={() => setAmount(String(payable))}
                  className="text-[11px] font-semibold text-[#5B4FE9] hover:underline"
                >
                  {allPicked
                    ? t("payments.payAll", { amount: formatEtb(payable) })
                    : t("payments.paySelected", { amount: formatEtb(payable) })}
                </button>
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("payments.upTo", { amount: formatEtb(payable) })}
                className={`${inputClass} font-mono font-semibold`}
              />
              {tooMuch && (
                <p className="mt-1 text-[10px] text-rose-700">
                  {t(allPicked ? "payments.tooMuchOwed" : "payments.tooMuchSelected", { amount: formatEtb(payable) })}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block font-semibold text-zinc-700">{t("payments.paidFrom")}</label>
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
                        {t(option.label)}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                        {optionBalance !== undefined ? `${formatEtb(optionBalance)} ${t("shared.etb")}` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {shortfall > 0 && !tooMuch && (
              <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                <p className="text-xs text-amber-900">
                  {t("payments.shortfall", {
                    account: accountLabel,
                    balance: formatEtb(Math.max(balance ?? 0, 0)),
                    missing: formatEtb(shortfall),
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["OWNER_MONEY", t("payments.ownerMoney")],
                      ["ALREADY_IN_ACCOUNT", t(ALREADY_IN_LABEL[account])],
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
              <label className="mb-1 block font-semibold text-zinc-700">{t("payments.note")}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("payments.notePlaceholder")}
                className={inputClass}
              />
            </div>

            {amountNum > 0 && !tooMuch && (
              <div className="space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50/80 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{t("payments.owedTo", { name: selected?.supplierName || t("payments.supplierFallback") })}</span>
                  <span className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="font-semibold text-zinc-500">{formatEtb(owed)}</span>
                    <span className="text-zinc-400">→</span>
                    <span className="font-bold text-zinc-900">{formatEtb(roundMoney(owed - amountNum))} {t("shared.etb")}</span>
                  </span>
                </div>
                {balance !== null && balanceAfter !== null && (
                  <div className="flex items-center justify-between border-t border-zinc-200/60 pt-1.5">
                    <span className="text-zinc-500">{t("payments.afterPayment", { account: accountLabel })}</span>
                    <span className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-semibold text-zinc-500">{formatEtb(balance)}</span>
                      <span className="text-zinc-400">→</span>
                      <span className={`font-bold ${balanceAfter < 0 ? "text-rose-700" : "text-zinc-900"}`}>
                        {formatEtb(balanceAfter)} {t("shared.etb")}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {history.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {t("payments.recentPayments")}
                </p>
                <ul className="divide-y divide-zinc-100">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between py-1.5">
                      <span className="text-zinc-600">
                        {formatDate(h.paidAt)} · {(() => {
                          const k = ACCOUNT_OPTIONS.find((o) => o.key === h.account)?.label;
                          return k ? t(k) : "";
                        })()}
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
                {t("shared.cancel")}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-md bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting
                  ? t("shared.saving")
                  : amountNum > 0 && !tooMuch
                  ? t("payments.payFrom", { amount: formatEtb(amountNum), account: accountLabel })
                  : t("payments.title")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
