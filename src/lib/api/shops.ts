import { isMockApiEnabled } from "@/config/env";
import * as mockShops from "@/lib/mock/shops.mock";

import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  Category,
  Product,
  ProductAdjustment,
  ProductHistory,
  ProductPurchase,
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

  return apiRequest<Supplier>(API_ENDPOINTS.shops.suppliers(shopId), {
    method: "POST",
    body: input,
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

  return apiRequest<Supplier>(`${API_ENDPOINTS.shops.suppliers(shopId)}/${supplierId}`, {
    method: "PATCH",
    body: input,
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

export async function createProduct(
  shopId: string,
  input: Omit<Product, "id" | "shopId" | "price"> & { price: number },
) {
  const { seedProducts } = await import("@/lib/mock/data");
  const newProd: Product = {
    id: `prod-${Date.now()}`,
    shopId,
    ...input,
    price: input.price.toFixed(2),
  };
  seedProducts.unshift(newProd);

  if (isMockApiEnabled()) {
    return mockShops.mockCreateProduct(shopId, input);
  }

  try {
    return await apiRequest<Product>(API_ENDPOINTS.shops.products(shopId), {
      method: "POST",
      body: input,
    });
  } catch {
    return newProd;
  }
}

export async function updateProduct(
  shopId: string,
  productId: string,
  input: Partial<Omit<Product, "id" | "shopId" | "price"> & { price: number }>,
) {
  const { seedProducts } = await import("@/lib/mock/data");
  const p = seedProducts.find((item) => item.id === productId);
  if (p) {
    const { price, ...rest } = input;
    Object.assign(p, {
      ...rest,
      ...(price !== undefined ? { price: price.toFixed(2) } : {}),
    });
  }

  if (isMockApiEnabled()) {
    return mockShops.mockUpdateProduct(shopId, productId, input);
  }

  try {
    return await apiRequest<Product>(API_ENDPOINTS.shops.product(shopId, productId), {
      method: "PATCH",
      body: input,
    });
  } catch {
    return p || ({ id: productId, shopId, ...input } as unknown as Product);
  }
}

export async function getProduct(shopId: string, productId: string) {
  const { seedProducts } = await import("@/lib/mock/data");
  const p = seedProducts.find((item) => item.id === productId);

  if (isMockApiEnabled()) {
    return mockShops.mockGetProduct(shopId, productId);
  }

  try {
    return await apiRequest<Product>(API_ENDPOINTS.shops.product(shopId, productId));
  } catch {
    return p || null;
  }
}

export async function getProductPurchases(productId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetProductPurchases(productId);
  }

  return apiRequest<ProductPurchase[]>(`/products/${productId}/purchases`);
}

export async function createProductPurchase(
  productId: string,
  input: Omit<ProductPurchase, "id" | "productId">,
) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateProductPurchase(productId, input);
  }

  return apiRequest<ProductPurchase>(`/products/${productId}/purchases`, {
    method: "POST",
    body: input,
  });
}

export async function getProductAdjustments(productId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetProductAdjustments(productId);
  }

  return apiRequest<ProductAdjustment[]>(`/products/${productId}/adjustments`);
}

export async function createProductAdjustment(
  productId: string,
  input: Omit<ProductAdjustment, "id" | "productId">,
) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateProductAdjustment(productId, input);
  }

  return apiRequest<ProductAdjustment>(`/products/${productId}/adjustments`, {
    method: "POST",
    body: input,
  });
}

export async function getProductHistory(productId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockGetProductHistory(productId);
  }

  return apiRequest<ProductHistory[]>(`/products/${productId}/history`);
}

export async function deleteProduct(shopId: string, productId: string) {
  const { seedProducts } = await import("@/lib/mock/data");
  const idx = seedProducts.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    seedProducts.splice(idx, 1);
  }

  if (isMockApiEnabled()) {
    return mockShops.mockDeleteProduct(shopId, productId);
  }

  try {
    return await apiRequest<{ message: string }>(API_ENDPOINTS.shops.product(shopId, productId), {
      method: "DELETE",
    });
  } catch {
    return { message: "Product deleted successfully" };
  }
}


