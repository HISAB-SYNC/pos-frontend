import { isMockApiEnabled } from "@/config/env";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { Expense } from "./types";

/* ------------------------------------------------------------------ */
/* Expenses API                                                        */
/* ------------------------------------------------------------------ */
/** Expense form values (Cash / Bank / Telebirr) → backend enum. Bank transfer is stored as CARD. */
function toBackendExpenseMethod(method: string) {
  const pm = (method || "").toUpperCase();
  if (pm.includes("CARD") || pm.includes("BANK")) return "CARD";
  if (pm.includes("MOBILE") || pm.includes("TELEBIRR")) return "MOBILE";
  return "CASH";
}

/** Backend enum → expense form values. */
function fromBackendExpenseMethod(method?: string) {
  if (method === "CARD") return "Bank";
  if (method === "MOBILE") return "Telebirr";
  return "Cash";
}

function fromBackendExpenseStatus(status?: string) {
  if (status === "PENDING") return "Pending";
  if (status === "OVERDUE") return "Overdue";
  return "Paid";
}

export async function getExpensesSummary(shopId: string) {
  const expenses = await getExpenses(shopId);
  const totalAmount = expenses.reduce((sum, e) => sum + (typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount).replace(/,/g, "")) || 0), 0);
  return {
    totalExpenses: {
      amount: totalAmount,
      count: expenses.length,
    },
    totalPaid: {
      count: expenses.length,
      cost: totalAmount,
      subtext: "Total disbursed",
      costLabel: "ETB",
    },
  };
}

export async function getExpenses(shopId: string): Promise<Expense[]> {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    return store.expenses.filter((e) => !e.shopId || e.shopId === shopId);
  }

  // The backend pages expenses (max 100 per page): load every page so the list
  // and totals are complete. Errors propagate (no demo data).
  const rawList: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const live = await apiRequest<any>(`${API_ENDPOINTS.shops.expenses(shopId)}?limit=100&page=${page}`);
    const items = Array.isArray(live) ? live : Array.isArray(live?.expenses) ? live.expenses : [];
    rawList.push(...items);
    const totalPages = live?.totalPages ?? live?.pagination?.totalPages ?? 1;
    if (Array.isArray(live) || page >= totalPages || items.length === 0) break;
  }

  return rawList.map((e: any) => ({
    id: e.id,
    shopId: e.shopId || shopId,
    description: e.title || e.description || "Store Expense",
    category: e.category || "General",
    amount: typeof e.amount === "number" ? e.amount : parseFloat(e.amount || "0"),
    paymentMethod: fromBackendExpenseMethod(e.paymentMethod),
    status: fromBackendExpenseStatus(e.status),
    date: e.expenseDate
      ? new Date(e.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : (e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"),
    notes: e.notes || "",
  }));
}

export async function createExpense(
  shopId: string,
  input: {
    date: string;
    description: string;
    category: string;
    amount: number | string;
    paymentMethod: string;
    status: string;
    notes?: string;
  },
) {
  const numAmount = typeof input.amount === "number" ? input.amount : parseFloat(String(input.amount).replace(/,/g, "")) || 0;
  const normalizedMethod = toBackendExpenseMethod(input.paymentMethod);

  if (isMockApiEnabled()) {
    const { seedExpenses } = await import("@/lib/mock/data");
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      shopId,
      date: input.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      description: input.description,
      category: input.category,
      amount: numAmount,
      paymentMethod: input.paymentMethod,
      status: input.status,
      notes: input.notes,
    };
    seedExpenses.unshift(newExp);
    return newExp;
  }

  const res = await apiRequest<any>(API_ENDPOINTS.shops.expenses(shopId), {
    method: "POST",
    body: {
      title: input.description,
      category: input.category || "General",
      amount: numAmount,
      notes: input.notes || "",
      paymentMethod: normalizedMethod,
      status: (input.status || "Paid").toUpperCase(),
      expenseDate: new Date().toISOString(),
    },
  });

  return {
    id: res.id,
    shopId: res.shopId,
    description: res.title || input.description,
    category: res.category || input.category,
    amount: typeof res.amount === "number" ? res.amount : parseFloat(res.amount || "0"),
    paymentMethod: fromBackendExpenseMethod(res.paymentMethod || normalizedMethod),
    status: fromBackendExpenseStatus(res.status),
    date: res.expenseDate
      ? new Date(res.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Today",
    notes: res.notes || input.notes || "",
  } as Expense;
}

export async function updateExpense(
  shopId: string,
  expenseId: string,
  input: Partial<Omit<Expense, "id">>,
) {
  if (isMockApiEnabled()) {
    const { seedExpenses } = await import("@/lib/mock/data");
    const exp = seedExpenses.find((e) => e.id === expenseId);
    if (exp) {
      Object.assign(exp, input);
    }
    return exp || ({ id: expenseId, ...input } as Expense);
  }

  const body: Record<string, any> = {};
  if (input.description) body.title = input.description;
  if (input.category) body.category = input.category;
  if (input.amount !== undefined) {
    body.amount = typeof input.amount === "number" ? input.amount : parseFloat(String(input.amount).replace(/,/g, "")) || 0;
  }
  if (input.notes) body.notes = input.notes;
  if (input.paymentMethod) {
    body.paymentMethod = toBackendExpenseMethod(input.paymentMethod);
  }
  if (input.status) {
    body.status = input.status.toUpperCase();
  }

  const res = await apiRequest<any>(API_ENDPOINTS.shops.expense(shopId, expenseId), {
    method: "PATCH",
    body,
  });

  return {
    id: res.id || expenseId,
    shopId: res.shopId || shopId,
    description: res.title || input.description || "Expense",
    category: res.category || input.category || "General",
    amount: res.amount !== undefined ? (typeof res.amount === "number" ? res.amount : parseFloat(res.amount)) : (input.amount || 0),
    paymentMethod: fromBackendExpenseMethod(res.paymentMethod),
    status: fromBackendExpenseStatus(res.status),
    date: res.expenseDate ? new Date(res.expenseDate).toLocaleDateString("en-US") : "Today",
    notes: res.notes || input.notes || "",
  } as Expense;
}

export async function deleteExpense(shopId: string, expenseId: string) {
  if (isMockApiEnabled()) {
    const { seedExpenses } = await import("@/lib/mock/data");
    const idx = seedExpenses.findIndex((e) => e.id === expenseId);
    if (idx !== -1) {
      seedExpenses.splice(idx, 1);
    }
    return { success: true, message: "Expense deleted" };
  }

  await apiRequest(API_ENDPOINTS.shops.expense(shopId, expenseId), {
    method: "DELETE",
  });

  return { success: true, message: "Expense deleted" };
}
