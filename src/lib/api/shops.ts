import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { Category, Product, Shop, Supplier } from "./types";

export async function getOwnerShops() {
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
  return apiRequest<Shop>(API_ENDPOINTS.shops.update(shopId), {
    method: "PATCH",
    body: input,
  });
}

export async function getCategories(shopId: string) {
  return apiRequest<Category[]>(API_ENDPOINTS.shops.categories(shopId));
}

export async function createCategory(shopId: string, name: string) {
  return apiRequest<Category>(API_ENDPOINTS.shops.categories(shopId), {
    method: "POST",
    body: { name },
  });
}

export async function getSuppliers(shopId: string) {
  return apiRequest<Supplier[]>(API_ENDPOINTS.shops.suppliers(shopId));
}

export async function createSupplier(shopId: string, input: { name: string; contactInfo?: string }) {
  return apiRequest<Supplier>(API_ENDPOINTS.shops.suppliers(shopId), {
    method: "POST",
    body: input,
  });
}

export async function getProducts(
  shopId: string,
  params?: { search?: string; categoryId?: string },
) {
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
  return apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId));
}

export async function createProduct(
  shopId: string,
  input: Omit<Product, "id" | "shopId" | "price"> & { price: number },
) {
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
  return apiRequest<Product>(API_ENDPOINTS.shops.product(shopId, productId), {
    method: "PATCH",
    body: input,
  });
}

export async function deleteProduct(shopId: string, productId: string) {
  return apiRequest<{ message: string }>(API_ENDPOINTS.shops.product(shopId, productId), {
    method: "DELETE",
  });
}
