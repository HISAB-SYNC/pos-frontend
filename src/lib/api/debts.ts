import { isMockApiEnabled } from "@/config/env";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { Customer, Debt, Product } from "./types";

import { getCachedCreditSaleItems } from "./local-cache";
import { getSales } from "./sales";

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
    return [];
  } catch (err) {
    // No demo-data fallback: the page shows the error and a retry.
    console.warn("Could not fetch live debts:", err);
    throw err;
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
      // Don't pretend the debt was saved: the caller shows the error.
      const idx = store.debts.indexOf(newDebt);
      if (idx >= 0) store.debts.splice(idx, 1);
      throw err;
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
      // Don't retry one by one (a payment may already have gone through) and
      // don't mark it paid locally: the caller shows the error.
      console.warn("Backend batch-payments failed:", batchErr);
      throw batchErr;
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
