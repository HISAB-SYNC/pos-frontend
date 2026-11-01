"use client";

import { ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ACCOUNT_ICONS, formatEtb } from "@/components/funds/funds-shared";
import { getFundsSummary } from "@/lib/api/app-data";
import type { FundAccount, FundsSummary } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/use-t";

const ACCOUNT_LABEL_KEYS: Record<FundAccount, MessageKey> = {
  CASH_DRAWER: "funds.cashTill",
  BANK: "funds.bank",
  TELEBIRR: "funds.telebirr",
};

/**
 * Compact Funds summary for the dashboard. Details, the ledger and supplier
 * payments live on the Funds page.
 */
export function MoneyLeftCard({ shopId }: { shopId: string }) {
  const t = useT();
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const fetchFunds = useCallback(
    () =>
      getFundsSummary(shopId)
        .then((data) => {
          setFunds(data);
          setStatus("ready");
        })
        .catch(() => setStatus("error")),
    [shopId],
  );

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const retry = () => {
    setStatus("loading");
    fetchFunds();
  };

  if (status === "error") {
    return (
      <section className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-zinc-900">{t("funds.title")}</h2>
          <p className="text-xs text-zinc-500">{t("funds.loadError")}</p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <RotateCcw className="size-3.5" />
          {t("funds.retry")}
        </button>
      </section>
    );
  }

  if (status === "loading" || !funds) {
    return <section className="h-[132px] animate-pulse rounded-xl border border-zinc-200/80 bg-white shadow-2xs" />;
  }

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-tight text-zinc-900">{t("funds.title")}</h2>
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/20">
            {t("funds.rightNow")}
          </span>
        </div>
        <Link
          href="/funds"
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline"
        >
          {t("funds.open")}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t("funds.moneyLeft")}</p>
          <p
            className={`font-mono text-2xl font-bold tracking-tight tabular-nums ${
              funds.moneyLeft < 0 ? "text-rose-700" : "text-zinc-900"
            }`}
          >
            {formatEtb(funds.moneyLeft)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
          </p>
        </div>
        {funds.accounts.map((account) => {
          const Icon = ACCOUNT_ICONS[account.account];
          return (
            <div key={account.account} className="border-zinc-100 sm:border-l sm:pl-4">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                <Icon className="size-3.5 text-zinc-400" />
                {t(ACCOUNT_LABEL_KEYS[account.account])}
              </p>
              <p
                className={`mt-0.5 font-mono text-base font-bold tabular-nums ${
                  account.balance < 0 ? "text-rose-700" : "text-zinc-900"
                }`}
              >
                {formatEtb(account.balance)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-[11px]">
        <span className="text-zinc-500">{t("funds.explainer")}</span>
        {funds.owedToSuppliers > 0 ? (
          <Link href="/funds?tab=suppliers" className="font-semibold text-amber-800 hover:underline">
            {t("funds.owed", { amount: formatEtb(funds.owedToSuppliers) })}
          </Link>
        ) : (
          <span className="text-zinc-400">{t("funds.nothingOwed")}</span>
        )}
      </div>
    </section>
  );
}
