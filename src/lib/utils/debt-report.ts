import type { Debt } from "@/lib/api/types";
import type { DateRange } from "./report-range";

export type DebtRowStatus = "PAID" | "PARTIAL" | "UNPAID";

export type DebtReportRow = {
  key: string;
  customerId: string;
  customer: string;
  phone: string;
  /** Short voucher reference (by-debt view) */
  reference: string;
  /** Number of debts rolled into the row (1 in the by-debt view) */
  count: number;
  /** Timestamp of the debt (by-debt) or the latest debt (by-customer); 0 when unknown */
  issuedAt: number;
  /** Earliest unpaid due date; 0 when none */
  dueAt: number;
  issued: number;
  paid: number;
  remaining: number;
  status: DebtRowStatus;
  overdue: boolean;
};

export type DebtReportTotals = {
  debts: number;
  customers: number;
  debtors: number;
  issued: number;
  paid: number;
  remaining: number;
  overdueAmount: number;
  overdueCount: number;
  /** Payments received inside the selected period (any debt) */
  collectedInPeriod: number;
};

const num = (value: string | number | null | undefined) => parseFloat(String(value ?? "0")) || 0;
const round2 = (value: number) => Math.round(value * 100) / 100;

function dayStart(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}
function dayEnd(value: string) {
  return new Date(`${value}T23:59:59.999`).getTime();
}

export function inRange(timestamp: number, range: DateRange) {
  if (range.from && timestamp < dayStart(range.from)) return false;
  if (range.to && timestamp > dayEnd(range.to)) return false;
  return true;
}

function statusOf(paid: number, remaining: number): DebtRowStatus {
  if (remaining <= 0.001) return "PAID";
  return paid > 0.001 ? "PARTIAL" : "UNPAID";
}

function shortRef(id: string) {
  return id.includes("-") ? (id.split("-").pop() ?? id).toUpperCase() : id.slice(-6).toUpperCase();
}

/** Debts issued inside the range, one row per debt. */
export function buildDebtRows(debts: Debt[], range: DateRange): DebtReportRow[] {
  const now = Date.now();
  const rows: DebtReportRow[] = [];
  for (const d of debts) {
    const issuedAt = d.createdAt ? new Date(d.createdAt).getTime() : 0;
    if ((range.from || range.to) && (!issuedAt || !inRange(issuedAt, range))) continue;

    const issued = num(d.amount);
    const paid = num(d.paidAmount);
    const remaining = d.remainingAmount !== undefined ? num(d.remainingAmount) : Math.max(0, issued - paid);
    const dueAt = d.dueDate ? new Date(d.dueDate).getTime() || 0 : 0;
    const status = statusOf(paid, remaining);

    rows.push({
      key: d.id,
      customerId: d.customerId,
      customer: d.customerName || d.customer?.name || "Unknown customer",
      phone: d.customerPhone || d.customer?.phone || "",
      reference: shortRef(d.id),
      count: 1,
      issuedAt,
      dueAt,
      issued,
      paid,
      remaining,
      status,
      overdue: status !== "PAID" && dueAt > 0 && dueAt < now,
    });
  }
  return rows;
}

/** Rolls per-debt rows up to one row per customer. */
export function groupByCustomer(rows: DebtReportRow[]): DebtReportRow[] {
  const map = new Map<string, DebtReportRow>();
  for (const r of rows) {
    const existing = map.get(r.customerId);
    if (!existing) {
      map.set(r.customerId, { ...r, key: r.customerId, reference: "" });
      continue;
    }
    existing.count += 1;
    existing.issued += r.issued;
    existing.paid += r.paid;
    existing.remaining += r.remaining;
    existing.issuedAt = Math.max(existing.issuedAt, r.issuedAt);
    if (r.remaining > 0.001 && r.dueAt > 0) {
      existing.dueAt = existing.dueAt > 0 && existing.dueAt < r.dueAt ? existing.dueAt : r.dueAt;
    }
    existing.overdue = existing.overdue || r.overdue;
  }
  return [...map.values()].map((r) => {
    const paid = round2(r.paid);
    const remaining = round2(r.remaining);
    return { ...r, issued: round2(r.issued), paid, remaining, status: statusOf(paid, remaining) };
  });
}

export function summarize(debts: Debt[], rows: DebtReportRow[], range: DateRange): DebtReportTotals {
  let collectedInPeriod = 0;
  for (const d of debts) {
    for (const p of d.payments ?? []) {
      const t = p.paidAt ? new Date(p.paidAt).getTime() : 0;
      if (!t) continue;
      if (!(range.from || range.to) || inRange(t, range)) collectedInPeriod += num(p.amount);
    }
  }
  const overdue = rows.filter((r) => r.overdue);
  return {
    debts: rows.length,
    customers: new Set(rows.map((r) => r.customerId)).size,
    debtors: new Set(rows.filter((r) => r.remaining > 0.001).map((r) => r.customerId)).size,
    issued: round2(rows.reduce((s, r) => s + r.issued, 0)),
    paid: round2(rows.reduce((s, r) => s + r.paid, 0)),
    remaining: round2(rows.reduce((s, r) => s + r.remaining, 0)),
    overdueAmount: round2(overdue.reduce((s, r) => s + r.remaining, 0)),
    overdueCount: overdue.length,
    collectedInPeriod: round2(collectedInPeriod),
  };
}

export const STATUS_LABEL: Record<DebtRowStatus, string> = {
  PAID: "Fully paid",
  PARTIAL: "Partially paid",
  UNPAID: "Unpaid",
};
