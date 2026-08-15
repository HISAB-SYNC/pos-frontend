import { isMockApiEnabled } from "@/config/env";
import {
  mockGetCustomers,
  mockGetDashboardMetrics,
  mockGetDebts,
  mockGetExpenses,
} from "@/lib/mock";

export async function getCustomers(shopId: string) {
  if (isMockApiEnabled()) {
    return mockGetCustomers(shopId);
  }

  throw new Error("Customers API is not available yet. Enable mock mode or wait for backend support.");
}

export async function getDebts(shopId: string) {
  if (isMockApiEnabled()) {
    return mockGetDebts(shopId);
  }

  throw new Error("Debts API is not available yet. Enable mock mode or wait for backend support.");
}

export async function getExpenses(shopId: string) {
  if (isMockApiEnabled()) {
    return mockGetExpenses(shopId);
  }

  throw new Error("Expenses API is not available yet. Enable mock mode or wait for backend support.");
}

export async function getDashboardMetrics(shopId: string) {
  if (isMockApiEnabled()) {
    return mockGetDashboardMetrics(shopId);
  }

  throw new Error("Dashboard API is not available yet. Enable mock mode or wait for backend support.");
}

export type {
  Customer,
  Debt,
  Expense,
  DashboardMetrics,
} from "@/lib/mock/data";
