import { isMockApiEnabled } from "@/config/env";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { FundAccount, FundsEntries, FundsLine, FundsSummary, MoneyAddedReason, SupplierPayables, SupplierPayment } from "./types";

/* ------------------------------------------------------------------ */
/* Funds (Money Left) API                                              */
/* ------------------------------------------------------------------ */

const FUND_ACCOUNT_LABELS: Record<FundAccount, string> = {
  CASH_DRAWER: "Cash Till",
  BANK: "Bank",
  TELEBIRR: "Telebirr",
};

function emptyFundsSummary(): FundsSummary {
  const lines = { sales: 0, repayments: 0, added: 0, restocks: 0, expenses: 0, refunds: 0, supplierPayments: 0 };
  return {
    lines,
    moneyIn: 0,
    moneyOut: 0,
    moneyLeft: 0,
    accounts: (Object.keys(FUND_ACCOUNT_LABELS) as FundAccount[]).map((account) => ({
      account,
      label: FUND_ACCOUNT_LABELS[account],
      lines: { ...lines },
      moneyIn: 0,
      moneyOut: 0,
      balance: 0,
    })),
    owedToSuppliers: 0,
    since: null,
    generatedAt: new Date().toISOString(),
  };
}

/** Money in − money out, in total and per account. Computed by the backend from source records. */
export async function getFundsSummary(shopId: string): Promise<FundsSummary> {
  if (isMockApiEnabled()) {
    return emptyFundsSummary();
  }
  return apiRequest<FundsSummary>(API_ENDPOINTS.shops.funds(shopId));
}

/** The records behind one line of the Money Left card. */
export async function getFundsEntries(
  shopId: string,
  params: { line?: FundsLine; account?: FundAccount; limit?: number; from?: string; to?: string } = {},
): Promise<FundsEntries> {
  if (isMockApiEnabled()) {
    return { line: params.line ?? null, account: params.account ?? null, total: 0, count: 0, items: [] };
  }
  const query = new URLSearchParams();
  if (params.line) query.set("line", params.line);
  if (params.account) query.set("account", params.account);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  return apiRequest<FundsEntries>(`${API_ENDPOINTS.shops.fundsEntries(shopId)}${qs ? `?${qs}` : ""}`);
}

/** Records money added to an account from outside sales. */
export async function addMoneyToAccount(
  shopId: string,
  input: { account: FundAccount; amount: number; reason: MoneyAddedReason; notes?: string },
) {
  if (isMockApiEnabled()) {
    return { id: `adj-${Date.now()}`, ...input };
  }
  return apiRequest(API_ENDPOINTS.shops.fundsAdjustments(shopId), {
    method: "POST",
    body: input,
  });
}

/* ------------------------------------------------------------------ */
/* Supplier payables (pay-later restocks)                              */
/* ------------------------------------------------------------------ */

/** What the shop still owes each supplier for pay-later restocks. */
export async function getSupplierPayables(shopId: string): Promise<SupplierPayables> {
  if (isMockApiEnabled()) {
    return { totalOwed: 0, suppliers: [] };
  }
  return apiRequest<SupplierPayables>(API_ENDPOINTS.shops.supplierPayables(shopId));
}

/** Supplier payment history, newest first. */
export async function getSupplierPayments(
  shopId: string,
  params: { supplierId?: string | null; supplierName?: string | null; limit?: number } = {},
): Promise<SupplierPayment[]> {
  if (isMockApiEnabled()) {
    return [];
  }
  const query = new URLSearchParams();
  if (params.supplierId) query.set("supplierId", params.supplierId);
  else if (params.supplierName) query.set("supplierName", params.supplierName);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<SupplierPayment[]>(`${API_ENDPOINTS.shops.supplierPayments(shopId)}${qs ? `?${qs}` : ""}`);
}

/**
 * Pays a supplier. Settles the oldest pay-later restocks first and takes the
 * money out of the chosen account.
 */
export async function paySupplier(
  shopId: string,
  input: {
    supplierId?: string | null;
    supplierName?: string | null;
    amount: number;
    account: FundAccount;
    /** Settle only these restocks (oldest first). Omit to settle all, oldest first. */
    purchaseIds?: string[];
    notes?: string;
    moneyAdded?: { amount: number; reason: MoneyAddedReason; notes?: string };
  },
): Promise<{ remainingOwed: number }> {
  if (isMockApiEnabled()) {
    return { remainingOwed: 0 };
  }
  return apiRequest(API_ENDPOINTS.shops.supplierPayments(shopId), {
    method: "POST",
    body: {
      ...input,
      supplierId: input.supplierId || undefined,
      supplierName: input.supplierId ? undefined : input.supplierName || undefined,
    },
  });
}
