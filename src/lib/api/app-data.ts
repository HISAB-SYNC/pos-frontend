import { isMockApiEnabled } from "@/config/env";
import {
  type DashboardMetrics,
  mockGetCustomers,
  mockGetDashboardMetrics,
} from "@/lib/mock";
import { getMockStore } from "@/lib/mock/store";

import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  AnalyticsPeriod,
  BackendDashboardMetrics,
  Category,
  Customer,
  Debt,
  Expense,
  ExpensesSummary,
  OrderRecord,
  OverallOrdersSummary,
  Product,
  Sale,
  ShopAnalyticsReport,
  Supplier,
  TeamMember,
  TeamSummary,
  UpdateProfileInput,
  UserProfile,
} from "./types";


/* ------------------------------------------------------------------ */
/* Customers API                                                       */
/* ------------------------------------------------------------------ */



export async function getCustomers(shopId: string, params?: { search?: string }) {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    let list = store.customers.filter((c) => !c.shopId || c.shopId === shopId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
    }
    return list;
  }

  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const liveData = await apiRequest<Customer[]>(`${API_ENDPOINTS.shops.customers(shopId)}${suffix}`);

    if (Array.isArray(liveData)) {
      return liveData.map((c) => ({
        ...c,
        creditLimit: c.creditLimit || "5000",
        debtBalance: c.debtBalance !== undefined ? String(c.debtBalance) : "0.00",
        status: (c.status || (parseFloat(c.debtBalance || "0") > 0 ? "Active" : "Active")) as "Active" | "Overdue" | "Inactive",
        date: c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "Recent"),
        recentTransactions: c.recentTransactions || [],
      }));
    }
    return [];
  } catch {
    const store = getMockStore();
    return store.customers.filter((c) => !c.shopId || c.shopId === shopId);
  }
}





export async function createCustomer(
  shopId: string,
  input: { name: string; phone?: string; email?: string; address?: string },
) {
  if (isMockApiEnabled()) {
    return {
      id: `cust-${Date.now()}`,
      shopId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      address: input.address,
      debtBalance: "0.00",
    } as Customer;
  }

  return apiRequest<Customer>(API_ENDPOINTS.shops.customers(shopId), {
    method: "POST",
    body: input,
  });
}

export async function updateCustomer(
  shopId: string,
  customerId: string,
  input: Partial<{ name: string; phone: string; email: string; address: string }>,
) {
  if (isMockApiEnabled()) {
    return { id: customerId, ...input } as Customer;
  }

  return apiRequest<Customer>(`${API_ENDPOINTS.shops.customers(shopId)}/${customerId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function getCustomerDetail(shopId: string, customerId: string) {
  if (isMockApiEnabled()) {
    const list = await mockGetCustomers(shopId);
    return list.find((c) => c.id === customerId) || null;
  }

  return apiRequest<Customer>(API_ENDPOINTS.shops.customerDetail(shopId, customerId));
}

export async function deleteCustomer(_shopId: string, customerId: string) {
  const { seedCustomers } = await import("@/lib/mock/data");
  const idx = seedCustomers.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    seedCustomers.splice(idx, 1);
  }

  return { success: true, message: "Customer deleted" };
}


/* ------------------------------------------------------------------ */
/* Debts API & Debt Management                                         */
/* ------------------------------------------------------------------ */
export async function getDebts(shopId: string, params?: { status?: string; customerId?: string; search?: string }) {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    let list = store.debts.filter((d) => !d.shopId || d.shopId === shopId);
    if (params?.customerId) {
      list = list.filter((d) => d.customerId === params.customerId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.customerName?.toLowerCase().includes(q) ||
          d.customerPhone?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q),
      );
    }
    return list;
  }

  try {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.customerId) query.set("customerId", params.customerId);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const liveData = await apiRequest<Debt[]>(`${API_ENDPOINTS.shops.debts(shopId)}${suffix}`);
    if (Array.isArray(liveData)) {
      return liveData.map((d) => {
        const cust = store.customers.find((c) => c.id === d.customerId || c.name === d.customerName);
        return {
          ...d,
          customerPhone: d.customerPhone || cust?.phone || "+251912345678",
          paidAmount: d.paidAmount || (cust ? String(cust.totalPaid || 0) : "0"),
          transactions: d.transactions || cust?.debtHistory || [],
        };
      });
    }
    return store.debts.filter((d) => !d.shopId || d.shopId === shopId);
  } catch {
    return store.debts.filter((d) => !d.shopId || d.shopId === shopId);
  }
}

export async function getDebtSummary(shopId: string) {
  const debts = await getDebts(shopId);
  const totalOutstanding = debts.reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);
  const totalDebtors = debts.filter((d) => parseFloat(d.amount || "0") > 0).length;
  const overdueCount = debts.filter(
    (d) => d.status.toUpperCase() === "OVERDUE" || (d.dueDate && new Date(d.dueDate) < new Date()),
  ).length;
  const collectedThisMonth = debts.reduce((sum, d) => sum + parseFloat(d.paidAmount || "0"), 0);

  return {
    totalOutstandingDebt: totalOutstanding,
    totalDebtors,
    collectedThisMonth,
    overdueCount,
  };
}

export async function createDebt(
  shopId: string,
  input: { customerId: string; amount: number; dueDate?: string; notes?: string },
) {
  if (isMockApiEnabled()) {
    return {
      id: `debt-${Date.now()}`,
      shopId,
      customerId: input.customerId,
      amount: input.amount.toFixed(2),
      status: "PENDING",
      dueDate: input.dueDate,
      notes: input.notes,
    } as Debt;
  }

  return apiRequest<Debt>(API_ENDPOINTS.shops.debts(shopId), {
    method: "POST",
    body: input,
  });
}

export async function recordDebtPayment(
  shopId: string,
  input: {
    customerId: string;
    debtId?: string;
    amount: number;
    paymentMethod: "Cash" | "Card" | "Bank Transfer" | "Mobile Payment" | string;
    notes?: string;
    reference?: string;
  },
) {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  const { seedCustomers, seedDebts } = await import("@/lib/mock/data");

  const customer = seedCustomers.find((c) => c.id === input.customerId);
  const currentDebt = customer ? parseFloat(customer.debtBalance || "0") : 0;
  const newBalance = Math.max(0, currentDebt - input.amount);

  const ref = input.reference || `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
  const transaction = {
    id: `dth-${Date.now()}`,
    customerId: input.customerId,
    customerName: customer?.name || "Customer",
    type: "Debt Payment" as const,
    reference: ref,
    amount: -Math.abs(input.amount),
    remainingBalance: newBalance,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    paymentMethod: input.paymentMethod,
    notes: input.notes || "Debt payment recorded",
  };

  if (customer) {
    customer.debtBalance = String(newBalance);
    customer.totalPaid = (parseFloat(String(customer.totalPaid || "0")) + input.amount).toFixed(0);
    customer.lastTransactionDate = transaction.date;
    if (!customer.debtHistory) customer.debtHistory = [];
    customer.debtHistory.unshift(transaction);
  }

  const debtRecord = seedDebts.find((d) => d.customerId === input.customerId || (input.debtId && d.id === input.debtId));
  if (debtRecord) {
    debtRecord.amount = String(newBalance);
    debtRecord.paidAmount = String(parseFloat(debtRecord.paidAmount || "0") + input.amount);
    debtRecord.status = newBalance === 0 ? "PAID" : "PARTIAL";
    if (!debtRecord.transactions) debtRecord.transactions = [];
    debtRecord.transactions.unshift(transaction);
  }

  const debtIdToUse = input.debtId || debtRecord?.id;
  if (!isMockApiEnabled() && debtIdToUse) {
    const updatedDebt = await apiRequest<Debt>(API_ENDPOINTS.shops.debtPayments(shopId, debtIdToUse), {
      method: "POST",
      body: { amount: input.amount },
    });
    return {
      success: true,
      newBalance: updatedDebt?.amount !== undefined ? parseFloat(updatedDebt.amount) : newBalance,
      transaction,
    };
  }

  return {
    success: true,
    newBalance,
    transaction,
  };
}


/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* POS & Sales API                                                     */
/* ------------------------------------------------------------------ */
export async function createSale(
  shopId: string,
  input: {
    customerId?: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number; name?: string }>;
    discountAmount?: number;
    taxAmount?: number;
    totalAmount: number;
    amountPaid?: number;
    paymentMethod: "CASH" | "BANK" | "TELEBIRR" | string;
    splitDetails?: {
      cashAmount?: number;
      debtAmount?: number;
      paymentMethod?: string;
    };
    notes?: string;
  },
) {
  const { seedCustomers, seedDebts, seedProducts, seedSales, seedProductHistory } = await import("@/lib/mock/data");

  const saleRef = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // 1. Stock Validation & Deduction
  input.items.forEach((item) => {
    const prod = seedProducts.find((p) => p.id === item.productId);
    if (prod) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      if (Array.isArray(seedProductHistory)) {
        seedProductHistory.unshift({
          id: `hist-${Date.now()}-${item.productId}`,
          productId: item.productId,
          transactionId: saleRef,
          type: "Sale",
          quantity: -item.quantity,
          store: "Main Warehouse",
          value: (item.unitPrice || parseFloat(prod.price || "0")) * item.quantity,
          date: dateStr,
          person: "POS Cashier",
        });
      }
    }
  });

  // 2. Determine Debt Portion for Unpaid/Remaining Balance
  const paid = input.amountPaid !== undefined ? input.amountPaid : (input.splitDetails?.cashAmount ?? input.totalAmount);
  const debtPortion = Math.max(0, input.totalAmount - paid);

  // 3. Update Customer Debt & Add Transaction Record
  let customerObj: (typeof seedCustomers)[0] | null = null;
  if (input.customerId) {
    customerObj = seedCustomers.find((c) => c.id === input.customerId) || null;
    if (customerObj && debtPortion > 0) {
      const currentDebt = parseFloat(customerObj.debtBalance || "0");
      const newTotalDebt = currentDebt + debtPortion;
      customerObj.debtBalance = String(newTotalDebt);
      customerObj.totalCreditPurchases = parseFloat(String(customerObj.totalCreditPurchases || "0")) + debtPortion;
      customerObj.lastTransactionDate = dateStr;

      const debtTx: (typeof seedCustomers)[0]["debtHistory"] extends (infer T)[] | undefined ? T : never = {
        id: `dth-${Date.now()}`,
        customerId: customerObj.id,
        customerName: customerObj.name,
        type: "Debt Sale",
        reference: saleRef,
        amount: debtPortion,
        remainingBalance: newTotalDebt,
        date: dateStr,
        paymentMethod: paid > 0 ? `Partial ${input.paymentMethod}` : "Credit Sale",
        notes: input.notes || `Sale ${saleRef} remaining ${debtPortion} ETB added to customer debt`,
      };

      if (!customerObj.debtHistory) customerObj.debtHistory = [];
      customerObj.debtHistory.unshift(debtTx);

      // Sync with seedDebts list
      let debtRecord = seedDebts.find((d) => d.customerId === customerObj!.id);
      if (debtRecord) {
        debtRecord.amount = String(newTotalDebt);
        if (!debtRecord.transactions) debtRecord.transactions = [];
        debtRecord.transactions.unshift(debtTx);
      } else {
        seedDebts.unshift({
          id: `debt-${Date.now()}`,
          shopId,
          customerId: customerObj.id,
          customerName: customerObj.name,
          customerPhone: customerObj.phone,
          amount: String(newTotalDebt),
          paidAmount: String(customerObj.totalPaid || 0),
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          status: "pending",
          notes: `Debt created from sale ${saleRef}`,
          transactions: [debtTx],
        });
      }
    }
  }

  const createdSale: Sale = {
    id: `sale-${Date.now()}`,
    shopId,
    customerId: input.customerId,
    totalAmount: input.totalAmount.toFixed(2),
    amountPaid: paid.toFixed(2),
    debtAmount: debtPortion.toFixed(2),
    subtotal: (input.totalAmount + (input.discountAmount || 0) - (input.taxAmount || 0)).toFixed(2),
    discountAmount: input.discountAmount ? input.discountAmount.toFixed(2) : "0.00",
    taxAmount: input.taxAmount ? input.taxAmount.toFixed(2) : "0.00",
    paymentMethod: input.paymentMethod,
    splitDetails: {
      cashAmount: paid,
      debtAmount: debtPortion,
      paymentMethod: input.paymentMethod,
    },
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    items: input.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice ? it.unitPrice.toFixed(2) : "0.00",
      subtotal: ((it.unitPrice || 0) * it.quantity).toFixed(2),
      product: {
        id: it.productId,
        name: it.name || "Product",
        sku: "SKU",
      },
    })),
    customer: customerObj,
  };

  if (!isMockApiEnabled()) {
    const backendPaymentMethod =
      input.paymentMethod === "BANK" || input.paymentMethod === "CARD"
        ? "CARD"
        : input.paymentMethod === "TELEBIRR" || input.paymentMethod === "MOBILE"
        ? "MOBILE"
        : "CASH";

    return await apiRequest<Sale>(API_ENDPOINTS.shops.sales(shopId), {
      method: "POST",
      body: {
        customerId: input.customerId,
        paymentMethod: backendPaymentMethod,
        discountAmount: input.discountAmount || 0,
        isCredit: debtPortion > 0,
        items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      },
    });
  }

  if (Array.isArray(seedSales)) {
    seedSales.unshift(createdSale);
  }

  return createdSale;
}


export async function getSales(
  shopId: string,
  params?: { startDate?: string; endDate?: string; customerId?: string; paymentMethod?: string },
) {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    let list = store.sales.filter((s) => !s.shopId || s.shopId === shopId);
    if (params?.customerId) list = list.filter((s) => s.customerId === params.customerId);
    if (params?.paymentMethod) list = list.filter((s) => s.paymentMethod === params.paymentMethod);
    return list;
  }

  try {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.customerId) query.set("customerId", params.customerId);
    if (params?.paymentMethod) query.set("paymentMethod", params.paymentMethod);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const liveData = await apiRequest<Sale[]>(`${API_ENDPOINTS.shops.sales(shopId)}${suffix}`);
    if (Array.isArray(liveData)) {
      return liveData;
    }
    return store.sales.filter((s) => !s.shopId || s.shopId === shopId);
  } catch {
    return store.sales.filter((s) => !s.shopId || s.shopId === shopId);
  }
}

export async function getSaleDetail(shopId: string, saleId: string) {
  const { seedSales } = await import("@/lib/mock/data");

  if (isMockApiEnabled()) {
    return seedSales.find((s) => s.id === saleId) || null;
  }

  try {
    return await apiRequest<Sale>(API_ENDPOINTS.shops.saleDetail(shopId, saleId));
  } catch {
    return seedSales.find((s) => s.id === saleId) || null;
  }
}

export async function voidSale(shopId: string, saleId: string) {
  const { seedSales, seedProducts, seedCustomers, seedDebts } = await import("@/lib/mock/data");

  const sale = seedSales.find((s) => s.id === saleId);
  if (sale) {
    sale.status = "CANCELLED";

    // 1. Restore product inventory stock
    if (sale.items) {
      sale.items.forEach((it) => {
        const prod = seedProducts.find((p) => p.id === it.productId);
        if (prod) {
          prod.stockQuantity += it.quantity;
        }
      });
    }

    // 2. Reverse customer debt if applicable
    if (sale.customerId) {
      const customer = seedCustomers.find((c) => c.id === sale.customerId);
      const debtAmount = sale.paymentMethod === "DEBT" ? parseFloat(sale.totalAmount) : (sale.splitDetails?.debtAmount || 0);

      if (customer && debtAmount > 0) {
        const curDebt = parseFloat(customer.debtBalance || "0");
        customer.debtBalance = String(Math.max(0, curDebt - debtAmount));
        const debtRecord = seedDebts.find((d) => d.customerId === sale.customerId);
        if (debtRecord) {
          debtRecord.amount = customer.debtBalance;
        }
      }
    }
  }

  return { success: true, message: "Sale voided and stock restored" };
}


/* ------------------------------------------------------------------ */
/* Expenses API                                                        */
/* ------------------------------------------------------------------ */
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

  try {
    const live = await apiRequest<any>(API_ENDPOINTS.shops.expenses(shopId));
    const rawList = Array.isArray(live) ? live : Array.isArray(live?.expenses) ? live.expenses : [];

    return rawList.map((e: any) => ({
      id: e.id,
      shopId: e.shopId || shopId,
      description: e.title || e.description || "Store Expense",
      category: e.category || "General",
      amount: typeof e.amount === "number" ? e.amount : parseFloat(e.amount || "0"),
      paymentMethod: e.paymentMethod === "CARD" ? "Card" : e.paymentMethod === "MOBILE" ? "Mobile" : e.paymentMethod || "Cash",
      status: "Paid",
      date: e.expenseDate
        ? new Date(e.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : (e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"),
      notes: e.notes || "",
    }));
  } catch {
    return store.expenses.filter((e) => !e.shopId || e.shopId === shopId);
  }
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
  const pm = (input.paymentMethod || "").toUpperCase();
  const normalizedMethod = pm.includes("CARD") ? "CARD" : pm.includes("MOBILE") || pm.includes("TELEBIRR") ? "MOBILE" : "CASH";

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
      expenseDate: new Date().toISOString(),
    },
  });

  return {
    id: res.id,
    shopId: res.shopId,
    description: res.title || input.description,
    category: res.category || input.category,
    amount: typeof res.amount === "number" ? res.amount : parseFloat(res.amount || "0"),
    paymentMethod: res.paymentMethod || normalizedMethod,
    status: "Paid",
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
    const pm = input.paymentMethod.toUpperCase();
    body.paymentMethod = pm.includes("CARD") ? "CARD" : pm.includes("MOBILE") || pm.includes("TELEBIRR") ? "MOBILE" : "CASH";
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
    paymentMethod: res.paymentMethod || input.paymentMethod || "Cash",
    status: "Paid",
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



export async function getBackendDashboardMetrics(shopId: string) {
  if (isMockApiEnabled()) {
    return {
      todaysSales: { count: 12, totalAmount: 4500.5 },
      lowStockCount: 3,
      outstandingDebts: { count: 4, totalAmount: 1200.0 },
    } as BackendDashboardMetrics;
  }

  return apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId));
}

export async function getDashboardMetrics(shopId: string): Promise<DashboardMetrics> {
  const store = getMockStore();

  const computeMockDashboardMetrics = (targetShopId: string): DashboardMetrics => {
    const shopSales = store.sales.filter((s) => (!s.shopId || s.shopId === targetShopId) && s.status !== "CANCELLED");
    const shopProducts = store.products.filter((p) => p.shopId === targetShopId);
    const shopExpenses = store.expenses.filter((e) => (!e.shopId || e.shopId === targetShopId) && e.status === "Paid");
    const shopCustomers = store.customers.filter((c) => !c.shopId || c.shopId === targetShopId);
    const shopDebts = store.debts.filter((d) => !d.shopId || d.shopId === targetShopId);

    const totalSalesRev = shopSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);

    let totalCogs = 0;
    shopSales.forEach((s) => {
      if (s.items && s.items.length > 0) {
        s.items.forEach((it) => {
          const prod = shopProducts.find((p) => p.id === it.productId);
          const attrs = (prod?.attributes ?? {}) as Record<string, any>;
          const costPrice = parseFloat(attrs.buyingPrice || attrs.costPrice || "0") || (parseFloat(prod?.price || "0") * 0.7);
          totalCogs += costPrice * it.quantity;
        });
      } else {
        totalCogs += parseFloat(s.totalAmount || "0") * 0.7;
      }
    });

    const totalPaidExpenses = shopExpenses.reduce(
      (sum, e) => sum + (typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount || "0").replace(/,/g, "")) || 0),
      0,
    );

    const grossProfit = Math.max(0, totalSalesRev - totalCogs);
    const netProfit = Math.max(0, grossProfit - totalPaidExpenses);

    const totalOutstandingDebt = shopDebts.reduce((sum, d) => sum + (parseFloat(d.amount || "0") || 0), 0)
      || shopCustomers.reduce((sum, c) => sum + (parseFloat(c.debtBalance || "0") || 0), 0);
    const debtorsCount = shopDebts.filter((d) => (parseFloat(d.amount || "0") || 0) > 0).length
      || shopCustomers.filter((c) => (parseFloat(c.debtBalance || "0") || 0) > 0).length;

    const breakdown = { cash: 0, bank: 0, telebirr: 0 };
    shopSales.forEach((s) => {
      const method = (s.paymentMethod || "").toUpperCase();
      const paid = s.amountPaid !== undefined ? parseFloat(String(s.amountPaid)) : (s.splitDetails?.cashAmount ?? parseFloat(s.totalAmount || "0"));
      if (method === "BANK" || method === "BANK_TRANSFER") breakdown.bank += paid;
      else if (method === "TELEBIRR" || method === "MOBILE") breakdown.telebirr += paid;
      else breakdown.cash += paid;
    });

    const lowStockList = shopProducts.filter((p) => p.stockQuantity <= (p.lowStockThreshold || 5));

    const recentSales = shopSales.slice(0, 4).map((s) => {
      const cust = shopCustomers.find((c) => c.id === s.customerId);
      const method = (s.paymentMethod || "CASH").toUpperCase();
      const methodLabel = method === "BANK" || method === "BANK_TRANSFER" ? "Bank" : method === "TELEBIRR" || method === "MOBILE" ? "Telebirr" : "Cash";

      return {
        id: s.id.slice(0, 8),
        customerName: cust?.name || s.customer?.name || "Walk-in Customer",
        totalAmount: parseFloat(s.totalAmount || "0"),
        paymentMethod: methodLabel,
        date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: s.status,
      };
    });

    const topSellingStock = shopProducts.slice(0, 3).map((p, idx) => ({
      name: p.name,
      soldQuantity: shopSales.length > 0 ? Math.max(1, 20 - idx * 5) : 0,
      remainingQuantity: p.stockQuantity,
      price: `${parseFloat(p.price || "0").toLocaleString()} Birr`,
    }));

    const lowQuantityStock = lowStockList.map((p) => ({
      id: p.id,
      name: p.name,
      remainingQuantity: p.stockQuantity,
      unit: p.unit || "pcs",
    }));

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const salesAndPurchase = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map((m, idx) => ({
      month: m,
      sales: totalSalesRev > 0 ? Math.round((totalSalesRev / 6) * (0.7 + idx * 0.1)) : 0,
      purchase: totalCogs > 0 ? Math.round((totalCogs / 6) * (0.6 + idx * 0.12)) : 0,
    }));

    return {
      salesOverview: {
        sales: shopSales.length,
        revenue: totalSalesRev,
        profit: Math.round(grossProfit),
        cost: Math.round(totalCogs),
      },
      netProfit: Math.round(netProfit),
      grossProfit: Math.round(grossProfit),
      totalExpenses: Math.round(totalPaidExpenses),
      cogs: Math.round(totalCogs),
      outstandingDebt: Math.round(totalOutstandingDebt),
      debtorsCount,
      todaySalesCount: Math.min(shopSales.length, 5),
      todayRevenue: Math.round(totalSalesRev > 0 ? totalSalesRev * 0.25 : 0),
      paymentBreakdown: {
        cash: Math.round(breakdown.cash),
        bank: Math.round(breakdown.bank),
        telebirr: Math.round(breakdown.telebirr),
      },
      salesAndPurchase: salesAndPurchase.length > 0 ? salesAndPurchase : [
        { month: "Current", sales: totalSalesRev, purchase: totalCogs },
      ],
      topSellingStock,
      lowQuantityStock,
      recentSales,
    };
  };

  if (isMockApiEnabled()) {
    return computeMockDashboardMetrics(shopId);
  }

  try {
    const [backendMetrics, products, lowStock, liveSales, liveExpenses, liveDebts] = await Promise.allSettled([
      apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.products(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId)),
      apiRequest<Sale[]>(API_ENDPOINTS.shops.sales(shopId)),
      apiRequest<any>(API_ENDPOINTS.shops.expenses(shopId)),
      apiRequest<Debt[]>(API_ENDPOINTS.shops.debts(shopId)),
    ]);

    const bMetrics = backendMetrics.status === "fulfilled" ? backendMetrics.value : null;
    const prods = products.status === "fulfilled" && Array.isArray(products.value) ? products.value : [];
    const lowStockLive = lowStock.status === "fulfilled" && Array.isArray(lowStock.value) ? lowStock.value : [];
    const salesList = liveSales.status === "fulfilled" && Array.isArray(liveSales.value) ? liveSales.value : [];
    const validSales = salesList.filter((s) => s.status !== "CANCELLED");

    const rawExp = liveExpenses.status === "fulfilled" && Array.isArray(liveExpenses.value)
      ? liveExpenses.value
      : (liveExpenses.status === "fulfilled" && Array.isArray(liveExpenses.value?.expenses) ? liveExpenses.value.expenses : []);
    const totalLiveExpenses = rawExp.reduce(
      (sum: number, e: any) => sum + (typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount || "0").replace(/,/g, "")) || 0),
      0,
    );

    const debtsList = liveDebts.status === "fulfilled" && Array.isArray(liveDebts.value) ? liveDebts.value : [];
    const totalLiveDebt = bMetrics?.outstandingDebts?.totalAmount ?? debtsList.reduce((sum, d) => sum + (parseFloat(d.amount || "0") || 0), 0);
    const debtorsCount = bMetrics?.outstandingDebts?.count ?? debtsList.filter((d) => (parseFloat(d.amount || "0") || 0) > 0).length;

    const salesRev = validSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
    const calculatedRev = bMetrics?.todaysSales?.totalAmount !== undefined
      ? bMetrics.todaysSales.totalAmount
      : salesRev;

    const breakdown = { cash: 0, bank: 0, telebirr: 0 };
    validSales.forEach((s) => {
      const method = (s.paymentMethod || "").toUpperCase();
      const paid = s.amountPaid !== undefined ? parseFloat(String(s.amountPaid)) : (s.splitDetails?.cashAmount ?? parseFloat(s.totalAmount || "0"));
      if (method === "BANK" || method === "BANK_TRANSFER") breakdown.bank += paid;
      else if (method === "TELEBIRR" || method === "MOBILE") breakdown.telebirr += paid;
      else breakdown.cash += paid;
    });

    const recent = validSales.slice(0, 4).map((s) => {
      const method = (s.paymentMethod || "CASH").toUpperCase();
      const methodLabel = method === "BANK" || method === "BANK_TRANSFER" ? "Bank" : method === "TELEBIRR" || method === "MOBILE" ? "Telebirr" : "Cash";

      return {
        id: s.id.slice(0, 8),
        customerName: s.customer?.name || "Walk-in Customer",
        totalAmount: parseFloat(s.totalAmount || "0"),
        paymentMethod: methodLabel,
        date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: s.status,
      };
    });

    const liveTopSelling = prods.slice(0, 3).map((p) => ({
      name: p.name,
      soldQuantity: validSales.length > 0 ? 10 : 0,
      remainingQuantity: p.stockQuantity,
      price: `${parseFloat(p.price || "0").toLocaleString()} Birr`,
    }));

    const liveLowStock = lowStockLive.map((p) => ({
      id: p.id,
      name: p.name,
      remainingQuantity: p.stockQuantity,
      unit: p.unit || "pcs",
    }));

    const grossProfit = Math.round(calculatedRev * 0.35);
    const cogs = Math.round(calculatedRev * 0.65);
    const netProfit = Math.max(0, grossProfit - totalLiveExpenses);

    return {
      salesOverview: {
        sales: bMetrics?.todaysSales?.count ?? validSales.length,
        revenue: calculatedRev,
        profit: grossProfit,
        cost: cogs,
      },
      netProfit,
      grossProfit,
      totalExpenses: Math.round(totalLiveExpenses),
      cogs,
      outstandingDebt: Math.round(totalLiveDebt),
      debtorsCount,
      todaySalesCount: bMetrics?.todaysSales?.count ?? (validSales.length > 0 ? 1 : 0),
      todayRevenue: bMetrics?.todaysSales?.totalAmount ?? (salesRev > 0 ? salesRev : 0),
      paymentBreakdown: {
        cash: Math.round(breakdown.cash),
        bank: Math.round(breakdown.bank),
        telebirr: Math.round(breakdown.telebirr),
      },
      salesAndPurchase: [
        { month: "Current", sales: calculatedRev, purchase: cogs },
      ],
      topSellingStock: liveTopSelling,
      lowQuantityStock: liveLowStock,
      recentSales: recent,
    };
  } catch {
    return computeMockDashboardMetrics(shopId);
  }
}




/* ------------------------------------------------------------------ */
/* Shop Analytics & Reports API                                        */
/* ------------------------------------------------------------------ */
export async function getShopAnalytics(
  shopId: string,
  params?: { period?: AnalyticsPeriod; startDate?: string; endDate?: string },
): Promise<ShopAnalyticsReport> {
  const period = params?.period || "weekly";
  const startDate = params?.startDate || new Date(Date.now() - 7 * 86400000).toISOString();
  const endDate = params?.endDate || new Date().toISOString();

  const store = getMockStore();

  const computeAnalytics = (
    sSales: Sale[],
    sProducts: Product[],
    sCustomers: Customer[],
    sDebts: Debt[],
  ): ShopAnalyticsReport => {
    const validSales = sSales.filter((s) => s.status !== "CANCELLED");
    const totalRev = validSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
    const totalSalesCount = validSales.length;
    const avgOrderValue = totalSalesCount > 0 ? parseFloat((totalRev / totalSalesCount).toFixed(2)) : 0;
    const totalTax = parseFloat((totalRev * 0.15).toFixed(2));
    const totalDiscounts = validSales.reduce((sum, s) => sum + parseFloat(s.discountAmount || "0"), 0);

    const pmb: Record<string, { count: number; totalAmount: number }> = {
      CASH: { count: 0, totalAmount: 0 },
      BANK: { count: 0, totalAmount: 0 },
      TELEBIRR: { count: 0, totalAmount: 0 },
      CARD: { count: 0, totalAmount: 0 },
      MOBILE: { count: 0, totalAmount: 0 },
    };

    validSales.forEach((s) => {
      const m = (s.paymentMethod || "CASH").toUpperCase();
      const amt = parseFloat(s.totalAmount || "0");
      const key = (m === "BANK" || m === "BANK_TRANSFER") ? "BANK" : (m === "TELEBIRR" || m === "MOBILE") ? "TELEBIRR" : "CASH";
      if (!pmb[key]) pmb[key] = { count: 0, totalAmount: 0 };
      pmb[key].count += 1;
      pmb[key].totalAmount += amt;
    });

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const salesTrend = days.map((day, idx) => {
      if (totalSalesCount === 0) {
        return { date: day, salesCount: 0, totalRevenue: 0 };
      }
      const daySales = validSales.filter((_, sIdx) => sIdx % 7 === idx);
      const dayRev = daySales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
      return {
        date: day,
        salesCount: daySales.length,
        totalRevenue: dayRev > 0 ? dayRev : Math.round((totalRev / 7) * (0.6 + idx * 0.1)),
      };
    });

    const topSellingProducts = sProducts.slice(0, 5).map((p, idx) => {
      const qtySold = totalSalesCount > 0 ? Math.max(1, 20 - idx * 4) : 0;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        totalQuantitySold: qtySold,
        totalRevenue: qtySold * parseFloat(p.price || "0"),
      };
    });

    const lowStockCount = sProducts.filter((p) => p.stockQuantity <= (p.lowStockThreshold || 5)).length;

    const topCustomers = sCustomers.slice(0, 5).map((c, idx) => ({
      customerId: c.id,
      name: c.name,
      email: c.email || `${c.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      phone: c.phone || "+251911223344",
      salesCount: totalSalesCount > 0 ? Math.max(1, 5 - idx) : 0,
      totalSpent: parseFloat(String(c.totalPaid || "0")) || (totalSalesCount > 0 ? Math.round(totalRev * 0.2) : 0),
    }));

    const totalOutstanding = sDebts.reduce((sum, d) => sum + (parseFloat(d.amount || "0") || 0), 0);
    const totalDebtsCount = sDebts.filter((d) => (parseFloat(d.amount || "0") || 0) > 0).length;

    return {
      period,
      dateRange: { startDate, endDate },
      salesAnalytics: {
        totalSalesCount,
        totalRevenue: totalRev,
        totalTaxCollected: totalTax,
        totalDiscountsGiven: totalDiscounts,
        averageOrderValue: avgOrderValue,
        paymentMethodBreakdown: pmb,
        salesTrend,
      },
      productAnalytics: {
        topSellingProducts,
        lowStockCount,
        totalProductsCount: sProducts.length,
      },
      customerAnalytics: {
        totalCustomers: sCustomers.length,
        newCustomersInPeriod: Math.min(sCustomers.length, 6),
        topCustomers,
        outstandingDebt: {
          count: totalDebtsCount,
          totalAmount: totalOutstanding,
        },
      },
    };
  };

  const shopSales = store.sales.filter((s) => (!s.shopId || s.shopId === shopId) && s.status !== "CANCELLED");
  const shopProducts = store.products.filter((p) => p.shopId === shopId);
  const shopCustomers = store.customers.filter((c) => !c.shopId || c.shopId === shopId);
  const shopDebts = store.debts.filter((d) => !d.shopId || d.shopId === shopId);

  if (isMockApiEnabled()) {
    return computeAnalytics(shopSales, shopProducts, shopCustomers, shopDebts);
  }

  try {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const live = await apiRequest<any>(`${API_ENDPOINTS.shops.analytics(shopId)}${suffix}`);
    if (live && (live.sales || live.salesAnalytics)) {
      const s = live.sales || live.salesAnalytics || {};
      const p = live.products || live.productAnalytics || {};
      const c = live.customers || live.customerAnalytics || {};
      const d = live.debts || live.debtAnalytics || {};

      const rawPmb = s.paymentMethodBreakdown || {};
      const pmb = {
        ...rawPmb,
        CASH: rawPmb.CASH || { count: 0, totalAmount: 0 },
        CARD: rawPmb.CARD || rawPmb.BANK || { count: 0, totalAmount: 0 },
        MOBILE: rawPmb.MOBILE || rawPmb.TELEBIRR || { count: 0, totalAmount: 0 },
        BANK: rawPmb.BANK || rawPmb.CARD || { count: 0, totalAmount: 0 },
        TELEBIRR: rawPmb.TELEBIRR || rawPmb.MOBILE || { count: 0, totalAmount: 0 },
      };

      return {
        period: live.period || period,
        dateRange: {
          startDate: live.startDate || live.dateRange?.startDate || startDate,
          endDate: live.endDate || live.dateRange?.endDate || endDate,
        },
        salesAnalytics: {
          totalSalesCount: s.totalSalesCount ?? 0,
          totalRevenue: typeof s.totalRevenue === "number" ? s.totalRevenue : parseFloat(s.totalRevenue || "0"),
          totalTaxCollected: typeof s.totalTaxCollected === "number" ? s.totalTaxCollected : parseFloat(s.totalTaxCollected || "0"),
          totalDiscountsGiven: typeof s.totalDiscountsGiven === "number" ? s.totalDiscountsGiven : parseFloat(s.totalDiscountsGiven || "0"),
          averageOrderValue: typeof s.averageOrderValue === "number" ? s.averageOrderValue : parseFloat(s.averageOrderValue || "0"),
          paymentMethodBreakdown: pmb,
          salesTrend: Array.isArray(s.salesTrend) ? s.salesTrend : [],
        },
        productAnalytics: {
          topSellingProducts: Array.isArray(p?.topSellingProducts) ? p.topSellingProducts : [],
          lowStockCount: p?.lowStockCount ?? 0,
          totalProductsCount: p?.totalProductsCount ?? 0,
        },
        customerAnalytics: {
          totalCustomers: c?.totalCustomers ?? 0,
          newCustomersInPeriod: c?.newCustomersInPeriod ?? 0,
          topCustomers: Array.isArray(c?.topCustomers) ? c.topCustomers : [],
          outstandingDebt: {
            count: d?.outstandingDebtsCount ?? d?.count ?? 0,
            totalAmount: typeof d?.totalOutstandingDebtAmount === "number" ? d.totalOutstandingDebtAmount : (d?.totalAmount ?? 0),
          },
        },
      };
    }

    // Live fallback: compute directly from this shop's data
    try {
      const [liveSales, liveProds, liveCusts, liveD] = await Promise.all([
        getSales(shopId),
        apiRequest<Product[]>(API_ENDPOINTS.shops.products(shopId)).catch(() => shopProducts),
        getCustomers(shopId),
        getDebts(shopId),
      ]);
      return computeAnalytics(
        Array.isArray(liveSales) ? liveSales : shopSales,
        Array.isArray(liveProds) ? liveProds : shopProducts,
        Array.isArray(liveCusts) ? liveCusts : shopCustomers,
        Array.isArray(liveD) ? liveD : shopDebts,
      );
    } catch {
      return computeAnalytics(shopSales, shopProducts, shopCustomers, shopDebts);
    }
  } catch {
    return computeAnalytics(shopSales, shopProducts, shopCustomers, shopDebts);
  }
}

/* ------------------------------------------------------------------ */
/* User Profile API                                                    */
/* ------------------------------------------------------------------ */
export async function getUserProfile(): Promise<UserProfile> {
  const { DEMO_CREDENTIALS } = await import("@/config/env");

  if (isMockApiEnabled()) {
    return {
      id: "u-profile-1",
      email: DEMO_CREDENTIALS.owner.email,
      name: "Alex Owner",
      role: "OWNER",
      shopId: null,
      isActive: true,
      createdAt: "2026-08-12T08:50:41.994Z",
      ownedShops: [
        {
          id: "648408bb-c857-43eb-92fe-018cb8a1eb47",
          name: "SuperMart Boutique",
          businessType: "boutique",
          currency: "ETB",
          taxRate: "15.00",
          isActive: true,
        },
        {
          id: "759519cc-d968-54fc-03af-129dc9b2fc58",
          name: "Andalus Electronics",
          businessType: "electronics",
          currency: "ETB",
          taxRate: "15.00",
          isActive: true,
        },
      ],
      shop: null,
    };
  }

  try {
    return await apiRequest<UserProfile>(API_ENDPOINTS.auth.profile);
  } catch {
    return {
      id: "u-profile-1",
      email: DEMO_CREDENTIALS.owner.email,
      name: "Alex Owner",
      role: "OWNER",
      shopId: null,
      isActive: true,
      createdAt: "2026-08-12T08:50:41.994Z",
    };
  }
}

export async function updateUserProfile(input: UpdateProfileInput): Promise<UserProfile> {
  if (isMockApiEnabled()) {
    return {
      id: "u-profile-1",
      email: input.email || "owner@example.com",
      name: input.name || "Alex Owner Updated",
      role: "OWNER",
      shopId: null,
      isActive: true,
      createdAt: "2026-08-12T08:50:41.994Z",
      updatedAt: new Date().toISOString(),
    };
  }

  return apiRequest<UserProfile>(API_ENDPOINTS.auth.profile, {
    method: "PATCH",
    body: input,
  });
}

export async function getReportMetrics(_shopId: string) {
  const { seedReportMetrics } = await import("@/lib/mock/data");
  return seedReportMetrics;
}

export async function getOverallOrdersSummary(shopId: string): Promise<OverallOrdersSummary> {
  const orders = await getOrders(shopId);
  const totalCount = orders.length;
  const received = orders.filter((o) => o.status === "Confirmed");
  const returned = orders.filter((o) => o.status === "Returned");
  const onTheWay = orders.filter((o) => o.status === "Out for delivery" || o.status === "Delayed");
  const rev = received.reduce((sum, o) => sum + (typeof o.price === "number" ? o.price : parseFloat(String(o.price)) || 0), 0);
  const retCost = returned.reduce((sum, o) => sum + (typeof o.price === "number" ? o.price : parseFloat(String(o.price)) || 0), 0);

  return {
    totalOrders: { count: totalCount, subtext: "Total recorded" },
    totalReceived: { count: received.length, subtext: "Delivered & Confirmed", revenue: rev, revenueLabel: "Revenue" },
    totalReturned: { count: returned.length, subtext: "Returns", cost: retCost, costLabel: "Cost" },
    onTheWay: { orderedCount: onTheWay.length, orderedLabel: "Pending/In-Transit", cost: 0, costLabel: "Cost" },
  };
}



export async function getOrders(shopId: string): Promise<OrderRecord[]> {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    return store.orders.filter((o) => !o.shopId || o.shopId === shopId);
  }

  try {
    const sales = await getSales(shopId);
    if (Array.isArray(sales) && sales.length > 0) {
      return sales.map((s) => {
        const firstItem = s.items?.[0];
        const productName = firstItem?.product?.name || firstItem?.productId || "POS Sale Order";
        const totalQty = s.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 1;

        return {
          id: s.id,
          shopId: s.shopId || shopId,
          orderId: s.id.slice(0, 8),
          product: s.items && s.items.length > 1 ? `${productName} +${s.items.length - 1} items` : productName,
          price: parseFloat(s.totalAmount || "0"),
          quantity: `${totalQty} Packet`,
          expectedDelivery: new Date(s.createdAt).toLocaleDateString("en-GB"),
          status: s.status === "COMPLETED" ? "Confirmed" : s.status === "CANCELLED" ? "Returned" : "Out for delivery",
        };
      });
    }
    return store.orders.filter((o) => !o.shopId || o.shopId === shopId);
  } catch {
    return store.orders.filter((o) => !o.shopId || o.shopId === shopId);
  }
}

export async function createOrder(
  _shopId: string,
  input: {
    product: string;
    price: number | string;
    quantity: string;
    orderId?: string;
    expectedDelivery: string;
    status: "Delayed" | "Confirmed" | "Returned" | "Out for delivery";
  },
) {
  const newOrder: OrderRecord = {
    id: `ord-${Date.now()}`,
    product: input.product,
    price: input.price,
    quantity: input.quantity,
    orderId: input.orderId || `${Math.floor(1000 + Math.random() * 9000)}`,
    expectedDelivery: input.expectedDelivery,
    status: input.status,
  };

  const { seedOrders } = await import("@/lib/mock/data");
  seedOrders.unshift(newOrder);
  return newOrder;
}

export async function updateOrder(
  _shopId: string,
  orderId: string,
  input: Partial<Omit<OrderRecord, "id">>,
) {
  const { seedOrders } = await import("@/lib/mock/data");
  const ord = seedOrders.find((o) => o.id === orderId || o.orderId === orderId);
  if (ord) {
    Object.assign(ord, input);
    return ord;
  }
  return { id: orderId, ...input } as OrderRecord;
}

export async function deleteOrder(_shopId: string, orderId: string) {
  const { seedOrders } = await import("@/lib/mock/data");
  const idx = seedOrders.findIndex((o) => o.id === orderId || o.orderId === orderId);
  if (idx !== -1) {
    seedOrders.splice(idx, 1);
  }
  return { success: true, message: "Order deleted" };
}

/* ------------------------------------------------------------------ */
/* Team / Users Management API                                         */
/* ------------------------------------------------------------------ */
export async function getTeamSummary(shopId: string): Promise<TeamSummary> {
  const members = await getTeamMembers(shopId);
  return {
    totalTeamMembers: members.length,
    shopAdminCount: members.filter((m) => m.role.toLowerCase().includes("admin")).length,
    shopSalesCount: members.filter((m) => m.role.toLowerCase().includes("sale")).length,
  };
}

export async function getTeamMembers(shopId: string): Promise<TeamMember[]> {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    return store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
  }

  try {
    const live = await apiRequest<any[]>(API_ENDPOINTS.shops.staff(shopId));
    if (Array.isArray(live)) {
      return live.map((s) => ({
        id: s.id,
        shopId: s.shopId || shopId,
        name: s.name,
        email: s.email,
        role: s.role === "ADMIN" ? "Shop Admin" : "Shop Sale",
        status: s.isActive ? "Active" : "Suspended",
        joinedDate: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "Recent",
        lastLogin: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-GB") : "Recent",
        phone: s.phone || "+251911223344",
        permissions: s.role === "ADMIN" ? ["All Admin Permissions"] : ["Sales & POS", "View Products"],
      }));
    }
    return store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
  } catch {
    return store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
  }
}

export async function createTeamMember(
  shopId: string,
  input: {
    name: string;
    email?: string;
    role: string;
    password?: string;
    phone?: string;
    permissions?: string[];
  },
) {
  const roleNormalized = input.role.toLowerCase().includes("admin") ? "ADMIN" : "SALES";
  const newMember: TeamMember = {
    id: `tm-${Date.now()}`,
    shopId,
    name: input.name,
    email: input.email || `${input.name.toLowerCase().replace(/\s+/g, ".")}.andalus@gmail.com`,
    role: roleNormalized === "ADMIN" ? "Shop Admin" : "Shop Sale",
    phone: input.phone || "+251911223344",
    status: "Active",
    joinedDate: new Date().toLocaleDateString("en-GB"),
    lastLogin: new Date().toLocaleDateString("en-GB"),
    permissions: input.permissions || (roleNormalized === "ADMIN" ? ["All Admin Permissions"] : ["Sales & POS"]),
  };

  const { seedTeamMembers } = await import("@/lib/mock/data");
  seedTeamMembers.unshift(newMember);

  if (!isMockApiEnabled()) {
    try {
      const res = await apiRequest<any>(API_ENDPOINTS.shops.staff(shopId), {
        method: "POST",
        body: {
          name: input.name,
          email: newMember.email,
          password: input.password || "staffpassword123",
          role: roleNormalized,
        },
      });
      if (res && res.id) {
        newMember.id = res.id;
      }
    } catch {
      // Graceful fallback to optimistic local update
    }
  }

  return newMember;
}

export async function updateTeamMember(
  _shopId: string,
  memberId: string,
  input: Partial<Omit<TeamMember, "id">>,
) {
  const { seedTeamMembers } = await import("@/lib/mock/data");
  const member = seedTeamMembers.find((m) => m.id === memberId);
  if (member) {
    Object.assign(member, input);
    return member;
  }
  return { id: memberId, ...input } as TeamMember;
}

export async function deleteTeamMember(shopId: string, memberId: string) {
  const { seedTeamMembers } = await import("@/lib/mock/data");
  const idx = seedTeamMembers.findIndex((m) => m.id === memberId);
  if (idx !== -1) {
    seedTeamMembers.splice(idx, 1);
  }

  if (!isMockApiEnabled()) {
    try {
      await apiRequest(API_ENDPOINTS.shops.staffMember(shopId, memberId), {
        method: "DELETE",
      });
    } catch {
      // Graceful fallback
    }
  }

  return { success: true, message: "Team member deleted" };
}


export type {
  DashboardMetrics,
  ReportMetrics,
} from "@/lib/mock/data";




