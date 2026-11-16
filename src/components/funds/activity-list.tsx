"use client";

import { ArrowDownLeft, ArrowUpRight, Download, SlidersHorizontal, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ListSkeleton } from "@/components/shared/skeletons";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { useDismiss } from "@/hooks/use-dismiss";
import type { FundAccount, FundsEntries, FundsEntry, FundsLine } from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/use-t";
import {
  type ActivityRow,
  type Direction,
  daysAgo,
  filterByDirection,
  groupByDay,
  mergeTransfers,
} from "@/lib/utils/funds-activity";
import { exportToCsv } from "@/lib/utils/export";

import { EntryIcon } from "./entry-icon";
import { ACCOUNT_LABELS, ALL_LINES, LINE_LABELS, formatEtb } from "./funds-shared";

export type LedgerFilter = { line: FundsLine | ""; account: FundAccount | ""; from: string; to: string };
export const EMPTY_FILTER: LedgerFilter = { line: "", account: "", from: "", to: "" };

const CHIP_KEYS: Record<FundsLine, MessageKey> = {
  sales: "fundsPage.chip.sales",
  repayments: "fundsPage.chip.repayments",
  added: "fundsPage.chip.added",
  restocks: "fundsPage.chip.restocks",
  supplierPayments: "fundsPage.chip.supplierPayments",
  expenses: "fundsPage.chip.expenses",
  refunds: "fundsPage.chip.refunds",
  transferIn: "fundsPage.chip.moved",
  transferOut: "fundsPage.chip.moved",
};

const ACCOUNT_BY_ENGLISH: Record<string, FundAccount> = {
  "Cash Till": "CASH_DRAWER",
  Bank: "BANK",
  Telebirr: "TELEBIRR",
};

const selectClass =
  "h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

/* ------------------------------------------------------------------ */
/* Friendly titles for the descriptions the server writes in English   */
/* ------------------------------------------------------------------ */
function useEntryTitle() {
  const t = useT();
  return (entry: FundsEntry): string => {
    const label = entry.label;
    let m: RegExpMatchArray | null;
    if ((m = label.match(/^Sale (\S+)(?: · (.+))?$/))) {
      return m[2]
        ? t("fundsPage.label.saleCustomer", { ref: m[1], customer: m[2] })
        : t("fundsPage.label.sale", { ref: m[1] });
    }
    if ((m = label.match(/^Debt repayment · (.+)$/))) return t("fundsPage.label.repayment", { name: m[1] });
    if ((m = label.match(/^Supplier payment · (.+)$/))) return t("fundsPage.label.supplierPayment", { name: m[1] });
    if ((m = label.match(/^Refund for sale (\S+)$/))) return t("fundsPage.label.refund", { ref: m[1] });
    if ((m = label.match(/^Restock (.+) × ([\d.]+)(?: · (.+))?$/))) {
      return m[3]
        ? t("fundsPage.label.restockSupplier", { product: m[1], qty: m[2], supplier: m[3] })
        : t("fundsPage.label.restock", { product: m[1], qty: m[2] });
    }
    if (label === "Owner's own money") return t("fundsPage.label.ownerMoney");
    if (label === "Money already in account") return t("fundsPage.label.alreadyThere");
    if ((m = label.match(/^Transfer: (.+) → (.+)$/))) {
      const from = ACCOUNT_BY_ENGLISH[m[1]];
      const to = ACCOUNT_BY_ENGLISH[m[2]];
      if (from && to) {
        return t("fundsPage.row.movedTitle", { from: t(ACCOUNT_LABELS[from]), to: t(ACCOUNT_LABELS[to]) });
      }
    }
    return label;
  };
}

/* ------------------------------------------------------------------ */
/* One row of the list                                                 */
/* ------------------------------------------------------------------ */
function ActivityItem({ row }: { row: ActivityRow }) {
  const t = useT();
  const { formatTime } = useFormat();
  const entryTitle = useEntryTitle();

  if (row.kind === "transfer") {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        <EntryIcon kind="moved" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">
            {t("fundsPage.row.movedTitle", { from: t(ACCOUNT_LABELS[row.from]), to: t(ACCOUNT_LABELS[row.to]) })}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
            <span>{formatTime(row.date)}</span>
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-semibold text-[#5B4FE9]">{t("fundsPage.chip.moved")}</span>
            {row.notes && <span className="truncate text-zinc-400">· {row.notes}</span>}
          </p>
        </div>
        <p className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-zinc-600">
          {formatEtb(row.amount)}
        </p>
      </li>
    );
  }

  const e = row.entry;
  const isIn = e.direction === "IN";
  const moved = e.line === "transferIn" || e.line === "transferOut";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <EntryIcon kind={moved ? "moved" : isIn ? "in" : "out"} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">{entryTitle(e)}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
          <span>{t("fundsPage.row.accountTime", { account: t(ACCOUNT_LABELS[e.account]), time: formatTime(e.date) })}</span>
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              moved ? "bg-indigo-50 text-[#5B4FE9]" : isIn ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {t(CHIP_KEYS[e.line])}
          </span>
          {e.notes && <span className="truncate text-zinc-400">· {e.notes}</span>}
        </p>
      </div>
      <p
        className={`shrink-0 text-right font-mono text-sm font-bold tabular-nums ${
          isIn ? "text-emerald-700" : "text-rose-700"
        }`}
      >
        {isIn ? "+" : "−"}
        {formatEtb(e.amount)}
      </p>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Activity: every money movement, grouped by day                      */
/* ------------------------------------------------------------------ */
/** The list itself: chips, filters, day groups. Takes the records as props. */
export function ActivityPanel({
  entries,
  isLoading,
  hasError,
  filter,
  onFilterChange,
  direction,
  onDirectionChange,
}: {
  entries: FundsEntries | null;
  isLoading: boolean;
  hasError: boolean;
  filter: LedgerFilter;
  onFilterChange: (filter: LedgerFilter) => void;
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
}) {
  const t = useT();
  const { formatDate } = useFormat();
  const setDirection = onDirectionChange;
  const [showFilters, setShowFilters] = useState(false);
  const popoverRef = useDismiss<HTMLDivElement>(showFilters, () => setShowFilters(false));

  const rows = useMemo(
    () => filterByDirection(mergeTransfers(entries?.items ?? []), direction),
    [entries, direction],
  );
  const pager = usePagination(rows, 20);
  const groups = useMemo(() => groupByDay(pager.pageItems), [pager.pageItems]);

  // The period (dates) is chosen in the bar above; this list only adds type and account.
  const activeFilterCount = [filter.line, filter.account].filter(Boolean).length;
  const clearTypeAndAccount = () => onFilterChange({ ...filter, line: "", account: "" });

  function dayTitle(group: { date: Date; key: string }) {
    const diff = daysAgo(group);
    if (diff === 0) return t("fundsPage.day.today");
    if (diff === 1) return t("fundsPage.day.yesterday");
    return formatDate(group.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function handleExport() {
    if (!entries) return;
    const items = entries.items.filter((e) => {
      if (direction === "ALL") return true;
      const moved = e.line === "transferIn" || e.line === "transferOut";
      return direction === "MOVED" ? moved : e.direction === direction;
    });
    exportToCsv(`funds-ledger-${new Date().toISOString().slice(0, 10)}`, items, [
      { header: t("shared.date"), formatter: (e) => new Date(e.date).toISOString().slice(0, 10) },
      { header: t("fundsPage.ledger.description"), key: "label" },
      { header: t("fundsPage.ledger.type"), formatter: (e) => t(LINE_LABELS[e.line]) },
      { header: t("fundsPage.ledger.account"), formatter: (e) => t(ACCOUNT_LABELS[e.account]) },
      { header: t("fundsPage.ledger.csvInOut"), key: "direction" },
      { header: t("fundsPage.ledger.csvAmount"), formatter: (e) => (e.direction === "IN" ? e.amount : -e.amount) },
      { header: t("shared.notes"), formatter: (e) => e.notes || "" },
    ]);
  }

  const chips: Array<{ id: Direction; label: string; icon?: typeof ArrowDownLeft; tone: string }> = [
    { id: "ALL", label: t("fundsPage.dir.all"), tone: "" },
    { id: "IN", label: t("fundsPage.dir.in"), icon: ArrowDownLeft, tone: "text-emerald-600" },
    { id: "OUT", label: t("fundsPage.dir.out"), icon: ArrowUpRight, tone: "text-rose-600" },
    { id: "MOVED", label: t("fundsPage.dir.moved"), tone: "" },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
      {/* Quick chips and filter button */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-3 sm:p-4">
        <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDirection(chip.id)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs transition-all ${
                direction === chip.id
                  ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                  : "font-medium text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {chip.icon && <chip.icon className={`size-3.5 ${chip.tone}`} strokeWidth={2.5} />}
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto flex items-center gap-2" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium shadow-2xs transition-colors ${
              activeFilterCount > 0
                ? "border-[#5B4FE9] bg-[#5B4FE9]/10 font-semibold text-zinc-950"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            {t("fundsPage.filter.open")}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#5B4FE9] px-1.5 text-[10px] font-bold text-white">{activeFilterCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!entries || entries.items.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50"
          >
            <Download className="size-3.5 text-zinc-500" />
            <span className="hidden sm:inline">{t("fundsPage.ledger.exportCsv")}</span>
          </button>

          {showFilters && (
            <div className="absolute right-0 top-11 z-30 w-[min(20rem,calc(100vw-2rem))] space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-xs shadow-xl">
              <label className="block">
                <span className="mb-1 block font-semibold text-zinc-700">{t("fundsPage.filter.type")}</span>
                <select
                  value={filter.line}
                  onChange={(e) => onFilterChange({ ...filter, line: e.target.value as FundsLine | "" })}
                  className={selectClass}
                >
                  <option value="">{t("fundsPage.filter.allTypes")}</option>
                  {ALL_LINES.map((line) => (
                    <option key={line} value={line}>
                      {t(LINE_LABELS[line])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold text-zinc-700">{t("fundsPage.filter.account")}</span>
                <select
                  value={filter.account}
                  onChange={(e) => onFilterChange({ ...filter, account: e.target.value as FundAccount | "" })}
                  className={selectClass}
                >
                  <option value="">{t("fundsPage.filter.allAccounts")}</option>
                  {(Object.keys(ACCOUNT_LABELS) as FundAccount[]).map((a) => (
                    <option key={a} value={a}>
                      {t(ACCOUNT_LABELS[a])}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={clearTypeAndAccount}
                  className="font-medium text-zinc-500 hover:text-zinc-900"
                >
                  {t("fundsPage.filter.clearAll")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-md bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-800"
                >
                  {t("shared.done")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-100 bg-zinc-50/60 px-3 py-2 sm:px-4">
          {(
            [
              filter.account && {
                key: "account",
                label: t(ACCOUNT_LABELS[filter.account]),
                clear: { ...filter, account: "" as const },
              },
              filter.line && { key: "line", label: t(LINE_LABELS[filter.line]), clear: { ...filter, line: "" as const } },
            ].filter(Boolean) as Array<{ key: string; label: string; clear: LedgerFilter }>
          ).map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-zinc-700"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => onFilterChange(chip.clear)}
                aria-label={t("shared.close")}
                className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearTypeAndAccount}
            className="ml-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
          >
            {t("fundsPage.filter.clearAll")}
          </button>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : hasError ? (
        <p className="py-14 text-center text-xs text-zinc-500">{t("fundsPage.ledger.loadFailed")}</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <Wallet className="size-5" />
          </span>
          {activeFilterCount > 0 || direction !== "ALL" ? (
            <p className="text-sm text-zinc-600">{t("fundsPage.ledger.noMatch")}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-800">{t("fundsPage.activity.empty")}</p>
              <p className="max-w-xs text-xs text-zinc-500">{t("fundsPage.activity.emptyHint")}</p>
            </>
          )}
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-1.5 text-[11px] font-semibold text-zinc-600">
                <span>{dayTitle(group)}</span>
                {group.net !== 0 && (
                  <span className={`font-mono tabular-nums ${group.net > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {t("fundsPage.day.net", { amount: `${group.net > 0 ? "+" : "−"}${formatEtb(Math.abs(group.net))}` })}
                  </span>
                )}
              </div>
              <ul className="divide-y divide-zinc-100">
                {group.rows.map((row) => (
                  <ActivityItem key={row.id} row={row} />
                ))}
              </ul>
            </div>
          ))}
          <TablePagination pagination={pager} noun={t("fundsPage.ledger.recordsNoun")} />
          {entries && entries.count > entries.items.length && (
            <p className="border-t border-zinc-100 px-4 py-2.5 text-[11px] text-zinc-500">
              {t("fundsPage.ledger.showingLatest", { shown: entries.items.length, count: entries.count })}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
