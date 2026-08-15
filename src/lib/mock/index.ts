import { getMockStore, mockDelay } from "./store";
import { seedDashboardMetrics } from "./data";

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

export {
  seedCustomers,
  seedDebts,
  seedExpenses,
  seedDashboardMetrics,
  type Customer,
  type Debt,
  type Expense,
  type DashboardMetrics,
} from "./data";

export { getMockStore, resetMockStore } from "./store";
