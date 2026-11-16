import { Banknote, Landmark, Smartphone } from "lucide-react";

import type { MessageKey } from "@/lib/i18n/messages";
import type { FundAccount, FundsLine } from "@/lib/api/types";

/** Shared labels and helpers for the Funds page and the dashboard Funds card. */

/** Message keys: render with `t(LINE_LABELS[line])`. */
export const LINE_LABELS: Record<FundsLine, MessageKey> = {
  sales: "fundsPage.line.sales",
  repayments: "fundsPage.line.repayments",
  added: "fundsPage.line.added",
  restocks: "fundsPage.line.restocks",
  supplierPayments: "fundsPage.line.supplierPayments",
  expenses: "fundsPage.line.expenses",
  refunds: "fundsPage.line.refunds",
  transferIn: "fundsPage.line.transferIn",
  transferOut: "fundsPage.line.transferOut",
};

export const LINE_HINTS: Partial<Record<FundsLine, MessageKey>> = {
  sales: "fundsPage.hint.sales",
  repayments: "fundsPage.hint.repayments",
  added: "fundsPage.hint.added",
  restocks: "fundsPage.hint.restocks",
  supplierPayments: "fundsPage.hint.supplierPayments",
  expenses: "fundsPage.hint.expenses",
  refunds: "fundsPage.hint.refunds",
  transferIn: "fundsPage.hint.transferIn",
  transferOut: "fundsPage.hint.transferOut",
};

export const IN_LINES: FundsLine[] = ["sales", "repayments", "added"];
export const OUT_LINES: FundsLine[] = ["restocks", "supplierPayments", "expenses", "refunds"];
/** Moves between the shop's own accounts (not money in or out of the shop). */
export const TRANSFER_LINES: FundsLine[] = ["transferIn", "transferOut"];
export const ALL_LINES: FundsLine[] = [...IN_LINES, ...OUT_LINES, ...TRANSFER_LINES];

/** Message keys: render with `t(ACCOUNT_LABELS[account])`. */
export const ACCOUNT_LABELS: Record<FundAccount, MessageKey> = {
  CASH_DRAWER: "fundsPage.account.CASH_DRAWER",
  BANK: "fundsPage.account.BANK",
  TELEBIRR: "fundsPage.account.TELEBIRR",
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
