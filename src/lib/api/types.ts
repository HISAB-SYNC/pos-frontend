import type { Role } from "@/lib/permissions/roles";

export type ApiError = {
  message: string;
  status: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiFailureResponse = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  shopId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Shop = {
  id: string;
  name: string;
  address?: string;
  businessType?: string;
  taxRate?: string;
  currency?: string;
  language?: string;
  ownerId?: string;
  createdAt?: string;
};

export type Category = {
  id: string;
  shopId: string;
  name: string;
};

export type Supplier = {
  id: string;
  shopId: string;
  name: string;
  contactInfo?: string;
};

export type Product = {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  stockQuantity: number;
  unit: string;
  lowStockThreshold: number;
  categoryId?: string;
  supplierId?: string;
  attributes?: Record<string, unknown> | null;
  category?: Pick<Category, "id" | "name">;
  supplier?: Pick<Supplier, "id" | "name">;
};
