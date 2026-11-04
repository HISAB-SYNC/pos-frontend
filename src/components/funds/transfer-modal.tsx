"use client";

import { ArrowRight, X } from "lucide-react";
import { useState } from "react";

import { transferFunds } from "@/lib/api/app-data";
import type { FundAccount, FundsSummary } from "@/lib/api/types";
import { roundMoney } from "@/lib/utils/money";

import { ACCOUNT_ICONS, ACCOUNT_LABELS, formatEtb } from "./funds-shared";

const ACCOUNTS: FundAccount[] = ["CASH_DRAWER", "BANK", "TELEBIRR"];

/**
 * Move money between the shop's own accounts, e.g. cash deposited at CBE.
 * Only the two balances change; Money Left, revenue and profit stay the same.
 */
export function TransferModal({
  shopId,
  funds,
  onClose,
  onMoved,
}: {
  shopId: string;
  funds: FundsSummary;
  onClose: () => void;
  onMoved: () => void;
}) {
  const [fromAccount, setFromAccount] = useState<FundAccount>("CASH_DRAWER");
  const [toAccount, setToAccount] = useState<FundAccount>("BANK");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = (acc: FundAccount) => funds.accounts.find((a) => a.account === acc)?.balance ?? 0;
  const amountNum = roundMoney(parseFloat(amount) || 0);
  const fromAfter = roundMoney(balance(fromAccount) - amountNum);
  const toAfter = roundMoney(balance(toAccount) + amountNum);
  const moreThanAvailable = amountNum > balance(fromAccount);
  const canSubmit = amountNum > 0 && fromAccount !== toAccount && !isSubmitting;

  function pickFrom(acc: FundAccount) {
    setFromAccount(acc);
    if (acc === toAccount) setToAccount(ACCOUNTS.find((a) => a !== acc) ?? "BANK");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await transferFunds(shopId, { fromAccount, toAccount, amount: amountNum, notes: notes.trim() || undefined });
      onMoved();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || "Couldn't move the money. Nothing was changed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const accountButtons = (selected: FundAccount, onPick: (acc: FundAccount) => void, disabled?: FundAccount) => (
    <div className="grid grid-cols-3 gap-2">
      {ACCOUNTS.map((acc) => {
        const Icon = ACCOUNT_ICONS[acc];
        const isSelected = selected === acc;
        return (
          <button
            key={acc}
            type="button"
            disabled={acc === disabled}
            onClick={() => onPick(acc)}
            className={`flex flex-col items-start gap-1 rounded-md border px-2.5 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              isSelected ? "border-[#5B4FE9] bg-indigo-50/60 ring-1 ring-[#5B4FE9]/20" : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
          >
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${isSelected ? "text-zinc-900" : "text-zinc-600"}`}>
              <Icon className={`size-3.5 ${isSelected ? "text-[#5B4FE9]" : "text-zinc-400"}`} />
              {ACCOUNT_LABELS[acc]}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-zinc-500">{formatEtb(balance(acc))} ETB</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Move money</h2>
            <p className="text-xs text-zinc-500">Between your own accounts, e.g. cash deposited at the bank.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">From</label>
            {accountButtons(fromAccount, pickFrom)}
          </div>
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">To</label>
            {accountButtons(toAccount, setToAccount, fromAccount)}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-semibold text-zinc-700">Amount (ETB) *</label>
                {balance(fromAccount) > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(balance(fromAccount)))}
                    className="text-[11px] font-semibold text-[#5B4FE9] hover:underline"
                  >
                    All {formatEtb(balance(fromAccount))}
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono font-semibold text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-zinc-700">Note (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. CBE deposit slip #123"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
              />
            </div>
          </div>

          {amountNum > 0 && (
            <div className="space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50/80 p-3.5">
              {[
                { acc: fromAccount, after: fromAfter },
                { acc: toAccount, after: toAfter },
              ].map(({ acc, after }) => (
                <div key={acc} className="flex items-center justify-between">
                  <span className="text-zinc-500">{ACCOUNT_LABELS[acc]}</span>
                  <span className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="font-semibold text-zinc-500">{formatEtb(balance(acc))}</span>
                    <ArrowRight className="size-3 text-zinc-400" />
                    <span className={`font-bold ${after < 0 ? "text-rose-700" : "text-zinc-900"}`}>{formatEtb(after)} ETB</span>
                  </span>
                </div>
              ))}
              <p className="border-t border-zinc-200/60 pt-1.5 text-[11px] text-zinc-500">
                Money left stays {formatEtb(funds.moneyLeft)} ETB. Revenue and profit don&apos;t change.
              </p>
            </div>
          )}

          {moreThanAvailable && amountNum > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-amber-900">
              {ACCOUNT_LABELS[fromAccount]} only shows {formatEtb(balance(fromAccount))} ETB. You can still move it, but
              check the amount: the balance would go negative.
            </p>
          )}

          {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{error}</div>}

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
                ? "Moving…"
                : amountNum > 0
                ? `Move ${formatEtb(amountNum)} ETB to ${ACCOUNT_LABELS[toAccount]}`
                : "Move money"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
