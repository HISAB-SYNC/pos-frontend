import { getMockStore, mockDelay } from "./store";
import { seedDashboardMetrics, seedReportMetrics } from "./data";

export async function mockGetCustomers(shopId: string) {
  await mockDelay();
  return getMockStore().customers.filter((customer) => customer.shopId === shopId);
}

export async function mockGetDebts(shopId: string) {
  await mockDelay();
  return getMockStore().debts.filter((debt) => debt.shopId === shopId);
}

export async function mockGetExpenses(shopId: string) {
  await mockDelay();
  return getMockStore().expenses.filter((expense) => expense.shopId === shopId);
}

export async function mockGetDashboardMetrics(_shopId: string) {
  await mockDelay();
  return seedDashboardMetrics;
}

export async function mockGetReportMetrics(_shopId: string) {
  await mockDelay();
  return seedReportMetrics;
}

export {
  seedCustomers,
  seedDebts,
  seedExpenses,
  seedExpensesSummary,
  seedDashboardMetrics,
  seedReportMetrics,
  seedOrders,
  seedOverallOrders,
  type DashboardMetrics,
  type ReportMetrics,
} from "./data";

export type { Customer, Debt, Expense, ExpensesSummary, OrderRecord, OverallOrdersSummary } from "@/lib/api/types";

export { getMockStore, resetMockStore } from "./store";



