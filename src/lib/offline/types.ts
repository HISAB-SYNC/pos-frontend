import type { Product } from "@/lib/api/types";

export type OfflineSaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  name?: string;
};

export type OfflineSale = {
  clientSaleId: string;
  shopId: string;
  customerId?: string | null;
  customerName?: string | null;
  items: OfflineSaleItem[];
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: string;
  bankName?: string;
  paymentReference: string;
  createdAt: string;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  errorMessage?: string;
};

export type OfflineProduct = {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  price: string | number;
  buyingPrice?: string | number | null;
  stockQuantity: number;
  unit: string;
  lowStockThreshold?: number;
  categoryId?: string;
  createdAt: string;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  realProductId?: string;
};

export type OfflineSyncResult = {
  total: number;
  syncedCount: number;
  alreadySyncedCount: number;
  failedCount: number;
  results: Array<{
    clientSaleId: string | null;
    saleId?: string;
    status: "SYNCED" | "ALREADY_SYNCED" | "FAILED";
    totalAmount?: number;
    createdAt?: string;
    stockWarning?: boolean;
    error?: string;
  }>;
};

export type OfflineQueueStats = {
  pendingSales: number;
  pendingProducts: number;
  lastSyncedAt?: string | null;
};
