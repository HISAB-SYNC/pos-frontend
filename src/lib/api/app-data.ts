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
  AppNotification,
  BackendDashboardMetrics,
  Category,
  Customer,
  Debt,
  Expense,
  ExpensesSummary,
  NotificationFeedResponse,
  NotificationSeverity,
  NotificationType,
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
/* Client-side Persistence Helpers for Offline/Hybrid Synchronization  */
/* ------------------------------------------------------------------ */
const CREDIT_ITEMS_STORAGE_KEY = "pos_credit_debt_items";
const STAFF_OVERRIDES_STORAGE_KEY = "pos_staff_overrides";

export function saveCreditSaleItems(
  identifier: string,
  items: Array<{ productId?: string; name: string; quantity: number; unitPrice?: number; totalPrice?: number }>,
) {
  if (typeof window === "undefined" || !identifier || !items || items.length === 0) return;
  try {
    const raw = localStorage.getItem(CREDIT_ITEMS_STORAGE_KEY);
    const map: Record<string, typeof items> = raw ? JSON.parse(raw) : {};
    map[identifier] = items;
    localStorage.setItem(CREDIT_ITEMS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to persist credit sale items:", e);
  }
}

export function getCachedCreditSaleItems(
  identifier?: string,
): Array<{ productId?: string; name: string; quantity: number; unitPrice?: number; totalPrice?: number }> | null {
  if (typeof window === "undefined" || !identifier) return null;
  try {
    const raw = localStorage.getItem(CREDIT_ITEMS_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[identifier] || null;
  } catch {
    return null;
  }
}

export function saveStaffOverride(memberId: string, override: Partial<TeamMember>) {
  if (typeof window === "undefined" || !memberId) return;
  try {
    const raw = localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY);
    const map: Record<string, Partial<TeamMember>> = raw ? JSON.parse(raw) : {};
    map[memberId] = { ...(map[memberId] || {}), ...override };
    localStorage.setItem(STAFF_OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to persist staff override:", e);
  }
}

export function getStaffOverrides(): Record<string, Partial<TeamMember>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/* Debts API & Debt Management                                         */
/* ------------------------------------------------------------------ */
export function normalizeDebt(d: Debt): Debt {
  const store = getMockStore();
  const cust = store.customers.find((c) => c.id === d.customerId || c.name === (d.customer?.name || d.customerName));
  const totalAmount = parseFloat(String(d.amount || "0"));
  
  // Calculate total payments made against this debt
  let totalPaid = 0;
  if (Array.isArray(d.payments) && d.payments.length > 0) {
    totalPaid = d.payments.reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0);
  } else if (d.paidAmount !== undefined) {
    totalPaid = parseFloat(String(d.paidAmount || 0));
  }

  const remaining = Math.max(0, totalAmount - totalPaid);
  
  let computedStatus: Debt["status"] = "PENDING";
  if (remaining <= 0.001) {
    computedStatus = "PAID";
  } else if (totalPaid > 0) {
    computedStatus = "PARTIAL";
  } else if (d.dueDate && new Date(d.dueDate) < new Date()) {
    computedStatus = "OVERDUE";
  } else if (d.status) {
    computedStatus = d.status.toUpperCase() as Debt["status"];
  }

  const customerName = d.customer?.name || d.customerName || cust?.name || "Customer";
  const customerPhone = d.customer?.phone || d.customerPhone || cust?.phone || "—";

  // Extract item breakdown from:
  // 1. d.items
  // 2. d.sale?.items
  // 3. Cached credit sale items via d.saleId, d.id, or customer-keyed storage
  let items = d.items;
  if ((!items || items.length === 0) && d.sale?.items && Array.isArray(d.sale.items)) {
    items = d.sale.items.map((it) => ({
      productId: it.productId,
      name: it.product?.name || "Product",
      quantity: it.quantity,
      unitPrice: parseFloat(String(it.unitPrice || 0)),
      totalPrice: parseFloat(String(it.subtotal || (Number(it.unitPrice || 0) * it.quantity))),
    }));
  }
  if ((!items || items.length === 0) && d.saleId) {
    const cached = getCachedCreditSaleItems(d.saleId);
    if (cached && cached.length > 0) {
      items = cached;
    }
  }
  if ((!items || items.length === 0) && d.id) {
    const cached = getCachedCreditSaleItems(d.id);
    if (cached && cached.length > 0) {
      items = cached;
    }
  }
  if ((!items || items.length === 0) && d.customerId) {
    const cached = getCachedCreditSaleItems(d.customerId);
    if (cached && cached.length > 0) {
      items = cached;
    }
  }

  return {
    ...d,
    customerName,
    customerPhone,
    amount: totalAmount.toFixed(2),
    paidAmount: totalPaid.toFixed(2),
    remainingAmount: remaining.toFixed(2),
    status: computedStatus,
    items: items || [],
    payments: d.payments || [],
    transactions: d.transactions || cust?.debtHistory || [],
  };
}

export async function getDebts(shopId: string, params?: { status?: string; customerId?: string; search?: string }) {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    let list = store.debts.filter((d) => !d.shopId || d.shopId === shopId).map(normalizeDebt);
    if (params?.customerId) {
      list = list.filter((d) => d.customerId === params.customerId);
    }
    if (params?.status) {
      const s = params.status.toUpperCase();
      list = list.filter((d) => d.status.toUpperCase() === s);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.customerName?.toLowerCase().includes(q) ||
          d.customerPhone?.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q)),
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
      // If some debts have saleId but no items, attempt to resolve them from sales list
      const needsSaleHydration = liveData.some((d) => d.saleId && (!d.items || d.items.length === 0) && !d.sale?.items);
      let salesMap: Record<string, any> = {};
      if (needsSaleHydration) {
        try {
          const allSales = await getSales(shopId);
          if (Array.isArray(allSales)) {
            allSales.forEach((s) => {
              if (s.id) salesMap[s.id] = s;
            });
          }
        } catch {
          // ignore sales fetch error
        }
      }

      let mapped = liveData.map((d) => {
        if (d.saleId && salesMap[d.saleId] && (!d.items || d.items.length === 0) && !d.sale?.items) {
          const matchedSale = salesMap[d.saleId];
          d.sale = {
            id: matchedSale.id,
            totalAmount: matchedSale.totalAmount,
            createdAt: matchedSale.createdAt,
            items: matchedSale.items,
          };
        }
        return normalizeDebt(d);
      });

      // Keep store.debts synchronized with live debts
      mapped.forEach((normDebt) => {
        const idx = store.debts.findIndex((sd) => sd.id === normDebt.id);
        if (idx >= 0) {
          store.debts[idx] = normDebt;
        } else {
          store.debts.push(normDebt);
        }
      });

      if (params?.search) {
        const q = params.search.toLowerCase();
        mapped = mapped.filter(
          (d) =>
            d.customerName?.toLowerCase().includes(q) ||
            d.customerPhone?.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q) ||
            (d.notes && d.notes.toLowerCase().includes(q)),
        );
      }
      return mapped;
    }
    return store.debts.filter((d) => !d.shopId || d.shopId === shopId).map(normalizeDebt);
  } catch (err) {
    console.warn("Could not fetch live debts, using fallback:", err);
    return store.debts.filter((d) => !d.shopId || d.shopId === shopId).map(normalizeDebt);
  }
}

export async function getDebtSummary(shopId: string) {
  const debts = await getDebts(shopId);
  const totalOutstanding = debts
    .filter((d) => d.status !== "PAID")
    .reduce((sum, d) => sum + parseFloat(d.remainingAmount || d.amount || "0"), 0);

  const debtorIds = new Set(
    debts.filter((d) => d.status !== "PAID" && parseFloat(d.remainingAmount || d.amount || "0") > 0).map((d) => d.customerId),
  );
  const totalDebtors = debtorIds.size;

  const overdueCount = debts.filter(
    (d) => d.status === "OVERDUE" || (d.status !== "PAID" && d.dueDate && new Date(d.dueDate) < new Date()),
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
  input: {
    customerId: string;
    amount: number;
    dueDate?: string;
    notes?: string;
    items?: Array<{ productId?: string; name: string; quantity: number; unitPrice?: number; totalPrice?: number }>;
  },
) {
  const store = getMockStore();
  const { seedCustomers, seedDebts } = await import("@/lib/mock/data");

  const customer = store.customers.find((c) => c.id === input.customerId) || seedCustomers.find((c) => c.id === input.customerId);

  // Format item details into notes if items provided
  let formattedNotes = input.notes || "";
  if (input.items && input.items.length > 0) {
    const itemsSummary = input.items
      .map((it) => `${it.quantity}x ${it.name} (${it.totalPrice || (it.unitPrice || 0) * it.quantity} ETB)`)
      .join(", ");
    formattedNotes = formattedNotes
      ? `Items: ${itemsSummary} | Note: ${formattedNotes}`
      : `Items: ${itemsSummary}`;
  }

  const newDebt: Debt = {
    id: `debt-${Date.now()}`,
    shopId,
    customerId: input.customerId,
    customerName: customer?.name || "Customer",
    customerPhone: customer?.phone || "—",
    amount: input.amount.toFixed(2),
    paidAmount: "0.00",
    remainingAmount: input.amount.toFixed(2),
    status: "PENDING",
    dueDate: input.dueDate,
    notes: formattedNotes,
    items: input.items,
    payments: [],
    transactions: [],
    createdAt: new Date().toISOString(),
  };

  // Keep mock store in sync
  store.debts.unshift(newDebt);
  if (Array.isArray(seedDebts)) seedDebts.unshift(newDebt);

  if (customer) {
    const currentBalance = parseFloat(customer.debtBalance || "0");
    const updatedBalance = currentBalance + input.amount;
    customer.debtBalance = updatedBalance.toFixed(2);
    customer.totalCreditPurchases = (parseFloat(String(customer.totalCreditPurchases || currentBalance)) + input.amount).toFixed(2);
  }

  if (!isMockApiEnabled()) {
    try {
      const backendCreated = await apiRequest<Debt>(API_ENDPOINTS.shops.debts(shopId), {
        method: "POST",
        body: {
          customerId: input.customerId,
          amount: input.amount,
          dueDate: input.dueDate || undefined,
          notes: formattedNotes || undefined,
          items: input.items || undefined,
        },
      });
      if (backendCreated?.id) {
        newDebt.id = backendCreated.id;
      }
      return backendCreated || newDebt;
    } catch (err) {
      console.warn("Backend createDebt failed, using local copy:", err);
      return newDebt;
    }
  }

  return newDebt;
}

export async function recordDebtPayment(
  shopId: string,
  input: {
    customerId: string;
    debtId?: string;
    debtIds?: string[];
    debts?: Debt[];
    amount: number;
    paymentMethod?: "Cash" | "Card" | "Bank Transfer" | "Mobile Payment" | string;
    bankName?: string;
    notes?: string;
    reference?: string;
  },
) {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  const store = getMockStore();
  const { seedCustomers, seedDebts } = await import("@/lib/mock/data");

  const customer = store.customers.find((c) => c.id === input.customerId) || seedCustomers.find((c) => c.id === input.customerId);
  const currentDebt = customer ? parseFloat(customer.debtBalance || "0") : 0;
  const newCustomerBalance = Math.max(0, currentDebt - input.amount);

  const ref = input.reference || `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const transaction = {
    id: `dth-${Date.now()}`,
    customerId: input.customerId,
    customerName: customer?.name || "Customer",
    type: "Debt Payment" as const,
    reference: ref,
    amount: -Math.abs(input.amount),
    remainingBalance: newCustomerBalance,
    date: dateStr,
    paymentMethod: input.paymentMethod || "Cash",
    notes: input.notes || `Debt repayment - ${ref}`,
  };

  if (customer) {
    customer.debtBalance = newCustomerBalance.toFixed(2);
    customer.totalPaid = (parseFloat(String(customer.totalPaid || "0")) + input.amount).toFixed(2);
    customer.lastTransactionDate = dateStr;
    if (!customer.debtHistory) customer.debtHistory = [];
    customer.debtHistory.unshift(transaction);
  }

  // 1. Gather all candidate debts from input.debts, store.debts, and seedDebts
  const candidatePool: Debt[] = [];
  const seenIds = new Set<string>();

  const addCandidate = (d: Debt | null | undefined) => {
    if (d && d.id && !seenIds.has(d.id)) {
      seenIds.add(d.id);
      candidatePool.push(normalizeDebt(d));
    }
  };

  if (Array.isArray(input.debts)) {
    input.debts.forEach(addCandidate);
  }
  store.debts.filter((d) => d.customerId === input.customerId).forEach(addCandidate);
  if (Array.isArray(seedDebts)) {
    seedDebts.filter((d) => d.customerId === input.customerId).forEach(addCandidate);
  }

  // Determine target debt vouchers to settle
  let targetDebtIds: string[] = [];
  if (input.debtIds && input.debtIds.length > 0) {
    targetDebtIds = [...input.debtIds];
  } else if (input.debtId) {
    targetDebtIds = [input.debtId];
  } else {
    // If no debts explicitly targeted, gather all unpaid debts for this customer
    const openPool = candidatePool.filter((d) => {
      const rem = parseFloat(String(d.remainingAmount || d.amount || "0"));
      return d.status !== "PAID" && rem > 0;
    });
    targetDebtIds = openPool.map((d) => d.id);
  }

  // If live backend is active and some target debt IDs are missing from candidatePool, fetch them
  if (!isMockApiEnabled() && targetDebtIds.some((id) => !candidatePool.some((d) => d.id === id))) {
    try {
      const liveDebts = await apiRequest<Debt[]>(`${API_ENDPOINTS.shops.debts(shopId)}?customerId=${input.customerId}`);
      if (Array.isArray(liveDebts)) {
        liveDebts.forEach(addCandidate);
      }
    } catch (err) {
      console.warn("Could not fetch customer debts for settlement allocation:", err);
    }
  }

  // Normalize payment method for backend
  const backendPaymentMethod =
    input.paymentMethod === "Bank Transfer" || input.paymentMethod === "Card" || input.paymentMethod === "CARD"
      ? "CARD"
      : input.paymentMethod === "Mobile Payment" || input.paymentMethod === "MOBILE"
      ? "MOBILE"
      : "CASH";

  // Compute FIFO payment allocation across all targeted debts
  let unallocated = input.amount;
  const allocations: Array<{ debtId: string; debtRecord?: Debt; payAmount: number }> = [];

  for (let i = 0; i < targetDebtIds.length; i++) {
    if (unallocated <= 0.0001) break;

    const dId = targetDebtIds[i];
    let debtRecord = candidatePool.find((d) => d.id === dId) || store.debts.find((d) => d.id === dId);
    if (!debtRecord && Array.isArray(seedDebts)) {
      debtRecord = seedDebts.find((d) => d.id === dId);
    }

    const totalDue = debtRecord ? parseFloat(String(debtRecord.amount || "0")) : 0;
    const prevPaid = debtRecord ? parseFloat(String(debtRecord.paidAmount || "0")) : 0;
    let remBefore = debtRecord
      ? parseFloat(String(debtRecord.remainingAmount || (totalDue > prevPaid ? totalDue - prevPaid : 0)))
      : 0;

    // If remaining wasn't determinable, allocate proportional or remaining unallocated
    if (remBefore <= 0.0001) {
      if (totalDue > 0 && totalDue > prevPaid) {
        remBefore = totalDue - prevPaid;
      } else {
        const remainingTargets = targetDebtIds.length - i;
        remBefore = unallocated / Math.max(1, remainingTargets);
      }
    }

    const payThis = Number(Math.min(unallocated, remBefore).toFixed(2));
    if (payThis > 0) {
      allocations.push({
        debtId: dId,
        debtRecord,
        payAmount: payThis,
      });
      unallocated = Number((unallocated - payThis).toFixed(2));
    }
  }

  // If there's still unallocated payment left (e.g. rounding or surplus), add it to the last allocation
  if (unallocated > 0.001 && allocations.length > 0) {
    allocations[allocations.length - 1].payAmount = Number(
      (allocations[allocations.length - 1].payAmount + unallocated).toFixed(2)
    );
    unallocated = 0;
  }

  // 1. If live backend is active, first try the atomic batch settlement endpoint
  if (!isMockApiEnabled()) {
    try {
      const batchRes = await apiRequest<{
        customer?: { debtBalance?: number | string };
        updatedDebts?: Debt[];
        amountPaid?: number;
      }>(API_ENDPOINTS.shops.debtBatchPayments(shopId), {
        method: "POST",
        body: {
          customerId: input.customerId,
          debtIds: targetDebtIds.length > 0 ? targetDebtIds : undefined,
          amount: input.amount,
          paymentMethod: backendPaymentMethod,
          bankName: input.bankName || undefined,
          reference: input.reference || undefined,
          notes: input.notes || undefined,
        },
      });

      if (batchRes) {
        // Sync into store.debts
        if (Array.isArray(batchRes.updatedDebts)) {
          batchRes.updatedDebts.forEach((ud) => {
            const normalized = normalizeDebt(ud);
            const idx = store.debts.findIndex((d) => d.id === normalized.id);
            if (idx >= 0) store.debts[idx] = normalized;
            else store.debts.unshift(normalized);
          });
        }

        const liveBal = batchRes.customer?.debtBalance !== undefined
          ? parseFloat(String(batchRes.customer.debtBalance))
          : newCustomerBalance;

        return {
          success: true,
          debt: batchRes.updatedDebts?.[0] || null,
          debts: batchRes.updatedDebts || [],
          newBalance: liveBal,
          transaction,
        };
      }
    } catch (batchErr) {
      console.warn("Backend batch-payments endpoint unavailable or failed, falling back to individual endpoints:", batchErr);
    }
  }

  // 2. Individual endpoint settlement & mock store sync (fallback or mock mode)
  const updatedDebts: Debt[] = [];

  for (const item of allocations) {
    const { debtId, payAmount } = item;
    let debtRecord = item.debtRecord || store.debts.find((d) => d.id === debtId);

    // Call individual payment endpoint if live backend active
    if (!isMockApiEnabled()) {
      try {
        const liveUpdated = await apiRequest<Debt>(API_ENDPOINTS.shops.debtPayments(shopId, debtId), {
          method: "POST",
          body: {
            amount: payAmount,
            paymentMethod: backendPaymentMethod,
            bankName: input.bankName || undefined,
            reference: input.reference ? `${input.reference}-${debtId.slice(-4)}` : undefined,
            notes: input.notes || undefined,
          },
        });
        if (liveUpdated) {
          const normLive = normalizeDebt(liveUpdated);
          updatedDebts.push(normLive);
          const idx = store.debts.findIndex((d) => d.id === debtId);
          if (idx >= 0) store.debts[idx] = normLive;
          else store.debts.unshift(normLive);
          continue;
        }
      } catch (err) {
        console.warn(`Backend recordDebtPayment failed for debt ${debtId}:`, err);
      }
    }

    // Local / mock store update
    if (debtRecord) {
      const prevPaid = parseFloat(String(debtRecord.paidAmount || "0"));
      const totalDue = parseFloat(String(debtRecord.amount || "0"));
      const newPaid = prevPaid + payAmount;
      const newRemaining = Math.max(0, totalDue - newPaid);

      debtRecord.paidAmount = newPaid.toFixed(2);
      debtRecord.remainingAmount = newRemaining.toFixed(2);
      debtRecord.status = newRemaining <= 0.001 ? "PAID" : "PARTIAL";

      const paymentRecord = {
        id: `pay-${Date.now()}-${debtId}`,
        debtId,
        customerId: input.customerId,
        amount: payAmount.toFixed(2),
        paymentMethod: input.paymentMethod || "Cash",
        reference: ref,
        notes: input.notes || "Debt payment recorded",
        paidAt: nowIso,
      };

      if (!debtRecord.payments) debtRecord.payments = [];
      debtRecord.payments.unshift(paymentRecord);

      if (!debtRecord.transactions) debtRecord.transactions = [];
      debtRecord.transactions.unshift({
        ...transaction,
        amount: -Math.abs(payAmount),
        remainingBalance: newRemaining,
      });

      // Sync into store.debts
      const idx = store.debts.findIndex((d) => d.id === debtId);
      if (idx >= 0) store.debts[idx] = debtRecord;
      else store.debts.unshift(debtRecord);

      updatedDebts.push(debtRecord);
    }
  }

  return {
    success: true,
    debt: updatedDebts[0] || null,
    debts: updatedDebts,
    newBalance: newCustomerBalance,
    transaction,
  };
}

export async function recordBatchDebtPayments(
  shopId: string,
  payments: Array<{
    customerId: string;
    debtId?: string;
    debtIds?: string[];
    debts?: Debt[];
    amount: number;
    paymentMethod?: "Cash" | "Card" | "Bank Transfer" | "Mobile Payment" | string;
    bankName?: string;
    notes?: string;
    reference?: string;
  }>,
) {
  const results = [];
  for (const p of payments) {
    results.push(await recordDebtPayment(shopId, p));
  }
  return results;
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
    bankName?: string;
    paymentReference?: string;
    splitDetails?: {
      cashAmount?: number;
      debtAmount?: number;
      paymentMethod?: string;
    };
    notes?: string;
  },
) {
  const store = getMockStore();
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

      // Format items breakdown
      const debtItems = input.items.map((it) => ({
        productId: it.productId,
        name: it.name || "Product",
        quantity: it.quantity,
        unitPrice: it.unitPrice || 0,
        totalPrice: (it.unitPrice || 0) * it.quantity,
      }));

      const itemsSummary = debtItems
        .map((it) => `${it.quantity}x ${it.name} (${it.totalPrice.toFixed(2)} ETB)`)
        .join(", ");

      const debtNotes = input.notes
        ? `Sale ${saleRef} (${itemsSummary}) - ${input.notes}`
        : `Sale ${saleRef} (${itemsSummary})`;

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
        notes: debtNotes,
        items: debtItems,
      };

      if (!customerObj.debtHistory) customerObj.debtHistory = [];
      customerObj.debtHistory.unshift(debtTx);

      // Sync with seedDebts and mock store debts list
      let debtRecord = store.debts.find((d) => d.customerId === customerObj!.id && d.status !== "PAID") ||
        seedDebts.find((d) => d.customerId === customerObj!.id && d.status !== "PAID");

      if (debtRecord) {
        debtRecord.amount = String(newTotalDebt);
        debtRecord.remainingAmount = String(newTotalDebt);
        debtRecord.notes = debtNotes;
        debtRecord.items = [...(debtRecord.items || []), ...debtItems];
        if (!debtRecord.transactions) debtRecord.transactions = [];
        debtRecord.transactions.unshift(debtTx);
      } else {
        const newDebtRecord: Debt = {
          id: `debt-${Date.now()}`,
          shopId,
          customerId: customerObj.id,
          customerName: customerObj.name,
          customerPhone: customerObj.phone,
          amount: String(newTotalDebt),
          paidAmount: String(customerObj.totalPaid || "0"),
          remainingAmount: String(newTotalDebt),
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          status: "PENDING",
          notes: debtNotes,
          items: debtItems,
          payments: [],
          transactions: [debtTx],
          createdAt: new Date().toISOString(),
        };
        store.debts.unshift(newDebtRecord);
        if (Array.isArray(seedDebts)) seedDebts.unshift(newDebtRecord);
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
    bankName: input.bankName,
    paymentReference: input.paymentReference,
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
        bankName: input.bankName || undefined,
        paymentReference: input.paymentReference || undefined,
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

export async function processSaleReturn(
  shopId: string,
  saleId: string,
  input: {
    items: Array<{ productId: string; quantity: number; refundAmount?: number; reason?: string }>;
    refundMethod?: string;
    notes?: string;
  },
) {
  if (!isMockApiEnabled()) {
    return await apiRequest<{ success: boolean; data: any }>(
      API_ENDPOINTS.shops.saleReturns(shopId, saleId),
      {
        method: "POST",
        body: input,
      },
    );
  }

  const { seedSales, seedProducts } = await import("@/lib/mock/data");
  const store = getMockStore();
  const targetStoreSale = store.sales.find((s) => s.id === saleId);
  const targetSale = seedSales.find((s) => s.id === saleId);

  const totalRefund = input.items.reduce((sum, it) => sum + (it.refundAmount || 0), 0);
  const currentItems = targetStoreSale?.items || targetSale?.items || [];
  const isFullReturn =
    currentItems.length > 0 &&
    currentItems.every((origIt) => {
      const ret = input.items.find((it) => it.productId === origIt.productId);
      return ret && ret.quantity >= origIt.quantity;
    });

  const resolvedStatus = isFullReturn ? "RETURNED" : "PARTIAL_RETURN";

  const updateSaleRecord = (s: Sale) => {
    s.status = resolvedStatus;
    if (!isFullReturn) {
      s.totalAmount = Math.max(0, parseFloat(s.totalAmount || "0") - totalRefund).toFixed(2);
      if (s.items) {
        s.items = s.items.map((it) => {
          const ret = input.items.find((r) => r.productId === it.productId);
          return ret ? { ...it, quantity: Math.max(0, it.quantity - ret.quantity) } : it;
        });
      }
    }
  };

  if (targetStoreSale) updateSaleRecord(targetStoreSale);
  if (targetSale) updateSaleRecord(targetSale);

  for (const it of input.items) {
    const prod = seedProducts.find((p) => p.id === it.productId);
    if (prod) {
      prod.stockQuantity += it.quantity;
    }
    const storeProd = store.products.find((p) => p.id === it.productId);
    if (storeProd) {
      storeProd.stockQuantity += it.quantity;
    }
  }

  return {
    success: true,
    message: "Sale return processed successfully",
    data: { sale: targetStoreSale || targetSale },
  };
}

export async function voidSale(shopId: string, saleId: string) {
  if (!isMockApiEnabled()) {
    return await apiRequest<{ success: boolean; message: string }>(
      API_ENDPOINTS.shops.saleDetail(shopId, saleId),
      { method: "DELETE" },
    );
  }

  const { seedSales, seedProducts, seedCustomers, seedDebts } = await import("@/lib/mock/data");
  const store = getMockStore();

  const sale = seedSales.find((s) => s.id === saleId);
  const storeSale = store.sales.find((s) => s.id === saleId);
  const target = storeSale || sale;

  if (storeSale) storeSale.status = "CANCELLED";
  if (sale) sale.status = "CANCELLED";

  if (target?.items) {
    target.items.forEach((it) => {
      const prod = seedProducts.find((p) => p.id === it.productId);
      if (prod) prod.stockQuantity += it.quantity;
      const storeProd = store.products.find((p) => p.id === it.productId);
      if (storeProd) storeProd.stockQuantity += it.quantity;
    });
  }

  if (target?.customerId) {
    const debtAmount =
      target.paymentMethod === "DEBT"
        ? parseFloat(target.totalAmount || "0")
        : (target.splitDetails?.debtAmount || 0);

    if (debtAmount > 0) {
      const customer = seedCustomers.find((c) => c.id === target.customerId);
      if (customer) {
        const curDebt = parseFloat(customer.debtBalance || "0");
        customer.debtBalance = String(Math.max(0, curDebt - debtAmount));
      }
      const storeCustomer = store.customers.find((c) => c.id === target.customerId);
      if (storeCustomer) {
        const curDebt = parseFloat(storeCustomer.debtBalance || "0");
        storeCustomer.debtBalance = String(Math.max(0, curDebt - debtAmount));
      }

      const debtRecord = seedDebts.find((d) => d.customerId === target.customerId);
      if (debtRecord) {
        debtRecord.amount = String(Math.max(0, parseFloat(debtRecord.amount || "0") - debtAmount));
      }
      const storeDebt = store.debts.find((d) => d.customerId === target.customerId);
      if (storeDebt) {
        storeDebt.amount = String(Math.max(0, parseFloat(storeDebt.amount || "0") - debtAmount));
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
    const shopSales = store.sales.filter((s) => {
      const st = (s.status || "COMPLETED").toUpperCase();
      return (!s.shopId || s.shopId === targetShopId) && st !== "CANCELLED" && st !== "VOIDED" && st !== "REFUNDED" && st !== "RETURNED";
    });
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

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendWeekly = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const factor = 0.6 + i * 0.08;
      const daySales = totalSalesRev > 0 ? Math.round((totalSalesRev / 14) * factor) : 0;
      return {
        month: `${dayNames[d.getDay()]} ${d.getDate()}`,
        sales: daySales,
        purchase: Math.round(daySales * 0.65),
      };
    });

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
      trendWeekly,
      topSellingStock,
      lowQuantityStock,
      recentSales,
    };
  };

  if (isMockApiEnabled()) {
    return computeMockDashboardMetrics(shopId);
  }

  try {
    const [backendMetrics, products, lowStock, liveSales, liveExpenses, liveDebts, liveAnalytics] = await Promise.allSettled([
      apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.products(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId)),
      apiRequest<Sale[]>(API_ENDPOINTS.shops.sales(shopId)),
      apiRequest<any>(API_ENDPOINTS.shops.expenses(shopId)),
      apiRequest<Debt[]>(API_ENDPOINTS.shops.debts(shopId)),
      apiRequest<any>(`${API_ENDPOINTS.shops.analytics(shopId)}?period=monthly`),
    ]);

    const isAllCoreRejected =
      backendMetrics.status === "rejected" &&
      products.status === "rejected" &&
      liveSales.status === "rejected";

    if (isAllCoreRejected) {
      return computeMockDashboardMetrics(shopId);
    }

    const bMetrics = backendMetrics.status === "fulfilled" ? backendMetrics.value : null;
    const analyticsData = liveAnalytics.status === "fulfilled" ? liveAnalytics.value : null;
    const prods = products.status === "fulfilled" && Array.isArray(products.value) ? products.value : [];
    const lowStockLive = lowStock.status === "fulfilled" && Array.isArray(lowStock.value) ? lowStock.value : [];
    const salesList = liveSales.status === "fulfilled" && Array.isArray(liveSales.value) ? liveSales.value : [];
    const validSales = salesList.filter((s) => {
      const st = (s.status || "COMPLETED").toUpperCase();
      return st !== "CANCELLED" && st !== "VOIDED" && st !== "REFUNDED" && st !== "RETURNED";
    });

    const rawExp = liveExpenses.status === "fulfilled" && Array.isArray(liveExpenses.value)
      ? liveExpenses.value
      : (liveExpenses.status === "fulfilled" && Array.isArray(liveExpenses.value?.expenses) ? liveExpenses.value.expenses : []);
    const totalLiveExpenses = rawExp.reduce(
      (sum: number, e: any) => sum + (typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount || "0").replace(/,/g, "")) || 0),
      0,
    );

    const debtsList = liveDebts.status === "fulfilled" && Array.isArray(liveDebts.value) ? liveDebts.value : [];
    const openDebts = debtsList.filter((d) => d.status !== "PAID" && (parseFloat(String(d.amount || "0")) || 0) > 0);
    const debtsSum = openDebts.reduce((sum, d) => sum + (parseFloat(String(d.amount || "0")) || 0), 0);
    const totalLiveDebt = bMetrics?.outstandingDebts?.totalAmount !== undefined
      ? bMetrics.outstandingDebts.totalAmount
      : (analyticsData?.debts?.totalOutstandingDebtAmount ?? debtsSum);
    const debtorsCount = bMetrics?.outstandingDebts?.count !== undefined
      ? bMetrics.outstandingDebts.count
      : (analyticsData?.debts?.outstandingDebtsCount ?? openDebts.length);

    // 1. All-time historical sales revenue
    const totalHistoricalSalesRev = validSales.reduce(
      (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
      0,
    );

    // 2. Today's sales (from backend ticker or calculated by today's date)
    const todayDateStr = new Date().toDateString();
    const todaySales = validSales.filter((s) => new Date(s.createdAt).toDateString() === todayDateStr);
    const calculatedTodayRev = todaySales.reduce(
      (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
      0,
    );
    const calculatedTodayCount = todaySales.length;

    const todayRevenue = bMetrics?.todaysSales?.totalAmount !== undefined
      ? bMetrics.todaysSales.totalAmount
      : calculatedTodayRev;

    const todaySalesCount = bMetrics?.todaysSales?.count !== undefined
      ? bMetrics.todaysSales.count
      : calculatedTodayCount;

    // 3. Total Revenue is all-time historical sales
    const totalRevenue = totalHistoricalSalesRev > 0
      ? totalHistoricalSalesRev
      : (analyticsData?.sales?.totalRevenue ?? todayRevenue);

    const totalSalesCount = validSales.length > 0
      ? validSales.length
      : (analyticsData?.sales?.totalSalesCount ?? todaySalesCount);

    // 4. Payment breakdown (across historical sales or analytics)
    const breakdown = { cash: 0, bank: 0, telebirr: 0 };
    validSales.forEach((s) => {
      const method = (s.paymentMethod || "").toUpperCase();
      const paid = s.amountPaid !== undefined
        ? parseFloat(String(s.amountPaid))
        : (s.splitDetails?.cashAmount ?? (parseFloat(String(s.totalAmount || "0")) || 0));
      if (method === "BANK" || method === "BANK_TRANSFER" || method === "CARD") breakdown.bank += paid;
      else if (method === "TELEBIRR" || method === "MOBILE") breakdown.telebirr += paid;
      else breakdown.cash += paid;
    });

    if (validSales.length === 0 && analyticsData?.sales?.paymentMethodBreakdown) {
      const pmb = analyticsData.sales.paymentMethodBreakdown;
      breakdown.cash = pmb.CASH?.totalAmount ?? 0;
      breakdown.bank = (pmb.CARD?.totalAmount ?? 0) + (pmb.BANK?.totalAmount ?? 0);
      breakdown.telebirr = (pmb.MOBILE?.totalAmount ?? 0) + (pmb.TELEBIRR?.totalAmount ?? 0);
    }

    // 5. Cost of goods sold & Profit
    let totalCogs = 0;
    validSales.forEach((s) => {
      if (s.items && Array.isArray(s.items) && s.items.length > 0) {
        s.items.forEach((it: any) => {
          const prod = prods.find((p) => p.id === it.productId);
          const attrs = (prod?.attributes ?? {}) as Record<string, any>;
          const costPrice = parseFloat(attrs.buyingPrice || attrs.costPrice || "0") || ((parseFloat(String(prod?.price || "0")) || 0) * 0.65);
          totalCogs += costPrice * (it.quantity || 1);
        });
      } else {
        totalCogs += (parseFloat(String(s.totalAmount || "0")) || 0) * 0.65;
      }
    });

    totalCogs = Math.round(totalCogs);
    const grossProfit = Math.max(0, Math.round(totalRevenue - totalCogs));
    const netProfit = Math.max(0, Math.round(grossProfit - totalLiveExpenses));

    // 6. Recent sales list
    const recent = validSales.slice(0, 4).map((s) => {
      const method = (s.paymentMethod || "CASH").toUpperCase();
      const methodLabel = method === "BANK" || method === "BANK_TRANSFER" || method === "CARD" ? "Bank" : method === "TELEBIRR" || method === "MOBILE" ? "Telebirr" : "Cash";

      return {
        id: s.id.slice(0, 8),
        customerName: s.customer?.name || "Walk-in Customer",
        totalAmount: parseFloat(String(s.totalAmount || "0")),
        paymentMethod: methodLabel,
        date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: s.status,
      };
    });

    // 7. Top selling stock (calculated from sales items or analytics)
    const productSoldMap: Record<string, number> = {};
    validSales.forEach((s) => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((it: any) => {
          const pid = it.productId || it.product?.id;
          if (pid) {
            productSoldMap[pid] = (productSoldMap[pid] || 0) + (it.quantity || 1);
          }
        });
      }
    });

    let liveTopSelling = prods
      .map((p) => ({
        name: p.name,
        soldQuantity: productSoldMap[p.id] ?? (validSales.length > 0 ? 1 : 0),
        remainingQuantity: p.stockQuantity,
        price: `${parseFloat(String(p.price || "0")).toLocaleString()} Birr`,
      }))
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 4);

    if (
      liveTopSelling.length === 0 &&
      analyticsData?.products?.topSellingProducts &&
      Array.isArray(analyticsData.products.topSellingProducts)
    ) {
      liveTopSelling = analyticsData.products.topSellingProducts.map((p: any) => ({
        name: p.name,
        soldQuantity: p.totalQuantitySold ?? 0,
        remainingQuantity: 0,
        price: `${parseFloat(String(p.totalRevenue || "0")).toLocaleString()} Birr`,
      }));
    }

    const liveLowStock = lowStockLive.map((p) => ({
      id: p.id,
      name: p.name,
      remainingQuantity: p.stockQuantity,
      unit: p.unit || "pcs",
    }));

    // 8. Trends: Monthly & Weekly
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    type MonthBucket = {
      monthIndex: number;
      year: number;
      month: string;
      sales: number;
      purchase: number;
    };
    const last6Months: MonthBucket[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        month: monthNames[d.getMonth()],
        sales: 0,
        purchase: 0,
      });
    }

    validSales.forEach((s) => {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime())) {
        const m = last6Months.find((item) => item.monthIndex === d.getMonth() && item.year === d.getFullYear());
        if (m) {
          m.sales += parseFloat(String(s.totalAmount || "0")) || 0;
        }
      }
    });

    const salesAndPurchase = last6Months.map((m) => ({
      month: m.month,
      sales: Math.round(m.sales),
      purchase: Math.round(m.sales * 0.65),
    }));

    // Weekly trend (last 7 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    type DayBucket = {
      dateKey: string;
      month: string;
      sales: number;
      purchase: number;
    };
    const last7Days: DayBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toDateString();
      last7Days.push({
        dateKey,
        month: `${dayNames[d.getDay()]} ${d.getDate()}`,
        sales: 0,
        purchase: 0,
      });
    }

    validSales.forEach((s) => {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime())) {
        const dayItem = last7Days.find((item) => item.dateKey === d.toDateString());
        if (dayItem) {
          dayItem.sales += parseFloat(String(s.totalAmount || "0")) || 0;
        }
      }
    });

    const trendWeekly = last7Days.map((d) => ({
      month: d.month,
      sales: Math.round(d.sales),
      purchase: Math.round(d.sales * 0.65),
    }));

    return {
      salesOverview: {
        sales: totalSalesCount,
        revenue: totalRevenue,
        profit: grossProfit,
        cost: totalCogs,
      },
      netProfit,
      grossProfit,
      totalExpenses: Math.round(totalLiveExpenses),
      cogs: totalCogs,
      outstandingDebt: Math.round(totalLiveDebt),
      debtorsCount,
      todaySalesCount,
      todayRevenue: Math.round(todayRevenue),
      paymentBreakdown: {
        cash: Math.round(breakdown.cash),
        bank: Math.round(breakdown.bank),
        telebirr: Math.round(breakdown.telebirr),
      },
      salesAndPurchase: salesAndPurchase.length > 0 ? salesAndPurchase : [
        { month: "Current", sales: totalRevenue, purchase: totalCogs },
      ],
      trendWeekly,
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
    const validSales = sSales.filter((s) => {
      const st = (s.status || "COMPLETED").toUpperCase();
      return st !== "CANCELLED" && st !== "VOIDED" && st !== "REFUNDED" && st !== "RETURNED";
    });
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
      const rawBuying =
        p.buyingPrice ??
        (p.attributes as any)?.buyingPrice ??
        (p.attributes as any)?.costPrice;
      const bPrice =
        rawBuying !== undefined && rawBuying !== null && !isNaN(Number(rawBuying))
          ? Number(rawBuying)
          : parseFloat(p.price || "0") * 0.7;
      const sPrice = parseFloat(p.price || "0");
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        totalQuantitySold: qtySold,
        totalRevenue: qtySold * sPrice,
        buyingPrice: bPrice,
        sellingPrice: sPrice,
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

  const shopSales = store.sales.filter((s) => {
    const st = (s.status || "COMPLETED").toUpperCase();
    return (!s.shopId || s.shopId === shopId) && st !== "CANCELLED" && st !== "VOIDED" && st !== "REFUNDED" && st !== "RETURNED";
  });
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

      const rawTop = Array.isArray(p?.topSellingProducts) ? p.topSellingProducts : [];
      const enrichedTop = rawTop.map((tp: any) => {
        const matched = shopProducts.find(
          (sp) => sp.id === tp.productId || sp.sku === tp.sku || sp.name?.toLowerCase() === tp.name?.toLowerCase(),
        );
        const rawBuying =
          tp.buyingPrice ??
          tp.costPrice ??
          matched?.buyingPrice ??
          (matched?.attributes as any)?.buyingPrice ??
          (matched?.attributes as any)?.costPrice;
        const bPrice =
          rawBuying !== undefined && rawBuying !== null && !isNaN(Number(rawBuying))
            ? Number(rawBuying)
            : undefined;
        const rawSelling =
          tp.sellingPrice ??
          tp.price ??
          (matched?.price ? parseFloat(matched.price) : undefined) ??
          (tp.totalQuantitySold ? tp.totalRevenue / tp.totalQuantitySold : undefined);
        const sPrice =
          rawSelling !== undefined && rawSelling !== null && !isNaN(Number(rawSelling))
            ? Number(rawSelling)
            : undefined;
        return {
          ...tp,
          buyingPrice: bPrice,
          sellingPrice: sPrice,
        };
      });

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
          topSellingProducts: enrichedTop,
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
    const existing = await getUserProfile();
    return {
      ...existing,
      email: input.email || existing.email,
      name: input.name || existing.name,
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
  const overrides = getStaffOverrides();

  let members: TeamMember[] = [];

  if (isMockApiEnabled()) {
    members = store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
  } else {
    try {
      const live = await apiRequest<any[]>(API_ENDPOINTS.shops.staff(shopId));
      if (Array.isArray(live)) {
        members = live.map((s) => ({
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
      } else {
        members = store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
      }
    } catch {
      members = store.teamMembers.filter((m) => !m.shopId || m.shopId === shopId);
    }
  }

  // Merge any local overrides (so role and profile updates persist cleanly)
  return members.map((m) => {
    if (overrides[m.id]) {
      const ov = overrides[m.id];
      return {
        ...m,
        ...ov,
        role: ov.role || m.role,
      };
    }
    return m;
  });
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

  const store = getMockStore();
  store.teamMembers.unshift(newMember);

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
  shopId: string,
  memberId: string,
  input: Partial<Omit<TeamMember, "id">>,
) {
  const store = getMockStore();
  const { seedTeamMembers } = await import("@/lib/mock/data");

  // Format role string for display & storage
  const roleFormatted =
    input.role === "ADMIN" || input.role === "Shop Admin"
      ? "Shop Admin"
      : input.role === "SALES" || input.role === "Shop Sale"
      ? "Shop Sale"
      : input.role;

  const updatePayload = {
    ...input,
    ...(roleFormatted ? { role: roleFormatted } : {}),
  };

  // 1. Update in mock store
  const storeMember = store.teamMembers.find((m) => m.id === memberId);
  if (storeMember) {
    Object.assign(storeMember, updatePayload);
  }

  // 2. Update in seed data
  const seedMember = seedTeamMembers.find((m) => m.id === memberId);
  if (seedMember) {
    Object.assign(seedMember, updatePayload);
  }

  // 3. Save persistent override in client storage
  saveStaffOverride(memberId, updatePayload);

  // 4. Try live backend
  if (!isMockApiEnabled()) {
    try {
      const response = await apiRequest<{ success: boolean; data: any } | any>(
        API_ENDPOINTS.shops.staffMember(shopId, memberId),
        {
          method: "PUT",
          body: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            role: input.role?.includes("Admin") || input.role === "ADMIN" ? "ADMIN" : "SALES",
            isActive: input.status !== undefined ? input.status === "Active" : undefined,
          },
        }
      );
      if (response && (response.data || response.id)) {
        const data = response.data || response;
        const updated: TeamMember = {
          id: data.id || memberId,
          shopId: data.shopId || shopId,
          name: data.name || input.name || storeMember?.name || "",
          email: data.email || input.email || storeMember?.email || "",
          phone: data.phone || input.phone || storeMember?.phone || "",
          role: data.role === "ADMIN" ? "Shop Admin" : data.role === "SALES" ? "Shop Sale" : (roleFormatted || "Shop Sale"),
          status: data.isActive === false ? "Suspended" : (storeMember?.status || "Active"),
          joinedDate: storeMember?.joinedDate || new Date().toLocaleDateString("en-GB"),
          lastLogin: storeMember?.lastLogin || "Just now",
          permissions: storeMember?.permissions || [],
        };
        return updated;
      }
    } catch (err) {
      console.warn("Backend updateTeamMember failed, using optimistic state:", err);
    }
  }

  return (storeMember || seedMember || { id: memberId, ...updatePayload }) as TeamMember;
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


/* ------------------------------------------------------------------ */
/* Shop Notifications API                                             */
/* ------------------------------------------------------------------ */
export async function getShopNotifications(
  shopId: string,
  params?: {
    isRead?: boolean;
    type?: NotificationType;
    severity?: NotificationSeverity;
    page?: number;
    limit?: number;
  },
): Promise<NotificationFeedResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  if (isMockApiEnabled()) {
    const store = getMockStore();
    let notifs = (store.notifications || []).filter((n) => !n.shopId || n.shopId === shopId);

    if (notifs.length === 0) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 86400000);

      store.products.forEach((p) => {
        if (!p.shopId || p.shopId === shopId) {
          if (p.stockQuantity <= (p.lowStockThreshold || 5)) {
            notifs.push({
              id: `notif-stock-${p.id}`,
              shopId,
              type: "LOW_STOCK",
              severity: p.stockQuantity === 0 ? "CRITICAL" : "WARNING",
              title: `Low Stock Alert: ${p.name}`,
              message: `${p.name} (SKU: ${p.sku}) has ${p.stockQuantity} ${p.unit || "pcs"} remaining (threshold: ${p.lowStockThreshold || 5}).`,
              entityId: p.id,
              metadata: { stockQuantity: p.stockQuantity, threshold: p.lowStockThreshold, unit: p.unit },
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
          if (p.expiryDate) {
            const exp = new Date(p.expiryDate);
            if (!isNaN(exp.getTime())) {
              if (exp <= now) {
                notifs.push({
                  id: `notif-exp-${p.id}`,
                  shopId,
                  type: "PRODUCT_EXPIRED",
                  severity: "CRITICAL",
                  title: `Product Expired: ${p.name}`,
                  message: `${p.name} (SKU: ${p.sku}) expired on ${exp.toLocaleDateString()}.`,
                  entityId: p.id,
                  metadata: { expiryDate: p.expiryDate },
                  isRead: false,
                  createdAt: new Date().toISOString(),
                });
              } else if (exp <= in7Days) {
                const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
                notifs.push({
                  id: `notif-exp-soon-${p.id}`,
                  shopId,
                  type: "PRODUCT_EXPIRING_SOON",
                  severity: "WARNING",
                  title: `Expiring Soon: ${p.name}`,
                  message: `${p.name} (SKU: ${p.sku}) will expire in ${diffDays} day${diffDays === 1 ? "" : "s"} (${exp.toLocaleDateString()}).`,
                  entityId: p.id,
                  metadata: { expiryDate: p.expiryDate, daysRemaining: diffDays },
                  isRead: false,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      });
      store.notifications = notifs;
    }

    if (params?.isRead !== undefined) {
      notifs = notifs.filter((n) => n.isRead === params.isRead);
    }
    if (params?.type) {
      notifs = notifs.filter((n) => n.type === params.type);
    }
    if (params?.severity) {
      notifs = notifs.filter((n) => n.severity === params.severity);
    }

    const total = notifs.length;
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = notifs.slice((page - 1) * limit, page * limit);

    return {
      notifications: paginated,
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  const query = new URLSearchParams();
  if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params?.type) query.set("type", params.type);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const res = await apiRequest<any>(`${API_ENDPOINTS.shops.notifications(shopId)}${suffix}`);
    if (res && res.notifications) {
      return res as NotificationFeedResponse;
    }
    if (Array.isArray(res)) {
      return {
        notifications: res,
        total: res.length,
        page: 1,
        limit: 20,
        totalPages: 1,
        unreadCount: res.filter((r: any) => !r.isRead).length,
      };
    }
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  } catch (err) {
    console.warn("Could not fetch shop notifications live:", err);
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  }
}

export async function getShopUnreadNotificationCount(shopId: string): Promise<number> {
  if (isMockApiEnabled()) {
    const feed = await getShopNotifications(shopId);
    return feed.unreadCount;
  }

  try {
    const res = await apiRequest<{ count: number }>(API_ENDPOINTS.shops.notificationsUnreadCount(shopId));
    return typeof res?.count === "number" ? res.count : 0;
  } catch {
    const feed = await getShopNotifications(shopId);
    return feed.unreadCount;
  }
}

export async function markShopNotificationAsRead(shopId: string, id: string): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    const item = (store.notifications || []).find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
    }
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.shops.markNotificationRead(shopId, id), { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark shop notification as read:", err);
  }
}

export async function markAllShopNotificationsAsRead(shopId: string): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    (store.notifications || []).forEach((n) => {
      if (!n.shopId || n.shopId === shopId) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      }
    });
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.shops.markAllNotificationsRead(shopId), { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark all shop notifications as read:", err);
  }
}

/* ------------------------------------------------------------------ */
/* SuperAdmin Notifications API                                       */
/* ------------------------------------------------------------------ */
export async function getAdminNotifications(params?: {
  isRead?: boolean;
  page?: number;
  limit?: number;
}): Promise<NotificationFeedResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  if (isMockApiEnabled()) {
    const store = getMockStore();
    let notifs = (store.notifications || []).filter((n) => !n.shopId);
    if (notifs.length === 0) {
      notifs = [
        {
          id: "notif-adm-01",
          shopId: null,
          type: "PENDING_OWNER_APPROVAL",
          severity: "INFO",
          title: "Pending Owner Approval",
          message: "New shop owner registration awaiting approval.",
          entityId: "owner-pending-id",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];
      store.notifications = notifs;
    }
    if (params?.isRead !== undefined) {
      notifs = notifs.filter((n) => n.isRead === params.isRead);
    }
    const total = notifs.length;
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      notifications: notifs.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  const query = new URLSearchParams();
  if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const res = await apiRequest<any>(`${API_ENDPOINTS.admin.notifications}${suffix}`);
    if (res && res.notifications) {
      return res as NotificationFeedResponse;
    }
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  } catch (err) {
    console.warn("Could not fetch admin notifications:", err);
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  }
}

export async function getAdminUnreadNotificationCount(): Promise<number> {
  if (isMockApiEnabled()) {
    const feed = await getAdminNotifications();
    return feed.unreadCount;
  }

  try {
    const res = await apiRequest<{ count: number }>(API_ENDPOINTS.admin.notificationsUnreadCount);
    return typeof res?.count === "number" ? res.count : 0;
  } catch {
    const feed = await getAdminNotifications();
    return feed.unreadCount;
  }
}

export async function markAdminNotificationAsRead(id: string): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    const item = (store.notifications || []).find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
    }
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.admin.markNotificationRead(id), { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark admin notification as read:", err);
  }
}

export async function markAllAdminNotificationsAsRead(): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    (store.notifications || []).forEach((n) => {
      if (!n.shopId) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      }
    });
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.admin.markAllNotificationsRead, { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark all admin notifications as read:", err);
  }
}

export type {
  DashboardMetrics,
  ReportMetrics,
} from "@/lib/mock/data";




