import { isMockApiEnabled } from "@/config/env";
import * as mockShops from "@/lib/mock/shops.mock";

import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  Category,
  MoneyAddedReason,
  Product,
  PurchaseFunding,
  StockAdjustmentList,
  StockAdjustmentReason,
  StockAdjustmentRecord,
  Shop,
  Supplier,
} from "./types";

export async function getOwnerShops() {
  if (isMockApiEnabled()) {
    return mockShops.mockGetOwnerShops();
  }

  return apiRequest<Shop[]>(API_ENDPOINTS.shops.list);
}

export async function createShop(input: {
  name: string;
  businessType: string;
  address: string;
  taxRate: number;
  currency: string;
  language: string;
}) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateShop(input);
  }

  return apiRequest<Shop>(API_ENDPOINTS.shops.create, {
    method: "POST",
    body: input,
  });
}

export async function updateShop(
  shopId: string,
  input: Partial<{
    name: string;
    businessType: string;
    address: string;
    taxRate: number;
    currency: string;
    language: string;
  }>,
) {
  if (isMockApiEnabled()) {
    return mockShops.mockUpdateShop(shopId, input);
  }

  return apiRequest<Shop>(API_ENDPOINTS.shops.update(shopId), {
    method: "PATCH",
    body: input,
  });
}

export async function getCategories(shopId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetCategories(shopId);
  }

  return apiRequest<Category[]>(API_ENDPOINTS.shops.categories(shopId));
}

export async function createCategory(shopId: string, name: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateCategory(shopId, name);
  }

  return apiRequest<Category>(API_ENDPOINTS.shops.categories(shopId), {
    method: "POST",
    body: { name },
  });
}

export async function updateCategory(shopId: string, categoryId: string, name: string) {
  if (isMockApiEnabled()) {
    const list = await mockShops.mockGetCategories(shopId);
    const cat = list.find((c) => c.id === categoryId);
    if (cat) cat.name = name;
    return cat || ({ id: categoryId, shopId, name } as Category);
  }

  return apiRequest<Category>(API_ENDPOINTS.shops.category(shopId, categoryId), {
    method: "PATCH",
    body: { name },
  });
}

export async function deleteCategory(shopId: string, categoryId: string) {
  if (isMockApiEnabled()) {
    return { success: true, message: "Category deleted" };
  }

  return apiRequest<{ message: string }>(API_ENDPOINTS.shops.category(shopId, categoryId), {
    method: "DELETE",
  });
}

export async function getSuppliers(shopId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetSuppliers(shopId);
  }

  return apiRequest<Supplier[]>(API_ENDPOINTS.shops.suppliers(shopId));
}

export async function createSupplier(
  shopId: string,
  input: {
    name: string;
    contactInfo?: string;
    product?: string;
    email?: string;
    type?: "Taking Return" | "Not Taking Return";
    onTheWay?: string | number;
  },
) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateSupplier(shopId, input);
  }

  const contactParts = [input.contactInfo, input.email].filter(Boolean);
  const combinedContact = contactParts.join(", ");

  return apiRequest<Supplier>(API_ENDPOINTS.shops.suppliers(shopId), {
    method: "POST",
    body: {
      name: input.name,
      contactInfo: combinedContact || input.contactInfo || "",
    },
  });
}

export async function updateSupplier(
  shopId: string,
  supplierId: string,
  input: Partial<{
    name: string;
    contactInfo: string;
    product: string;
    email: string;
    type: "Taking Return" | "Not Taking Return";
    onTheWay: string | number;
  }>,
) {
  if (isMockApiEnabled()) {
    const list = await mockShops.mockGetSuppliers(shopId);
    const item = list.find((s) => s.id === supplierId);
    if (item) Object.assign(item, input);
    return item || ({ id: supplierId, shopId, ...input } as Supplier);
  }

  const body: { name?: string; contactInfo?: string } = {};
  if (input.name) body.name = input.name;
  if (input.contactInfo !== undefined || input.email !== undefined) {
    const contactParts = [input.contactInfo, input.email].filter(Boolean);
    body.contactInfo = contactParts.join(", ");
  }

  return apiRequest<Supplier>(`${API_ENDPOINTS.shops.suppliers(shopId)}/${supplierId}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteSupplier(shopId: string, supplierId: string) {
  if (isMockApiEnabled()) {
    return { success: true, message: "Supplier deleted" };
  }

  return apiRequest<{ message: string }>(`${API_ENDPOINTS.shops.suppliers(shopId)}/${supplierId}`, {
    method: "DELETE",
  });
}

export async function getProducts(
  shopId: string,
  params?: { search?: string; categoryId?: string },
) {

  if (isMockApiEnabled()) {
    return mockShops.mockGetProducts(shopId, params);
  }

  const query = new URLSearchParams();

  if (params?.search) {
    query.set("search", params.search);
  }

  if (params?.categoryId) {
    query.set("categoryId", params.categoryId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<Product[]>(`${API_ENDPOINTS.shops.products(shopId)}${suffix}`);
}

export async function getLowStockProducts(shopId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetLowStockProducts(shopId);
  }

  return apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId));
}

export async function getExpiringProducts(
  shopId: string,
  params?: { days?: number; status?: "all" | "expired" | "expiring_soon" },
) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetExpiringProducts(shopId, params);
  }

  const query = new URLSearchParams();
  if (params?.days !== undefined) query.set("days", String(params.days));
  if (params?.status) query.set("status", params.status);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest<Product[]>(`${API_ENDPOINTS.shops.expiringProducts(shopId)}${suffix}`);
}

export async function createProduct(
  shopId: string,
  input: Omit<Product, "id" | "shopId" | "price"> & { price: number },
) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateProduct(shopId, input);
  }

  return apiRequest<Product>(API_ENDPOINTS.shops.products(shopId), {
    method: "POST",
    body: input,
  });
}

export async function updateProduct(
  shopId: string,
  productId: string,
  input: Partial<Omit<Product, "id" | "shopId" | "price"> & { price: number }>,
) {
  if (isMockApiEnabled()) {
    return mockShops.mockUpdateProduct(shopId, productId, input);
  }

  return apiRequest<Product>(API_ENDPOINTS.shops.product(shopId, productId), {
    method: "PATCH",
    body: input,
  });
}

export async function getProduct(shopId: string, productId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetProduct(shopId, productId);
  }

  return apiRequest<Product>(API_ENDPOINTS.shops.product(shopId, productId));
}

export async function deleteProduct(shopId: string, productId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockDeleteProduct(shopId, productId);
  }

  return apiRequest<{ message: string }>(API_ENDPOINTS.shops.product(shopId, productId), {
    method: "DELETE",
  });
}

/**
 * Records a restock in one backend transaction: adds the stock, updates the
 * buying price and saves how it was paid. Errors are thrown so the caller can
 * show them; a restock must never be dropped silently.
 */
export async function createPurchase(
  shopId: string,
  input: {
    productId: string;
    quantity: number;
    unitCost: number;
    fundingSource: PurchaseFunding;
    supplierId?: string;
    supplier?: string;
    reference?: string;
    notes?: string;
    moneyAdded?: { amount: number; reason: MoneyAddedReason; notes?: string };
  },
): Promise<{ purchase: { id: string; totalCost: string | number }; product: Product }> {
  if (isMockApiEnabled()) {
    const totalCost = Math.round(input.quantity * input.unitCost * 100) / 100;
    const purchase = await mockShops.mockCreateProductPurchase(input.productId, {
      purchaseId: `PUR-${Date.now().toString().slice(-6)}`,
      supplier: input.supplier || "Direct Wholesaler",
      quantity: input.quantity,
      unitCost: input.unitCost,
      totalCost,
      date: new Date().toISOString(),
      status: "completed",
    });
    const products = await mockShops.mockGetProducts(shopId);
    const current = products.find((p) => p.id === input.productId);
    const product = await mockShops.mockUpdateProduct(shopId, input.productId, {
      stockQuantity: Math.round(((current?.stockQuantity ?? 0) + input.quantity) * 1000) / 1000,
      buyingPrice: input.unitCost,
    });
    return { purchase: { id: purchase.id, totalCost }, product: product as Product };
  }

  return apiRequest(API_ENDPOINTS.shops.purchases(shopId), {
    method: "POST",
    body: input,
  });
}



/**
 * Changes a product's stock and records why (damage, expiry, count
 * correction...) in one backend transaction.
 */
export async function createStockAdjustment(
  shopId: string,
  input: {
    productId: string;
    type: "ADD" | "REMOVE" | "SET";
    quantity: number;
    reason: StockAdjustmentReason;
    notes?: string;
    location?: string;
  },
): Promise<{ adjustment: StockAdjustmentRecord; product: Product }> {
  if (isMockApiEnabled()) {
    const products = await mockShops.mockGetProducts(shopId);
    const current = products.find((p) => p.id === input.productId);
    const before = current?.stockQuantity ?? 0;
    const after =
      input.type === "ADD" ? before + input.quantity : input.type === "REMOVE" ? before - input.quantity : input.quantity;
    const product = await mockShops.mockUpdateProduct(shopId, input.productId, { stockQuantity: after });
    const unitCost = Number(current?.buyingPrice || 0);
    return {
      product,
      adjustment: {
        id: `adj-${Date.now()}`,
        productId: input.productId,
        productName: current?.name || "Product",
        type: input.type,
        quantityBefore: before,
        quantityAfter: after,
        change: after - before,
        reason: input.reason,
        notes: input.notes || null,
        location: input.location || null,
        unitCost,
        valueChange: (after - before) * unitCost,
        createdAt: new Date().toISOString(),
      },
    };
  }

  return apiRequest(API_ENDPOINTS.shops.stockAdjustments(shopId), {
    method: "POST",
    body: input,
  });
}

/** Stock changes, newest first, with the value of stock lost and added. */
export async function getStockAdjustments(
  shopId: string,
  params: { productId?: string; reason?: StockAdjustmentReason; limit?: number } = {},
): Promise<StockAdjustmentList> {
  if (isMockApiEnabled()) {
    return { count: 0, valueLost: 0, valueAdded: 0, items: [] };
  }
  const query = new URLSearchParams();
  if (params.productId) query.set("productId", params.productId);
  if (params.reason) query.set("reason", params.reason);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<StockAdjustmentList>(`${API_ENDPOINTS.shops.stockAdjustments(shopId)}${qs ? `?${qs}` : ""}`);
}
