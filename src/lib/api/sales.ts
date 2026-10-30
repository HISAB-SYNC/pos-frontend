import type { OfflineSyncResult } from "@/lib/offline/types";
import { isMockApiEnabled } from "@/config/env";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { Debt, Product, Sale } from "./types";

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
      prod.stockQuantity = Math.max(0, Math.round((prod.stockQuantity - item.quantity) * 1000) / 1000);
      if (Array.isArray(seedProductHistory)) {
        seedProductHistory.unshift({
          id: `hist-${Date.now()}-${item.productId}`,
          productId: item.productId,
          transactionId: saleRef,
          type: "Sale",
          quantity: -item.quantity,
          store: "Main Warehouse",
          value: Math.round(((item.unitPrice || parseFloat(prod.price || "0")) * item.quantity) * 100) / 100,
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
        // Credit sales: what was paid at the till now; the backend books only the rest as debt.
        amountPaid: debtPortion > 0 ? Math.max(0, Math.min(paid, input.totalAmount)) : undefined,
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

  // Errors propagate (no demo data); Sales History falls back to its offline cache.
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.customerId) query.set("customerId", params.customerId);
  if (params?.paymentMethod) query.set("paymentMethod", params.paymentMethod);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  const liveData = await apiRequest<Sale[]>(`${API_ENDPOINTS.shops.sales(shopId)}${suffix}`);
  return Array.isArray(liveData) ? liveData : [];
}

export async function getSaleDetail(shopId: string, saleId: string) {
  const { seedSales } = await import("@/lib/mock/data");

  if (isMockApiEnabled()) {
    return seedSales.find((s) => s.id === saleId) || null;
  }

  return apiRequest<Sale>(API_ENDPOINTS.shops.saleDetail(shopId, saleId));
}

export async function syncOfflineSalesBatch(
  shopId: string,
  sales: Array<{
    clientSaleId: string;
    customerId?: string | null;
    paymentMethod: string;
    discountAmount?: number;
    paymentReference?: string;
    bankName?: string;
    createdAt?: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
  }>
): Promise<OfflineSyncResult> {
  if (isMockApiEnabled()) {
    return {
      total: sales.length,
      syncedCount: sales.length,
      alreadySyncedCount: 0,
      failedCount: 0,
      results: sales.map((s) => ({
        clientSaleId: s.clientSaleId,
        saleId: "sale-mock-" + Date.now(),
        status: "SYNCED" as const,
        totalAmount: 100,
      })),
    };
  }

  const payload = {
    sales: sales.map((s) => {
      const backendPaymentMethod =
        s.paymentMethod === "BANK" || s.paymentMethod === "CARD"
          ? "CARD"
          : s.paymentMethod === "TELEBIRR" || s.paymentMethod === "MOBILE"
          ? "MOBILE"
          : "CASH";

      return {
        clientSaleId: s.clientSaleId,
        customerId: s.customerId || undefined,
        paymentMethod: backendPaymentMethod,
        discountAmount: s.discountAmount || 0,
        bankName: s.bankName || undefined,
        paymentReference: s.paymentReference || undefined,
        createdAt: s.createdAt,
        items: s.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      };
    }),
  };

  return await apiRequest<OfflineSyncResult>(API_ENDPOINTS.shops.syncSales(shopId), {
    method: "POST",
    body: payload,
  });
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
      prod.stockQuantity = Math.round((prod.stockQuantity + it.quantity) * 1000) / 1000;
    }
    const storeProd = store.products.find((p) => p.id === it.productId);
    if (storeProd) {
      storeProd.stockQuantity = Math.round((storeProd.stockQuantity + it.quantity) * 1000) / 1000;
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
      if (prod) prod.stockQuantity = Math.round((prod.stockQuantity + it.quantity) * 1000) / 1000;
      const storeProd = store.products.find((p) => p.id === it.productId);
      if (storeProd) storeProd.stockQuantity = Math.round((storeProd.stockQuantity + it.quantity) * 1000) / 1000;
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
