import { isMockApiEnabled } from "@/config/env";
import * as mockShops from "@/lib/mock/shops.mock";

import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { Category, Product, Shop, Supplier } from "./types";

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

export async function createSupplier(shopId: string, input: { name: string; contactInfo?: string }) {
  if (isMockApiEnabled()) {
    return mockShops.mockCreateSupplier(shopId, input);
  }

  return apiRequest<Supplier>(API_ENDPOINTS.shops.suppliers(shopId), {
    method: "POST",
    body: input,
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
  input: Partial<Omit<Product, "id" | "shopId"> & { price: number }>,
) {
  if (isMockApiEnabled()) {
    return mockShops.mockUpdateProduct(shopId, productId, input);
  }

  return apiRequest<Product>(API_ENDPOINTS.shops.product(shopId, productId), {
    method: "PATCH",
    body: input,
  });
}

export async function deleteProduct(shopId: string, productId: string) {
  if (isMockApiEnabled()) {
    return mockShops.mockDeleteProduct(shopId, productId);
  }

  return apiRequest<{ message: string }>(API_ENDPOINTS.shops.product(shopId, productId), {
    method: "DELETE",
  });
}
