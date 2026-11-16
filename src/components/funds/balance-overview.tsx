"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { FundAccount, FundsSummary } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";

import { ACCOUNT_ICONS, ACCOUNT_LABELS, formatEtb } from "./funds-shared";

/**
 * The first thing on the Funds page, kept short: how much money there is in
 * total and in each account. Tapping an account shows only its activity.
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
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      {/* Total */}
      <div className="flex flex-col justify-center rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 shadow-2xs">
        <p className="text-xs font-semibold text-slate-300">{t("fundsPage.moneyNow")}</p>
        <p
          className={`mt-1 font-mono text-3xl font-bold tracking-tight tabular-nums ${
            funds.moneyLeft < 0 ? "text-rose-300" : "text-white"
          }`}
        >
          {formatEtb(funds.moneyLeft)} <span className="text-sm font-semibold text-slate-400">{t("shared.etb")}</span>
        </p>
        {owed > 0 && (
          <Link
            href="/suppliers?filter=owed"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
          >
            {t("fundsPage.owedLine", { amount: formatEtb(owed) })} · {t("fundsPage.openSuppliers")}
            <ChevronRight className="size-3" />
          </Link>
        )}
      </div>

      {/* Accounts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {funds.accounts.map((account) => {
          const Icon = ACCOUNT_ICONS[account.account];
          const negative = account.balance < 0;
          return (
            <button
              key={account.account}
              type="button"
              onClick={() => onOpenAccount(account.account)}
              title={negative ? t("fundsPage.negativeHint") : undefined}
              className="group flex flex-col rounded-xl border border-zinc-200/80 bg-white px-3 py-3 text-left shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs sm:px-4"
            >
              <span className="flex items-center justify-between gap-1">
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-zinc-600 sm:text-xs">
                  <Icon className="size-3.5 shrink-0 text-zinc-400" />
                  <span className="truncate">{t(ACCOUNT_LABELS[account.account])}</span>
                </span>
                <ChevronRight className="hidden size-3.5 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500 sm:block" />
              </span>
              <span
                className={`mt-1.5 flex items-center gap-1 font-mono text-base font-bold tracking-tight tabular-nums sm:text-xl ${
                  negative ? "text-rose-700" : "text-zinc-900"
                }`}
              >
                {negative && <AlertTriangle className="size-3.5 shrink-0" />}
                {formatEtb(account.balance)}
              </span>
              <span className="mt-0.5 hidden truncate text-[11px] text-zinc-500 sm:block">
                {t("fundsPage.inOutSummary", { in: formatEtb(account.moneyIn), out: formatEtb(account.moneyOut) })}
              </span>
              {negative && (
                <span className="mt-1 hidden text-[10px] leading-snug text-rose-700 sm:block">{t("fundsPage.negativeHint")}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
