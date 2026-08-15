import type { Category, Product, Shop, Supplier } from "@/lib/api/types";

import { createMockId, getMockStore, mockDelay, mockError } from "./store";

export async function mockGetOwnerShops(): Promise<Shop[]> {
  await mockDelay();
  return getMockStore().shops;
}

export async function mockCreateShop(input: {
  name: string;
  businessType: string;
  address: string;
  taxRate: number;
  currency: string;
  language: string;
}): Promise<Shop> {
  await mockDelay();

  const store = getMockStore();
  const shop: Shop = {
    id: createMockId("shop"),
    name: input.name,
    address: input.address,
    businessType: input.businessType,
    taxRate: String(input.taxRate),
    currency: input.currency,
    language: input.language,
    ownerId: store.users.find((user) => user.role === "OWNER")?.id,
    createdAt: new Date().toISOString(),
  };

  store.shops.push(shop);
  return shop;
}

export async function mockUpdateShop(
  shopId: string,
  input: Partial<{
    name: string;
    businessType: string;
    address: string;
    taxRate: number;
    currency: string;
    language: string;
  }>,
): Promise<Shop> {
  await mockDelay();

  const store = getMockStore();
  const shop = store.shops.find((entry) => entry.id === shopId);

  if (!shop) {
    mockError("Shop not found", 404);
  }

  Object.assign(shop, {
    ...input,
    taxRate: input.taxRate !== undefined ? String(input.taxRate) : shop.taxRate,
  });

  return shop;
}

export async function mockGetCategories(shopId: string): Promise<Category[]> {
  await mockDelay();
  return getMockStore().categories.filter((category) => category.shopId === shopId);
}

export async function mockCreateCategory(shopId: string, name: string): Promise<Category> {
  await mockDelay();

  const store = getMockStore();

  if (store.categories.some((category) => category.shopId === shopId && category.name === name)) {
    mockError(`A category named '${name}' already exists in this shop`, 409);
  }

  const category: Category = { id: createMockId("cat"), shopId, name };
  store.categories.push(category);
  return category;
}

export async function mockGetSuppliers(shopId: string): Promise<Supplier[]> {
  await mockDelay();
  return getMockStore().suppliers.filter((supplier) => supplier.shopId === shopId);
}

export async function mockCreateSupplier(
  shopId: string,
  input: { name: string; contactInfo?: string },
): Promise<Supplier> {
  await mockDelay();

  const supplier: Supplier = {
    id: createMockId("sup"),
    shopId,
    name: input.name,
    contactInfo: input.contactInfo,
  };

  getMockStore().suppliers.push(supplier);
  return supplier;
}

export async function mockGetProducts(
  shopId: string,
  params?: { search?: string; categoryId?: string },
): Promise<Product[]> {
  await mockDelay();

  let products = getMockStore().products.filter((product) => product.shopId === shopId);

  if (params?.search) {
    const term = params.search.toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term),
    );
  }

  if (params?.categoryId) {
    products = products.filter((product) => product.categoryId === params.categoryId);
  }

  return products;
}

export async function mockGetLowStockProducts(shopId: string): Promise<Product[]> {
  await mockDelay();

  return getMockStore().products.filter(
    (product) => product.shopId === shopId && product.stockQuantity <= product.lowStockThreshold,
  );
}

export async function mockCreateProduct(
  shopId: string,
  input: Omit<Product, "id" | "shopId" | "price"> & { price: number },
): Promise<Product> {
  await mockDelay();

  const store = getMockStore();

  if (store.products.some((product) => product.shopId === shopId && product.sku === input.sku)) {
    mockError(`A product with SKU '${input.sku}' already exists in this shop`, 409);
  }

  const category = store.categories.find((entry) => entry.id === input.categoryId);
  const supplier = store.suppliers.find((entry) => entry.id === input.supplierId);

  const product: Product = {
    id: createMockId("prod"),
    shopId,
    ...input,
    price: input.price.toFixed(2),
    category: category ? { id: category.id, name: category.name } : undefined,
    supplier: supplier ? { id: supplier.id, name: supplier.name } : undefined,
  };

  store.products.push(product);
  return product;
}

export async function mockUpdateProduct(
  shopId: string,
  productId: string,
  input: Partial<Omit<Product, "id" | "shopId" | "price">> & { price?: number },
): Promise<Product> {
  await mockDelay();

  const store = getMockStore();
  const product = store.products.find((entry) => entry.id === productId && entry.shopId === shopId);

  if (!product) {
    mockError("Product not found", 404);
  }

  const { price, ...rest } = input;

  Object.assign(product, {
    ...rest,
    ...(price !== undefined ? { price: price.toFixed(2) } : {}),
  });

  return product;
}

export async function mockDeleteProduct(shopId: string, productId: string) {
  await mockDelay();

  const store = getMockStore();
  const index = store.products.findIndex(
    (product) => product.id === productId && product.shopId === shopId,
  );

  if (index === -1) {
    mockError("Product not found", 404);
  }

  store.products.splice(index, 1);
  return { message: "Product deleted successfully" };
}
