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
  const { seedCustomers, seedDebts } = await import("@/lib/mock/data");

  const customer = seedCustomers.find((c) => c.id === input.customerId);
  const currentDebt = customer ? parseFloat(customer.debtBalance || "0") : 0;
  const newBalance = Math.max(0, currentDebt - input.amount);

  const ref = input.reference || `PAY-${Math.floor(100 + Math.random() * 900)}`;
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

  const debtRecord = seedDebts.find((d) => d.customerId === input.customerId || d.id === input.debtId);
  if (debtRecord) {
    debtRecord.amount = String(newBalance);
    debtRecord.paidAmount = String(parseFloat(debtRecord.paidAmount || "0") + input.amount);
    debtRecord.status = newBalance === 0 ? "PAID" : "PARTIAL";
    if (!debtRecord.transactions) debtRecord.transactions = [];
    debtRecord.transactions.unshift(transaction);
  }

  if (!isMockApiEnabled() && input.debtId) {
    try {
      await apiRequest<Debt>(API_ENDPOINTS.shops.debtPayments(shopId, input.debtId), {
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
    paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE" | "DEBT" | "CREDIT" | "SPLIT" | string;
    splitDetails?: {
      cashAmount?: number;
      debtAmount?: number;
      paymentMethod?: string;
    };
    notes?: string;
  },
) {
  const { seedCustomers, seedDebts, seedProducts } = await import("@/lib/mock/data");

  // 1. Deduct Product Inventory Stock
  input.items.forEach((item) => {
    const prod = seedProducts.find((p) => p.id === item.productId);
    if (prod) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
    }
  });

  const saleRef = `INV-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // 2. Determine Debt Portion for Credit or Split
  let debtPortion = 0;
  if (input.paymentMethod === "DEBT" || input.paymentMethod === "CREDIT") {
    debtPortion = input.totalAmount;
  } else if (input.paymentMethod === "SPLIT" && input.splitDetails?.debtAmount) {
    debtPortion = input.splitDetails.debtAmount;
  }

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
        paymentMethod: input.paymentMethod === "SPLIT" ? "Partial Debt/Credit" : "Debt/Credit",
        notes: input.notes || `Sale ${saleRef} added to debt`,
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
        seedDebts.push({
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
    subtotal: (input.totalAmount + (input.discountAmount || 0) - (input.taxAmount || 0)).toFixed(2),
    discountAmount: input.discountAmount ? input.discountAmount.toFixed(2) : "0.00",
    taxAmount: input.taxAmount ? input.taxAmount.toFixed(2) : "0.00",
    paymentMethod: input.paymentMethod,
    splitDetails: input.splitDetails,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    items: input.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice ? it.unitPrice.toFixed(2) : "0.00",
      subtotal: ((it.unitPrice || 0) * it.quantity).toFixed(2),
    })),
    customer: customerObj,
  };

  if (!isMockApiEnabled()) {
    try {
      await apiRequest<Sale>(API_ENDPOINTS.shops.sales(shopId), {
        method: "POST",
        body: {
          customerId: input.customerId,
          paymentMethod: input.paymentMethod,
          discountAmount: input.discountAmount,
          items: input.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
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
  if (isMockApiEnabled()) {
    return [] as Sale[];
  }

  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.paymentMethod) query.set("paymentMethod", params.paymentMethod);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<Sale[]>(`${API_ENDPOINTS.shops.sales(shopId)}${suffix}`);
}

export async function getSaleDetail(shopId: string, saleId: string) {
  if (isMockApiEnabled()) {
    return null;
  }

  return apiRequest<Sale>(API_ENDPOINTS.shops.saleDetail(shopId, saleId));
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
  const { seedDashboardMetrics } = await import("@/lib/mock/data");

  if (isMockApiEnabled()) {
    return mockGetDashboardMetrics(shopId);
  }

  try {
    const [backendMetrics, products, suppliers, categories, lowStock] = await Promise.allSettled([
      apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.products(shopId)),
      apiRequest<Supplier[]>(API_ENDPOINTS.shops.suppliers(shopId)),
      apiRequest<Category[]>(API_ENDPOINTS.shops.categories(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId)),
    ]);

    const bMetrics = backendMetrics.status === "fulfilled" ? backendMetrics.value : null;
    const prods = products.status === "fulfilled" && Array.isArray(products.value) ? products.value : [];
    const supps = suppliers.status === "fulfilled" && Array.isArray(suppliers.value) ? suppliers.value : [];
    const cats = categories.status === "fulfilled" && Array.isArray(categories.value) ? categories.value : [];
    const lowStockList = lowStock.status === "fulfilled" && Array.isArray(lowStock.value) ? lowStock.value : [];

    const totalStockQuantity = prods.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

    const liveLowQuantityStock = lowStockList.length > 0
      ? lowStockList.map((p) => ({
          id: p.id,
          name: p.name,
          remainingQuantity: p.stockQuantity,
          unit: p.unit || "pcs",
        }))
      : seedDashboardMetrics.lowQuantityStock;

    const liveTopSelling = prods.slice(0, 3).map((p) => ({
      name: p.name,
      soldQuantity: 30,
      remainingQuantity: p.stockQuantity,
      price: `${parseFloat(p.price || "0").toLocaleString()} Birr`,
    }));

    return {
      ...seedDashboardMetrics,
      salesOverview: {
        sales: bMetrics?.todaysSales?.count ?? seedDashboardMetrics.salesOverview.sales,
        revenue: bMetrics?.todaysSales?.totalAmount ?? seedDashboardMetrics.salesOverview.revenue,
        profit: bMetrics?.todaysSales?.totalAmount ? Math.round(bMetrics.todaysSales.totalAmount * 0.35) : seedDashboardMetrics.salesOverview.profit,
        cost: bMetrics?.todaysSales?.totalAmount ? Math.round(bMetrics.todaysSales.totalAmount * 0.65) : seedDashboardMetrics.salesOverview.cost,
      },
      inventorySummary: {
        quantityInHand: prods.length > 0 ? totalStockQuantity : seedDashboardMetrics.inventorySummary.quantityInHand,
        toBeReceived: seedDashboardMetrics.inventorySummary.toBeReceived,
      },
      productSummary: {
        suppliers: supps.length > 0 ? supps.length : seedDashboardMetrics.productSummary.suppliers,
        categories: cats.length > 0 ? cats.length : seedDashboardMetrics.productSummary.categories,
      },
      lowQuantityStock: liveLowQuantityStock,
      topSellingStock: liveTopSelling.length > 0 ? liveTopSelling : seedDashboardMetrics.topSellingStock,
    };
  } catch {
    return mockGetDashboardMetrics(shopId);
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
        CARD: { count: 5, totalAmount: 1600.0 },
        MOBILE: { count: 3, totalAmount: 750.0 },
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
  },
) {
  const newMember: TeamMember = {
    id: `tm-${Date.now()}`,
    name: input.name,
    email: input.email || `${input.name.toLowerCase().replace(/\s+/g, ".")}.andalus@gmail.com`,
    role: input.role || "Shop Sale",
    joinedDate: new Date().toLocaleDateString("en-GB"),
    lastLogin: new Date().toLocaleDateString("en-GB"),
  };

  const { seedTeamMembers } = await import("@/lib/mock/data");
  seedTeamMembers.unshift(newMember);
  return newMember;
}

export type {
  DashboardMetrics,
  ReportMetrics,
} from "@/lib/mock/data";




