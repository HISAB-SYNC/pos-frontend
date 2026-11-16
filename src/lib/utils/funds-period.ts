import type { FundsEntry, FundsLine } from "../api/types.ts";

/**
 * Period helpers for the Funds page: which dates a quick choice means, and the
 * money in / out / net for a set of records.
 */

export type PeriodId = "TODAY" | "WEEK" | "MONTH" | "ALL" | "CUSTOM";

export type DateRange = { from: string; to: string };

/** Lines that bring money into the shop, and lines that take it out. Moves between own accounts are in neither. */
export const IN_LINES: FundsLine[] = ["sales", "repayments", "added"];
export const OUT_LINES: FundsLine[] = ["restocks", "supplierPayments", "expenses", "refunds"];

/** YYYY-MM-DD in local time */
export function inputDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** The dates a quick choice stands for ("" means open-ended). CUSTOM keeps whatever was passed in. */
export function periodRange(id: PeriodId, now: Date = new Date(), custom: DateRange = { from: "", to: "" }): DateRange {
  if (id === "TODAY") return { from: inputDate(now), to: inputDate(now) };
  if (id === "WEEK") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { from: inputDate(start), to: inputDate(now) };
  }
  if (id === "MONTH") return { from: inputDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: inputDate(now) };
  if (id === "ALL") return { from: "", to: "" };
  return custom;
}

/** Which quick choice the current dates correspond to; anything else is CUSTOM. */
export function detectPeriod(range: DateRange, now: Date = new Date()): PeriodId {
  if (!range.from && !range.to) return "ALL";
  for (const id of ["TODAY", "WEEK", "MONTH"] as const) {
    const r = periodRange(id, now);
    if (r.from === range.from && r.to === range.to) return id;
  }
  return "CUSTOM";
}

export type LineTotals = Record<FundsLine, number>;

export function emptyLineTotals(): LineTotals {
  return {
    sales: 0,
    repayments: 0,
    added: 0,
    restocks: 0,
    supplierPayments: 0,
    expenses: 0,
    refunds: 0,
    transferIn: 0,
    transferOut: 0,
  };
}

/** Sum of the records per line, in whole cents to avoid float noise. */
export function sumByLine(entries: Pick<FundsEntry, "line" | "amount">[]): LineTotals {
  const cents = emptyLineTotals();
  for (const e of entries) cents[e.line] += Math.round(e.amount * 100);
  const out = emptyLineTotals();
  for (const line of Object.keys(cents) as FundsLine[]) out[line] = cents[line] / 100;
  return out;
}

/** Money in, money out and net (in − out) from per-line totals. */
export function inOutNet(lines: LineTotals): { in: number; out: number; net: number } {
  const sum = (keys: FundsLine[]) => keys.reduce((s, k) => s + Math.round(lines[k] * 100), 0);
  const moneyIn = sum(IN_LINES);
  const moneyOut = sum(OUT_LINES);
  return { in: moneyIn / 100, out: moneyOut / 100, net: (moneyIn - moneyOut) / 100 };
}

/** True when the server sent every matching record (it returns at most 500 at a time). */
export function hasAllRecords(entries: { count: number; items: unknown[] }): boolean {
  return entries.count <= entries.items.length;
}
