import { isMockApiEnabled } from "@/config/env";
import {
  type DashboardMetrics,
  mockGetCustomers,
  mockGetDashboardMetrics,
} from "@/lib/mock";

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
  const { seedCustomers } = await import("@/lib/mock/data");

  if (isMockApiEnabled()) {
    return seedCustomers;
  }

  try {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const liveData = await apiRequest<Customer[]>(`${API_ENDPOINTS.shops.customers(shopId)}${suffix}`);

    if (Array.isArray(liveData) && liveData.length > 0) {
      const enrichedLive = liveData.map((c) => {
        const match = seedCustomers.find((s) => s.name.toLowerCase() === c.name.toLowerCase());
        return {
          ...match,
          ...c,
          creditLimit: c.creditLimit || match?.creditLimit || "5000",
          daysOverdue: c.daysOverdue || match?.daysOverdue || (parseFloat(c.debtBalance || "0") > 0 ? "5 days" : "-"),
          status: (c.status || match?.status || "Active") as "Active" | "Overdue" | "Inactive",
          date: c.date || match?.date || "15/07/2025",
          recentTransactions: c.recentTransactions || match?.recentTransactions || [],
          debtBalance: c.debtBalance !== undefined && c.debtBalance !== "0.00" ? c.debtBalance : (match?.debtBalance || "2500"),
        };
      });

      const liveNames = new Set(liveData.map((c) => c.name.toLowerCase()));
      const remainingSeed = seedCustomers.filter((s) => !liveNames.has(s.name.toLowerCase()));
      return [...enrichedLive, ...remainingSeed];
    }
    return seedCustomers;
  } catch {
    return seedCustomers;
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

export async function deleteCustomer(shopId: string, customerId: string) {
  const { seedCustomers } = await import("@/lib/mock/data");
  const idx = seedCustomers.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    seedCustomers.splice(idx, 1);
  }

  if (!isMockApiEnabled()) {
    try {
      await apiRequest(`${API_ENDPOINTS.shops.customers(shopId)}/${customerId}`, {
        method: "DELETE",
      });
    } catch {
      // Handled gracefully
    }
  }

  return { success: true, message: "Customer deleted" };
}


/* ------------------------------------------------------------------ */
/* Debts API & Debt Management                                         */
/* ------------------------------------------------------------------ */
export async function getDebts(shopId: string, params?: { status?: string; customerId?: string; search?: string }) {
  const { seedDebts, seedCustomers } = await import("@/lib/mock/data");

  if (isMockApiEnabled()) {
    let list = [...seedDebts];
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
    if (Array.isArray(liveData) && liveData.length > 0) {
      return liveData.map((d) => {
        const cust = seedCustomers.find((c) => c.id === d.customerId || c.name === d.customerName);
        return {
          ...d,
          customerPhone: d.customerPhone || cust?.phone || "+251912345678",
          paidAmount: d.paidAmount || (cust ? String(cust.totalPaid || 0) : "0"),
          transactions: d.transactions || cust?.debtHistory || [],
        };
      });
    }
    return seedDebts;
  } catch {
    return seedDebts;
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
    try {
      await apiRequest<Debt>(API_ENDPOINTS.shops.debtPayments(shopId, debtIdToUse), {
        method: "POST",
        body: { amount: input.amount },
      });
    } catch {
      // Graceful fallback to optimistic local update
    }
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

  if (Array.isArray(seedSales)) {
    seedSales.unshift(createdSale);
  }

  if (!isMockApiEnabled()) {
    try {
      await apiRequest<Sale>(API_ENDPOINTS.shops.sales(shopId), {
        method: "POST",
        body: {
          customerId: input.customerId,
          paymentMethod: input.paymentMethod,
          discountAmount: input.discountAmount || 0,
          isCredit: debtPortion > 0,
          items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      });
    } catch {
      // Graceful fallback to optimistic local store
    }
  }

  return createdSale;
}


export async function getSales(
  shopId: string,
  params?: { startDate?: string; endDate?: string; customerId?: string; paymentMethod?: string },
) {
  const { seedSales } = await import("@/lib/mock/data");

  if (isMockApiEnabled()) {
    let list = [...seedSales];
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
    if (Array.isArray(liveData) && liveData.length > 0) {
      return liveData;
    }
    return seedSales;
  } catch {
    return seedSales;
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
export async function getExpensesSummary(_shopId: string) {
  const { seedExpensesSummary } = await import("@/lib/mock/data");
  return seedExpensesSummary;
}

export async function getExpenses(_shopId: string) {
  const { seedExpenses } = await import("@/lib/mock/data");
  return seedExpenses;
}

export async function createExpense(
  _shopId: string,
  input: {
    date: string;
    description: string;
    category: string;
    amount: number | string;
    paymentMethod: string;
    status: string;
  },
) {
  const newExp: Expense = {
    id: `exp-${Date.now()}`,
    date: input.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    description: input.description,
    category: input.category,
    amount: typeof input.amount === "number" ? input.amount.toLocaleString() : input.amount,
    paymentMethod: input.paymentMethod,
    status: input.status,
  };

  const { seedExpenses } = await import("@/lib/mock/data");
  seedExpenses.unshift(newExp);
  return newExp;
}

export async function updateExpense(
  _shopId: string,
  expenseId: string,
  input: Partial<Omit<Expense, "id">>,
) {
  const { seedExpenses } = await import("@/lib/mock/data");
  const exp = seedExpenses.find((e) => e.id === expenseId);
  if (exp) {
    Object.assign(exp, input);
    return exp;
  }
  return { id: expenseId, ...input } as Expense;
}

export async function deleteExpense(_shopId: string, expenseId: string) {
  const { seedExpenses } = await import("@/lib/mock/data");
  const idx = seedExpenses.findIndex((e) => e.id === expenseId);
  if (idx !== -1) {
    seedExpenses.splice(idx, 1);
  }
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
  const {
    seedDashboardMetrics,
    seedProducts,
    seedSales,
    seedDebts,
    seedExpenses,
    seedCustomers,
  } = await import("@/lib/mock/data");

  // Filter completed non-cancelled sales
  const validSales = seedSales.filter((s) => s.status !== "CANCELLED");
  const totalSalesRev = validSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);

  // Compute Cost of Goods Sold (COGS)
  let totalCogs = 0;
  validSales.forEach((s) => {
    if (s.items) {
      s.items.forEach((it) => {
        const prod = seedProducts.find((p) => p.id === it.productId);
        const attrs = (prod?.attributes ?? {}) as Record<string, any>;
        const costPrice = parseFloat(attrs.buyingPrice || attrs.costPrice || "0") || (parseFloat(prod?.price || "0") * 0.7);
        totalCogs += costPrice * it.quantity;
      });
    } else {
      totalCogs += parseFloat(s.totalAmount || "0") * 0.7;
    }
  });

  // Total Paid Expenses
  const totalPaidExpenses = seedExpenses
    .filter((e) => e.status === "Paid")
    .reduce((sum, e) => sum + (parseFloat(String(e.amount || "0").replace(/,/g, "")) || 0), 0);

  const grossProfit = Math.max(0, totalSalesRev - totalCogs);
  const netProfit = Math.max(0, grossProfit - totalPaidExpenses);

  // Outstanding Customer Debt
  const totalOutstandingDebt = seedCustomers.reduce(
    (sum, c) => sum + (parseFloat(c.debtBalance || "0") || 0),
    0,
  ) || seedDebts.reduce((sum, d) => sum + (parseFloat(d.amount || "0") || 0), 0);
  const debtorsCount = seedCustomers.filter((c) => (parseFloat(c.debtBalance || "0") || 0) > 0).length;

  // Payment Breakdown (Cash, Bank, Telebirr)
  const breakdown = { cash: 0, bank: 0, telebirr: 0 };
  validSales.forEach((s) => {
    const method = (s.paymentMethod || "").toUpperCase();
    const paid = s.amountPaid !== undefined ? parseFloat(String(s.amountPaid)) : (s.splitDetails?.cashAmount ?? parseFloat(s.totalAmount || "0"));
    if (method === "CASH") breakdown.cash += paid;
    else if (method === "BANK" || method === "BANK_TRANSFER") breakdown.bank += paid;
    else if (method === "TELEBIRR" || method === "MOBILE") breakdown.telebirr += paid;
    else breakdown.cash += paid; // fallback
  });

  // Low stock products
  const lowStockList = seedProducts.filter((p) => p.stockQuantity <= (p.lowStockThreshold || 5));

  // Recent sales formatted
  const recent = validSales.slice(0, 4).map((s) => {
    const cust = seedCustomers.find((c) => c.id === s.customerId);
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

  const liveLowQuantityStock = lowStockList.length > 0
    ? lowStockList.map((p) => ({
        id: p.id,
        name: p.name,
        remainingQuantity: p.stockQuantity,
        unit: p.unit || "pcs",
      }))
    : seedDashboardMetrics.lowQuantityStock;

  const liveTopSelling = seedProducts.slice(0, 3).map((p) => ({
    name: p.name,
    soldQuantity: 30,
    remainingQuantity: p.stockQuantity,
    price: `${parseFloat(p.price || "0").toLocaleString()} Birr`,
  }));

  if (isMockApiEnabled()) {
    return {
      salesOverview: {
        sales: validSales.length || seedDashboardMetrics.salesOverview.sales,
        revenue: totalSalesRev || seedDashboardMetrics.salesOverview.revenue,
        profit: Math.round(grossProfit || seedDashboardMetrics.salesOverview.profit),
        cost: Math.round(totalCogs || seedDashboardMetrics.salesOverview.cost),
      },
      netProfit: Math.round(netProfit || 4190),
      grossProfit: Math.round(grossProfit || 5490),
      totalExpenses: Math.round(totalPaidExpenses || 1300),
      cogs: Math.round(totalCogs || 12810),
      outstandingDebt: Math.round(totalOutstandingDebt || 6700),
      debtorsCount: debtorsCount || 3,
      todaySalesCount: Math.min(validSales.length, 14),
      todayRevenue: Math.round(totalSalesRev > 0 ? totalSalesRev * 0.25 : 2450),
      paymentBreakdown: {
        cash: Math.round(breakdown.cash || 9500),
        bank: Math.round(breakdown.bank || 5200),
        telebirr: Math.round(breakdown.telebirr || 3600),
      },
      salesAndPurchase: seedDashboardMetrics.salesAndPurchase,
      topSellingStock: liveTopSelling.length > 0 ? liveTopSelling : seedDashboardMetrics.topSellingStock,
      lowQuantityStock: liveLowQuantityStock,
      recentSales: recent.length > 0 ? recent : seedDashboardMetrics.recentSales,
    };
  }

  try {
    const [backendMetrics, products, lowStock] = await Promise.allSettled([
      apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.products(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId)),
    ]);

    const bMetrics = backendMetrics.status === "fulfilled" ? backendMetrics.value : null;
    const prods = products.status === "fulfilled" && Array.isArray(products.value) ? products.value : [];
    const lowStockLive = lowStock.status === "fulfilled" && Array.isArray(lowStock.value) ? lowStock.value : [];

    const calculatedRev = bMetrics?.todaysSales?.totalAmount ?? (totalSalesRev || seedDashboardMetrics.salesOverview.revenue);

    return {
      salesOverview: {
        sales: bMetrics?.todaysSales?.count ?? validSales.length ?? seedDashboardMetrics.salesOverview.sales,
        revenue: calculatedRev,
        profit: Math.round(grossProfit || calculatedRev * 0.35),
        cost: Math.round(totalCogs || calculatedRev * 0.65),
      },
      netProfit: Math.round(netProfit || calculatedRev * 0.25),
      grossProfit: Math.round(grossProfit || calculatedRev * 0.35),
      totalExpenses: Math.round(totalPaidExpenses || 1300),
      cogs: Math.round(totalCogs || calculatedRev * 0.65),
      outstandingDebt: bMetrics?.outstandingDebts?.totalAmount ?? Math.round(totalOutstandingDebt || 6700),
      debtorsCount: bMetrics?.outstandingDebts?.count ?? debtorsCount ?? 3,
      todaySalesCount: bMetrics?.todaysSales?.count ?? 14,
      todayRevenue: bMetrics?.todaysSales?.totalAmount ?? 2450,
      paymentBreakdown: {
        cash: Math.round(breakdown.cash || 9500),
        bank: Math.round(breakdown.bank || 5200),
        telebirr: Math.round(breakdown.telebirr || 3600),
      },
      salesAndPurchase: seedDashboardMetrics.salesAndPurchase,
      topSellingStock: prods.length > 0 ? prods.slice(0, 3).map((p) => ({
        name: p.name,
        soldQuantity: 30,
        remainingQuantity: p.stockQuantity,
        price: `${parseFloat(p.price || "0").toLocaleString()} Birr`,
      })) : liveTopSelling,
      lowQuantityStock: lowStockLive.length > 0 ? lowStockLive.map((p) => ({
        id: p.id,
        name: p.name,
        remainingQuantity: p.stockQuantity,
        unit: p.unit || "pcs",
      })) : liveLowQuantityStock,
      recentSales: recent.length > 0 ? recent : seedDashboardMetrics.recentSales,
    };
  } catch {
    return {
      salesOverview: {
        sales: validSales.length || seedDashboardMetrics.salesOverview.sales,
        revenue: totalSalesRev || seedDashboardMetrics.salesOverview.revenue,
        profit: Math.round(grossProfit || 5490),
        cost: Math.round(totalCogs || 12810),
      },
      netProfit: Math.round(netProfit || 4190),
      grossProfit: Math.round(grossProfit || 5490),
      totalExpenses: Math.round(totalPaidExpenses || 1300),
      cogs: Math.round(totalCogs || 12810),
      outstandingDebt: Math.round(totalOutstandingDebt || 6700),
      debtorsCount: debtorsCount || 3,
      todaySalesCount: 14,
      todayRevenue: 2450,
      paymentBreakdown: {
        cash: Math.round(breakdown.cash || 9500),
        bank: Math.round(breakdown.bank || 5200),
        telebirr: Math.round(breakdown.telebirr || 3600),
      },
      salesAndPurchase: seedDashboardMetrics.salesAndPurchase,
      topSellingStock: liveTopSelling,
      lowQuantityStock: liveLowQuantityStock,
      recentSales: recent.length > 0 ? recent : seedDashboardMetrics.recentSales,
    };
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

  const { seedCustomers, seedDebts, seedProducts } = await import("@/lib/mock/data");

  const totalOutstanding = seedDebts.reduce((sum, d) => sum + parseFloat(d.amount || "0"), 0);
  const totalDebtsCount = seedDebts.filter((d) => parseFloat(d.amount || "0") > 0).length;

  const mockAnalyticsFallback: ShopAnalyticsReport = {
    period,
    dateRange: {
      startDate: params?.startDate || new Date(Date.now() - 7 * 86400000).toISOString(),
      endDate: params?.endDate || new Date().toISOString(),
    },
    salesAnalytics: {
      totalSalesCount: 18,
      totalRevenue: 4850.0,
      totalTaxCollected: 727.5,
      totalDiscountsGiven: 150.0,
      averageOrderValue: 269.44,
      paymentMethodBreakdown: {
        CASH: { count: 10, totalAmount: 2500.0 },
        BANK: { count: 5, totalAmount: 1600.0 },
        TELEBIRR: { count: 3, totalAmount: 750.0 },
      },

      salesTrend: [
        { date: "Mon", salesCount: 3, totalRevenue: 950.0 },
        { date: "Tue", salesCount: 5, totalRevenue: 1400.0 },
        { date: "Wed", salesCount: 4, totalRevenue: 1100.0 },
        { date: "Thu", salesCount: 6, totalRevenue: 1750.0 },
        { date: "Fri", salesCount: 8, totalRevenue: 2000.0 },
        { date: "Sat", salesCount: 10, totalRevenue: 2850.0 },
        { date: "Sun", salesCount: 7, totalRevenue: 1950.0 },
      ],
    },
    productAnalytics: {
      topSellingProducts: seedProducts.slice(0, 5).map((p, idx) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        totalQuantitySold: 45 - idx * 6,
        totalRevenue: (45 - idx * 6) * parseFloat(p.price || "50"),
      })),
      lowStockCount: seedProducts.filter((p) => p.stockQuantity <= (p.lowStockThreshold || 10)).length,
      totalProductsCount: seedProducts.length,
    },
    customerAnalytics: {
      totalCustomers: seedCustomers.length,
      newCustomersInPeriod: 6,
      topCustomers: seedCustomers.slice(0, 5).map((c, idx) => ({
        customerId: c.id,
        name: c.name,
        email: c.email || `${c.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
        phone: c.phone || "+251911223344",
        salesCount: 5 - idx,
        totalSpent: 2200 - idx * 300,
      })),
      outstandingDebt: {
        count: totalDebtsCount,
        totalAmount: totalOutstanding,
      },
    },
  };

  if (isMockApiEnabled()) {
    return mockAnalyticsFallback;
  }

  try {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const live = await apiRequest<ShopAnalyticsReport>(`${API_ENDPOINTS.shops.analytics(shopId)}${suffix}`);
    if (live && live.salesAnalytics) {
      return live;
    }
    return mockAnalyticsFallback;
  } catch {
    return mockAnalyticsFallback;
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

export async function getOverallOrdersSummary(_shopId: string) {
  const { seedOverallOrders } = await import("@/lib/mock/data");
  return seedOverallOrders;
}



export async function getOrders(_shopId: string) {
  const { seedOrders } = await import("@/lib/mock/data");
  return seedOrders;
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
export async function getTeamSummary(_shopId: string) {
  const { seedTeamSummary } = await import("@/lib/mock/data");
  return seedTeamSummary;
}

export async function getTeamMembers(_shopId: string) {
  const { seedTeamMembers } = await import("@/lib/mock/data");
  return seedTeamMembers;
}

export async function createTeamMember(
  _shopId: string,
  input: {
    name: string;
    email?: string;
    role: string;
    password?: string;
    phone?: string;
    permissions?: string[];
  },
) {
  const newMember: TeamMember = {
    id: `tm-${Date.now()}`,
    name: input.name,
    email: input.email || `${input.name.toLowerCase().replace(/\s+/g, ".")}.andalus@gmail.com`,
    role: input.role || "Shop Sale",
    phone: input.phone || "+251911223344",
    status: "Active",
    joinedDate: new Date().toLocaleDateString("en-GB"),
    lastLogin: new Date().toLocaleDateString("en-GB"),
    permissions: input.permissions || [],
  };

  const { seedTeamMembers } = await import("@/lib/mock/data");
  seedTeamMembers.unshift(newMember);
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

export async function deleteTeamMember(_shopId: string, memberId: string) {
  const { seedTeamMembers } = await import("@/lib/mock/data");
  const idx = seedTeamMembers.findIndex((m) => m.id === memberId);
  if (idx !== -1) {
    seedTeamMembers.splice(idx, 1);
  }
  return { success: true, message: "Team member deleted" };
}


export type {
  DashboardMetrics,
  ReportMetrics,
} from "@/lib/mock/data";




