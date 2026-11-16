"use client";

import { useEffect, useState } from "react";

import { getFundsEntries } from "@/lib/api/app-data";
import type { FundsEntries, FundsLine } from "@/lib/api/types";
import { type DateRange, type LineTotals, emptyLineTotals, hasAllRecords, sumByLine } from "@/lib/utils/funds-period";

import type { LedgerFilter } from "./activity-list";

/** The server's date window: `to` is exclusive, so the chosen end day is moved one day on. */
function window(range: DateRange) {
  const from = range.from ? new Date(`${range.from}T00:00:00`) : null;
  const to = range.to ? new Date(`${range.to}T00:00:00`) : null;
  if (to) to.setDate(to.getDate() + 1);
  return { from: from?.toISOString(), to: to?.toISOString() };
}

/** Loads the records for the current filter (type, account and dates). */
export function useFundsEntries(shopId: string, filter: LedgerFilter, reloadToken: number) {
  const filterKey = `${JSON.stringify(filter)}|${reloadToken}`;
  const [data, setData] = useState<{ key: string; entries: FundsEntries | null; error: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    getFundsEntries(shopId, {
      line: filter.line || undefined,
      account: filter.account || undefined,
      ...window(filter),
      limit: 500,
    })
      .then((entries) => {
        if (mounted) setData({ key: filterKey, entries, error: false });
      })
      .catch(() => {
        if (mounted) setData({ key: filterKey, entries: null, error: true });
      });
    return () => {
      mounted = false;
    };
  }, [shopId, filter, filterKey]);

  const isLoading = data?.key !== filterKey;
  return {
    entries: !isLoading ? (data?.entries ?? null) : null,
    isLoading,
    hasError: !isLoading && !!data?.error,
  };
}

const COUNTED_LINES: FundsLine[] = ["sales", "repayments", "added", "restocks", "supplierPayments", "expenses", "refunds"];

/**
 * Money per type for the current filter. When the loaded records are all the
 * matching records they are summed directly; for "all time" the summary the page
 * already has is used; otherwise each type's total is asked from the server so
 * the numbers stay exact even with more than 500 records.
 */
export function usePeriodLines(
  shopId: string,
  filter: LedgerFilter,
  entries: FundsEntries | null,
  allTimeLines: LineTotals,
): { lines: LineTotals | null; isLoading: boolean } {
  const filterKey = JSON.stringify(filter);
  const needsServerTotals = !!entries && !hasAllRecords(entries);
  const isAllTime = !filter.from && !filter.to && !filter.account && !filter.line;
  const [fetched, setFetched] = useState<{ key: string; lines: LineTotals } | null>(null);

  useEffect(() => {
    if (!needsServerTotals || isAllTime) return;
    let mounted = true;
    Promise.all(
      (filter.line ? [filter.line] : COUNTED_LINES).map((line) =>
        getFundsEntries(shopId, {
          line,
          account: filter.account || undefined,
          ...window(filter),
          limit: 1,
        }).then((r) => [line, r.total] as const),
      ),
    )
      .then((pairs) => {
        if (!mounted) return;
        const lines = emptyLineTotals();
        for (const [line, total] of pairs) lines[line] = total;
        setFetched({ key: filterKey, lines });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [shopId, filter, filterKey, needsServerTotals, isAllTime]);

  if (!entries) return { lines: null, isLoading: true };
  if (isAllTime) return { lines: allTimeLines, isLoading: false };
  if (!needsServerTotals) return { lines: sumByLine(entries.items), isLoading: false };
  if (fetched?.key === filterKey) return { lines: fetched.lines, isLoading: false };
  return { lines: null, isLoading: true };
}
