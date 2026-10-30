import { Banknote, Landmark, Smartphone } from "lucide-react";

import type { FundAccount, FundsLine } from "@/lib/api/types";

/** Shared labels and helpers for the Funds page and the dashboard Funds card. */

export const LINE_LABELS: Record<FundsLine, string> = {
  sales: "Sales paid",
  repayments: "Debt repayments",
  added: "Money added",
  restocks: "Restocks",
  supplierPayments: "Supplier payments",
  expenses: "Expenses",
  refunds: "Refunds",
};

export const LINE_HINTS: Partial<Record<FundsLine, string>> = {
  sales: "Cash, bank and Telebirr sales. Credit sales count when the customer pays.",
  repayments: "Customers paying off their debts.",
  added: "Owner's money, or money that was there before Andalus.",
  restocks: "Restocks paid on the spot. Pay-later restocks count when you pay the supplier.",
  supplierPayments: "Paying suppliers for pay-later restocks.",
  expenses: "Only expenses marked Paid.",
  refunds: "Money handed back to customers on returns.",
};

export const IN_LINES: FundsLine[] = ["sales", "repayments", "added"];
export const OUT_LINES: FundsLine[] = ["restocks", "supplierPayments", "expenses", "refunds"];
export const ALL_LINES: FundsLine[] = [...IN_LINES, ...OUT_LINES];

export const ACCOUNT_LABELS: Record<FundAccount, string> = {
  CASH_DRAWER: "Cash Till",
  BANK: "Bank",
  TELEBIRR: "Telebirr",
};

export const ACCOUNT_ICONS: Record<FundAccount, typeof Banknote> = {
  CASH_DRAWER: Banknote,
  BANK: Landmark,
  TELEBIRR: Smartphone,
};

export function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
