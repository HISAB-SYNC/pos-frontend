"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { FundAccount, FundsSummary } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";

import { ACCOUNT_ICONS, ACCOUNT_LABELS, formatEtb } from "./funds-shared";

/**
 * The first thing on the Funds page: how much money there is in total and in
 * each account, and a reminder when suppliers are owed money.
 */
export function BalanceOverview({
  funds,
  onOpenAccount,
}: {
  funds: FundsSummary;
  onOpenAccount: (account: FundAccount) => void;
}) {
  const t = useT();
  const owed = funds.owedToSuppliers;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Total */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xs">
          <div>
            <p className="text-xs font-semibold text-slate-300">{t("fundsPage.moneyNow")}</p>
            <p
              className={`mt-2 font-mono text-3xl font-bold tracking-tight tabular-nums sm:text-4xl ${
                funds.moneyLeft < 0 ? "text-rose-300" : "text-white"
              }`}
            >
              {formatEtb(funds.moneyLeft)} <span className="text-sm font-semibold text-slate-400">{t("shared.etb")}</span>
            </p>
          </div>
          <div className="mt-4 space-y-1.5">
            <p className="text-[11px] leading-relaxed text-slate-400">{t("fundsPage.moneyNowHint")}</p>
            {owed > 0 && (
              <Link
                href="/suppliers?filter=owed"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
              >
                {t("fundsPage.owedLine", { amount: formatEtb(owed) })} · {t("fundsPage.openSuppliers")}
                <ChevronRight className="size-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Accounts */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {funds.accounts.map((account) => {
            const Icon = ACCOUNT_ICONS[account.account];
            const negative = account.balance < 0;
            return (
              <button
                key={account.account}
                type="button"
                onClick={() => onOpenAccount(account.account)}
                className="group flex flex-col rounded-xl border border-zinc-200/80 bg-white p-3.5 text-left shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs sm:p-4"
              >
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                      <Icon className="size-3.5" />
                    </span>
                    {t(ACCOUNT_LABELS[account.account])}
                  </span>
                  <ChevronRight className="size-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
                </span>
                <span
                  className={`mt-2 font-mono text-xl font-bold tracking-tight tabular-nums sm:mt-3 ${
                    negative ? "text-rose-700" : "text-zinc-900"
                  }`}
                >
                  {formatEtb(account.balance)} <span className="text-xs font-semibold text-zinc-500">{t("shared.etb")}</span>
                </span>
                <span className="mt-1 text-[11px] text-zinc-500">
                  {t("fundsPage.inOutSummary", { in: formatEtb(account.moneyIn), out: formatEtb(account.moneyOut) })}
                </span>
                {negative && (
                  <span className="mt-2 flex items-start gap-1 rounded-md bg-rose-50 px-2 py-1.5 text-[11px] leading-snug text-rose-800">
                    <AlertTriangle className="mt-px size-3 shrink-0" />
                    {t("fundsPage.negativeHint")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
