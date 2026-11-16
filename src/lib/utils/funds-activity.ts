import type { FundAccount, FundsEntry } from "../api/types.ts";

/**
 * Helpers for the Funds "Activity" list. The backend stores a transfer between
 * two of the shop's own accounts as two records (`transfer-out:<id>` and
 * `transfer-in:<id>`); the list shows them as one line.
 */

export type Direction = "ALL" | "IN" | "OUT" | "MOVED";

export type ActivityRow =
  | { kind: "entry"; id: string; date: string; entry: FundsEntry }
  | {
      kind: "transfer";
      id: string;
      date: string;
      from: FundAccount;
      to: FundAccount;
      amount: number;
      notes?: string;
    };

const TRANSFER_OUT = "transfer-out:";
const TRANSFER_IN = "transfer-in:";

function transferKey(entry: FundsEntry): { side: "out" | "in"; key: string } | null {
  if (entry.id.startsWith(TRANSFER_OUT)) return { side: "out", key: entry.id.slice(TRANSFER_OUT.length) };
  if (entry.id.startsWith(TRANSFER_IN)) return { side: "in", key: entry.id.slice(TRANSFER_IN.length) };
  return null;
}

/**
 * Turns the records into list rows, merging the two halves of a transfer into
 * one row. A half whose other half isn't in the list (for example when one
 * account is filtered) stays a normal money-in or money-out row.
 */
export function mergeTransfers(entries: FundsEntry[]): ActivityRow[] {
  const halves = new Map<string, { out?: FundsEntry; in?: FundsEntry }>();
  for (const entry of entries) {
    const t = transferKey(entry);
    if (!t) continue;
    const pair = halves.get(t.key) ?? {};
    pair[t.side] = entry;
    halves.set(t.key, pair);
  }

  const rows: ActivityRow[] = [];
  const done = new Set<string>();
  for (const entry of entries) {
    const t = transferKey(entry);
    if (!t) {
      rows.push({ kind: "entry", id: entry.id, date: entry.date, entry });
      continue;
    }
    const pair = halves.get(t.key);
    if (pair?.out && pair.in) {
      if (done.has(t.key)) continue;
      done.add(t.key);
      rows.push({
        kind: "transfer",
        id: `transfer:${t.key}`,
        date: pair.out.date,
        from: pair.out.account,
        to: pair.in.account,
        amount: pair.out.amount,
        notes: pair.out.notes ?? pair.in.notes,
      });
    } else {
      rows.push({ kind: "entry", id: entry.id, date: entry.date, entry });
    }
  }
  return rows;
}

function isTransferLine(entry: FundsEntry) {
  return entry.line === "transferIn" || entry.line === "transferOut";
}

/** Rows for one of the quick chips: All, Money in, Money out, Moved. */
export function filterByDirection(rows: ActivityRow[], direction: Direction): ActivityRow[] {
  if (direction === "ALL") return rows;
  return rows.filter((row) => {
    if (row.kind === "transfer") return direction === "MOVED";
    if (direction === "MOVED") return isTransferLine(row.entry);
    return row.entry.direction === direction;
  });
}

/** Money in and out of the shop for these rows. Moves between own accounts are left out. */
export function sumInOut(rows: ActivityRow[]): { in: number; out: number } {
  let cents = { in: 0, out: 0 };
  for (const row of rows) {
    if (row.kind === "transfer") continue;
    const value = Math.round(row.entry.amount * 100);
    if (row.entry.direction === "IN") cents = { ...cents, in: cents.in + value };
    else cents = { ...cents, out: cents.out + value };
  }
  return { in: cents.in / 100, out: cents.out / 100 };
}

export type DayGroup = {
  /** Local date as YYYY-MM-DD */
  key: string;
  /** Noon of that local day, safe to format */
  date: Date;
  rows: ActivityRow[];
  /** Money in minus money out for the day (moves between own accounts excluded) */
  net: number;
};

function localKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Groups rows (newest first) by local day, keeping their order. */
export function groupByDay(rows: ActivityRow[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const row of rows) {
    const when = new Date(row.date);
    if (isNaN(when.getTime())) continue;
    const key = localKey(when);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, date: new Date(when.getFullYear(), when.getMonth(), when.getDate(), 12), rows: [], net: 0 };
      groups.push(group);
    }
    group.rows.push(row);
  }
  for (const group of groups) {
    const { in: moneyIn, out: moneyOut } = sumInOut(group.rows);
    group.net = Math.round((moneyIn - moneyOut) * 100) / 100;
  }
  return groups;
}

/** 0 = today, 1 = yesterday, negative = future, otherwise days ago. */
export function daysAgo(group: Pick<DayGroup, "date">, now: Date = new Date()): number {
  const a = Date.UTC(group.date.getFullYear(), group.date.getMonth(), group.date.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 86400000);
}
