"use client";

import { Banknote, ChevronRight, Info, Landmark, RotateCcw, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getFundsEntries, getFundsSummary } from "@/lib/api/app-data";
import type { FundAccount, FundsEntries, FundsLine, FundsSummary } from "@/lib/api/types";

const LINE_LABELS: Record<FundsLine, string> = {
  sales: "Sales paid",
  repayments: "Debt repayments",
  added: "Money added",
  restocks: "Restocks",
  expenses: "Expenses",
  refunds: "Refunds",
};

const LINE_HINTS: Partial<Record<FundsLine, string>> = {
  sales: "Cash, bank and Telebirr sales. Credit sales count when the customer pays.",
  added: "Owner's money or money that was there before Andalus.",
  expenses: "Only expenses marked Paid.",
};

const IN_LINES: FundsLine[] = ["sales", "repayments", "added"];
const OUT_LINES: FundsLine[] = ["restocks", "expenses", "refunds"];
// Always shown even at zero; the rest only appear once they have money.
const ALWAYS_SHOWN: FundsLine[] = ["sales", "restocks", "expenses"];

const ACCOUNT_ICONS: Record<FundAccount, typeof Banknote> = {
  CASH_DRAWER: Banknote,
  BANK: Landmark,
  TELEBIRR: Smartphone,
};

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

type EntriesFilter = { line?: FundsLine; account?: FundAccount; title: string };

function EntriesModal({
  shopId,
  filter,
  onClose,
}: {
  shopId: string;
  filter: EntriesFilter;
  onClose: () => void;
}) {
  const [data, setData] = useState<FundsEntries | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFundsEntries(shopId, { line: filter.line, account: filter.account, limit: 100 })
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, [shopId, filter.line, filter.account]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{filter.title}</h2>
            {data && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {data.count} {data.count === 1 ? "record" : "records"} · Total{" "}
                <span className="font-mono font-semibold text-zinc-900 tabular-nums">{formatEtb(data.total)} ETB</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {error ? (
            <p className="py-8 text-center text-xs text-zinc-500">Could not load these records.</p>
          ) : !data ? (
            <p className="py-8 text-center text-xs text-zinc-400">Loading…</p>
          ) : data.items.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {data.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-800">{item.label}</p>
                    <p className="font-mono text-[10px] text-zinc-400">
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {item.account === "CASH_DRAWER" ? "Cash Till" : item.account === "BANK" ? "Bank" : "Telebirr"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                      item.direction === "IN" ? "text-emerald-700" : "text-zinc-900"
                    }`}
                  >
                    {item.direction === "IN" ? "+" : "−"}
                    {formatEtb(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data && data.count > data.items.length && (
          <p className="border-t border-zinc-100 px-5 py-2.5 text-[11px] text-zinc-500">
            Showing the latest {data.items.length} of {data.count}. The total covers all of them.
          </p>
        )}
      </div>
    </div>
  );
}

export function MoneyLeftCard({ shopId }: { shopId: string }) {
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [openFilter, setOpenFilter] = useState<EntriesFilter | null>(null);

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
          <h2 className="text-sm font-bold tracking-tight text-zinc-900">Money Left</h2>
          <p className="text-xs text-zinc-500">Couldn&apos;t load Money Left right now.</p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <RotateCcw className="size-3.5" />
          Retry
        </button>
      </section>
    );
  }

  if (status === "loading" || !funds) {
    return <section className="h-[244px] animate-pulse rounded-xl border border-zinc-200/80 bg-white shadow-2xs" />;
  }

  const visible = (line: FundsLine) => ALWAYS_SHOWN.includes(line) || funds.lines[line] > 0;

  const renderLine = (line: FundsLine, sign: "+" | "−") => (
    <button
      key={line}
      type="button"
      onClick={() => setOpenFilter({ line, title: LINE_LABELS[line] })}
      className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-50"
    >
      <span className="flex items-center gap-1.5 text-xs text-zinc-600">
        {LINE_LABELS[line]}
        {LINE_HINTS[line] && (
          <span title={LINE_HINTS[line]} className="text-zinc-300">
            <Info className="size-3" />
          </span>
        )}
      </span>
      <span className="flex items-center gap-1">
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${sign === "+" ? "text-emerald-700" : "text-zinc-900"}`}
        >
          {sign} {formatEtb(funds.lines[line])}
        </span>
        <ChevronRight className="size-3.5 text-zinc-300 transition-colors group-hover:text-zinc-500" />
      </span>
    </button>
  );

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-zinc-900">Money Left</h2>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/20">
              Right now
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Money in minus money out
            {funds.since
              ? ` since ${new Date(funds.since).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : ""}
            . Profit doesn&apos;t drop when you restock. Money Left does.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Notebook: in, out, left */}
        <div className="lg:col-span-3">
          <div className="space-y-0.5">
            {IN_LINES.filter(visible).map((line) => renderLine(line, "+"))}
            {OUT_LINES.filter(visible).map((line) => renderLine(line, "−"))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-zinc-900 px-2 pt-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">Money left</span>
            <span
              className={`font-mono text-xl font-bold tracking-tight tabular-nums ${
                funds.moneyLeft < 0 ? "text-rose-700" : "text-zinc-900"
              }`}
            >
              {formatEtb(funds.moneyLeft)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </span>
          </div>
          {funds.owedToSuppliers > 0 && (
            <p className="mt-2 px-2 text-[11px] text-amber-800">
              Owed to suppliers (restocks on credit):{" "}
              <span className="font-mono font-semibold tabular-nums">{formatEtb(funds.owedToSuppliers)} ETB</span>. Not
              taken out of Money Left yet.
            </p>
          )}
        </div>

        {/* Where the money is */}
        <div className="grid grid-cols-3 gap-2 lg:col-span-2 lg:grid-cols-1">
          {funds.accounts.map((account) => {
            const Icon = ACCOUNT_ICONS[account.account];
            return (
              <button
                key={account.account}
                type="button"
                onClick={() => setOpenFilter({ account: account.account, title: account.label })}
                className="group flex flex-col items-start justify-between gap-1 rounded-lg border border-zinc-200/80 px-3 py-2.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 lg:flex-row lg:items-center"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                  <Icon className="size-3.5 text-zinc-400" />
                  {account.label}
                </span>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${
                    account.balance < 0 ? "text-rose-700" : "text-zinc-900"
                  }`}
                >
                  {formatEtb(account.balance)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {openFilter && <EntriesModal shopId={shopId} filter={openFilter} onClose={() => setOpenFilter(null)} />}
    </section>
  );
}
