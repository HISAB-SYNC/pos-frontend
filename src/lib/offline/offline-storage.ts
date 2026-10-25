import type { Product, Sale } from "@/lib/api/types";
import { openDatabase, STORES, withTransaction } from "./db";
import type { OfflineProduct, OfflineQueueStats, OfflineSale } from "./types";

/**
 * High-level Offline Storage Service for the POS Client.
 */

// -------------------------------------------------------------
// 1. PRODUCT CATALOG CACHING
// -------------------------------------------------------------

export async function cacheProducts(shopId: string, products: Product[]): Promise<void> {
  if (typeof window === "undefined" || !products || products.length === 0) return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PRODUCTS, STORES.META], "readwrite");
    const prodStore = tx.objectStore(STORES.PRODUCTS);
    const metaStore = tx.objectStore(STORES.META);

    for (const p of products) {
      prodStore.put({
        ...p,
        shopId,
      });
    }

    metaStore.put({
      key: `lastCatalogSync_${shopId}`,
      timestamp: new Date().toISOString(),
      count: products.length,
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

export async function getCachedProducts(shopId: string, search?: string): Promise<Product[]> {
  if (typeof window === "undefined") return [];

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PRODUCTS, "readonly");
    const store = tx.objectStore(STORES.PRODUCTS);
    const shopIndex = store.index("shopId");
    const request = shopIndex.getAll(shopId);

    request.onsuccess = () => {
      let results: Product[] = request.result || [];
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        results = results.filter((p) => {
          const name = (p.name || "").toLowerCase();
          const sku = (p.sku || "").toLowerCase();
          const desc = (p.description || "").toLowerCase();
          return name.includes(query) || sku.includes(query) || desc.includes(query);
        });
      }
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function decrementLocalProductStock(
  shopId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  if (typeof window === "undefined") return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PRODUCTS, "readwrite");
    const store = tx.objectStore(STORES.PRODUCTS);

    for (const item of items) {
      const getReq = store.get(item.productId);
      getReq.onsuccess = () => {
        const product = getReq.result as Product | undefined;
        if (product) {
          product.stockQuantity = Math.max(0, Math.round(((product.stockQuantity || 0) - item.quantity) * 1000) / 1000);
          store.put(product);
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// 2. OFFLINE SALES OUTBOX QUEUE
// -------------------------------------------------------------

export async function queueOfflineSale(sale: OfflineSale): Promise<void> {
  if (typeof window === "undefined") return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OFFLINE_SALES, STORES.PRODUCTS], "readwrite");
    const salesStore = tx.objectStore(STORES.OFFLINE_SALES);
    const prodStore = tx.objectStore(STORES.PRODUCTS);

    // Save offline sale
    salesStore.put(sale);

    // Deduct stock in local cache immediately
    for (const item of sale.items) {
      const getReq = prodStore.get(item.productId);
      getReq.onsuccess = () => {
        const product = getReq.result as Product | undefined;
        if (product) {
          product.stockQuantity = Math.max(0, Math.round(((product.stockQuantity || 0) - item.quantity) * 1000) / 1000);
          prodStore.put(product);
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

export async function getPendingSales(shopId: string): Promise<OfflineSale[]> {
  if (typeof window === "undefined") return [];

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_SALES, "readonly");
    const store = tx.objectStore(STORES.OFFLINE_SALES);
    const shopIndex = store.index("shopId");
    const request = shopIndex.getAll(shopId);

    request.onsuccess = () => {
      const all: OfflineSale[] = request.result || [];
      const pending = all.filter((s) => s.status === "PENDING" || s.status === "FAILED");
      // Sort oldest to newest
      pending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(pending);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function markSalesSyncing(clientSaleIds: string[]): Promise<void> {
  if (typeof window === "undefined" || clientSaleIds.length === 0) return;

  await withTransaction(STORES.OFFLINE_SALES, "readwrite", (store) => {
    for (const id of clientSaleIds) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const sale = getReq.result as OfflineSale | undefined;
        if (sale) {
          sale.status = "SYNCING";
          store.put(sale);
        }
      };
    }
  });
}

export async function removeSyncedSales(clientSaleIds: string[]): Promise<void> {
  if (typeof window === "undefined" || clientSaleIds.length === 0) return;

  await withTransaction(STORES.OFFLINE_SALES, "readwrite", (store) => {
    for (const id of clientSaleIds) {
      store.delete(id);
    }
  });
}

export async function markSaleFailed(clientSaleId: string, error: string): Promise<void> {
  if (typeof window === "undefined") return;

  await withTransaction(STORES.OFFLINE_SALES, "readwrite", (store) => {
    const getReq = store.get(clientSaleId);
    getReq.onsuccess = () => {
      const sale = getReq.result as OfflineSale | undefined;
      if (sale) {
        sale.status = "FAILED";
        sale.errorMessage = error;
        store.put(sale);
      }
    };
  });
}

// -------------------------------------------------------------
// 3. OFFLINE PRODUCTS QUEUE
// -------------------------------------------------------------

export async function queueOfflineProduct(product: OfflineProduct): Promise<void> {
  if (typeof window === "undefined") return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OFFLINE_PRODUCTS, STORES.PRODUCTS], "readwrite");
    const offStore = tx.objectStore(STORES.OFFLINE_PRODUCTS);
    const prodStore = tx.objectStore(STORES.PRODUCTS);

    offStore.put(product);

    // Also put in active products cache so cashier can immediately ring it up in cart
    const activeProd: Product = {
      id: product.id,
      shopId: product.shopId,
      sku: product.sku,
      name: product.name,
      price: String(product.price),
      buyingPrice: product.buyingPrice,
      stockQuantity: product.stockQuantity,
      unit: product.unit || "pcs",
      lowStockThreshold: product.lowStockThreshold || 5,
      categoryId: product.categoryId,
    };
    prodStore.put(activeProd);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

export async function getPendingProducts(shopId: string): Promise<OfflineProduct[]> {
  if (typeof window === "undefined") return [];

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_PRODUCTS, "readonly");
    const store = tx.objectStore(STORES.OFFLINE_PRODUCTS);
    const shopIndex = store.index("shopId");
    const request = shopIndex.getAll(shopId);

    request.onsuccess = () => {
      const all: OfflineProduct[] = request.result || [];
      const pending = all.filter((p) => p.status === "PENDING" || p.status === "FAILED");
      resolve(pending);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function removeSyncedProduct(tempId: string, realProduct?: Product): Promise<void> {
  if (typeof window === "undefined") return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OFFLINE_PRODUCTS, STORES.PRODUCTS], "readwrite");
    const offStore = tx.objectStore(STORES.OFFLINE_PRODUCTS);
    const prodStore = tx.objectStore(STORES.PRODUCTS);

    offStore.delete(tempId);
    prodStore.delete(tempId);

    if (realProduct) {
      prodStore.put(realProduct);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// 4. STATS & RECOVERY
// -------------------------------------------------------------

export async function getOfflineQueueStats(shopId: string): Promise<OfflineQueueStats> {
  if (typeof window === "undefined") {
    return { pendingSales: 0, pendingProducts: 0, lastSyncedAt: null };
  }

  try {
    const [sales, prods] = await Promise.all([
      getPendingSales(shopId),
      getPendingProducts(shopId),
    ]);

    const db = await openDatabase();
    const lastSync = await new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORES.META, "readonly");
      const metaStore = tx.objectStore(STORES.META);
      const req = metaStore.get(`lastCatalogSync_${shopId}`);
      req.onsuccess = () => {
        resolve(req.result?.timestamp || null);
      };
      req.onerror = () => resolve(null);
    });

    return {
      pendingSales: sales.length,
      pendingProducts: prods.length,
      lastSyncedAt: lastSync,
    };
  } catch (err) {
    console.error("[OfflineDB] Error fetching queue stats:", err);
    return { pendingSales: 0, pendingProducts: 0, lastSyncedAt: null };
  }
}

// -------------------------------------------------------------
// 5. SALES HISTORY CACHING & OFFLINE ADAPTER
// -------------------------------------------------------------

export async function cacheSalesHistory(shopId: string, sales: Sale[]): Promise<void> {
  if (typeof window === "undefined" || !sales) return;

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, "readwrite");
      const metaStore = tx.objectStore(STORES.META);
      metaStore.put({
        key: `cached_sales_${shopId}`,
        sales: sales.slice(0, 100),
        cachedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to cache sales history:", err);
  }
}

export async function getCachedSalesHistory(shopId: string): Promise<Sale[]> {
  if (typeof window === "undefined") return [];

  try {
    const db = await openDatabase();
    return await new Promise<Sale[]>((resolve) => {
      const tx = db.transaction(STORES.META, "readonly");
      const metaStore = tx.objectStore(STORES.META);
      const req = metaStore.get(`cached_sales_${shopId}`);
      req.onsuccess = () => {
        resolve((req.result?.sales as Sale[]) || []);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export function offlineSaleToSale(off: OfflineSale): Sale {
  return {
    id: off.clientSaleId,
    shopId: off.shopId,
    customerId: off.customerId || null,
    totalAmount: Number(off.totalAmount).toFixed(2),
    amountPaid: Number(off.totalAmount).toFixed(2),
    debtAmount: "0.00",
    subtotal: Number(off.subtotal).toFixed(2),
    discountAmount: Number(off.discountAmount || 0).toFixed(2),
    paymentMethod: off.paymentMethod,
    bankName: off.bankName,
    paymentReference: off.paymentReference + " (Pending Sync)",
    status: "PENDING",
    createdAt: off.createdAt,
    items: off.items.map((it) => ({
      id: "item-" + it.productId,
      saleId: off.clientSaleId,
      productId: it.productId,
      name: it.name || "Product",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: (it.unitPrice * it.quantity).toFixed(2),
    })),
    customer: off.customerName
      ? {
          id: off.customerId || "",
          shopId: off.shopId,
          name: off.customerName,
          debtBalance: "0",
          status: "Active",
          createdAt: off.createdAt,
        }
      : undefined,
  };
}
