"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { addMoneyToAccount } from "@/lib/api/app-data";
import type { FundAccount, FundsSummary, MoneyAddedReason } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/use-t";
import { roundMoney } from "@/lib/utils/money";

import { ACCOUNT_ICONS, ACCOUNT_LABELS, formatEtb } from "./funds-shared";

const ACCOUNTS: FundAccount[] = ["CASH_DRAWER", "BANK", "TELEBIRR"];

const REASONS: Array<{ id: MoneyAddedReason; label: MessageKey; hint: MessageKey }> = [
  { id: "OWNER_MONEY", label: "fundsPage.addMoney.own", hint: "fundsPage.addMoney.ownHint" },
  { id: "ALREADY_IN_ACCOUNT", label: "fundsPage.addMoney.before", hint: "fundsPage.addMoney.beforeHint" },
];

/**
 * Records money that did not come from a sale: the owner's own money put in, or
 * money that was already in an account before the shop started using the app.
 */
export function AddMoneyModal({
  shopId,
  funds,
  onClose,
  onAdded,
}: {
  shopId: string;
  funds: FundsSummary;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useT();
  const [account, setAccount] = useState<FundAccount>("CASH_DRAWER");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<MoneyAddedReason>("OWNER_MONEY");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = (acc: FundAccount) => funds.accounts.find((a) => a.account === acc)?.balance ?? 0;
  const amountNum = roundMoney(parseFloat(amount) || 0);
  const canSubmit = amountNum > 0 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addMoneyToAccount(shopId, { account, amount: amountNum, reason, notes: notes.trim() || undefined });
      onAdded();
      onClose();
    } catch (err) {
      setError((err as { message?: string })?.message || t("fundsPage.addMoney.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("fundsPage.addMoney.title")}</h2>
            <p className="text-xs text-zinc-500">{t("fundsPage.addMoney.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">{t("fundsPage.addMoney.account")}</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNTS.map((acc) => {
                const Icon = ACCOUNT_ICONS[acc];
                const selected = account === acc;
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setAccount(acc)}
                    className={`flex flex-col items-start gap-1 rounded-md border px-2.5 py-2 text-left transition-all ${
                      selected ? "border-[#5B4FE9] bg-indigo-50/60 ring-1 ring-[#5B4FE9]/20" : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${selected ? "text-zinc-900" : "text-zinc-600"}`}>
                      <Icon className={`size-3.5 ${selected ? "text-[#5B4FE9]" : "text-zinc-400"}`} />
                      {t(ACCOUNT_LABELS[acc])}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                      {formatEtb(balance(acc))} {t("shared.etb")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("fundsPage.addMoney.amount")} *</label>
            <input
              type="number"
              min="0.01"
              step="any"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} font-mono font-semibold`}
            />
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">{t("fundsPage.addMoney.reason")}</label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  aria-pressed={reason === r.id}
                  className={`block w-full rounded-md border px-3 py-2 text-left transition-all ${
                    reason === r.id ? "border-[#5B4FE9] bg-indigo-50/60 ring-1 ring-[#5B4FE9]/20" : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <span className="block text-xs font-semibold text-zinc-900">{t(r.label)}</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">{t(r.hint)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("fundsPage.addMoney.note")}</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fundsPage.addMoney.notePh")}
              className={inputClass}
            />
          </div>

          {amountNum > 0 && (
            <p className="rounded-md bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
              {t("fundsPage.addMoney.after", {
                account: t(ACCOUNT_LABELS[account]),
                amount: formatEtb(roundMoney(balance(account) + amountNum)),
              })}
            </p>
          )}

          {error && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {t("shared.cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("fundsPage.addMoney.saving") : t("fundsPage.addMoney.submit", { amount: formatEtb(amountNum) })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
