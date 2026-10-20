import { syncOfflineSalesBatch } from "@/lib/api/app-data";
import { createProduct, getProducts } from "@/lib/api/shops";
import type { Product } from "@/lib/api/types";
import {
  cacheProducts,
  getPendingProducts,
  getPendingSales,
  markSalesSyncing,
  markSaleFailed,
  removeSyncedProduct,
  removeSyncedSales,
} from "./offline-storage";
import type { OfflineSyncResult } from "./types";

let isSyncing = false;

export type SyncEngineResult = {
  success: boolean;
  salesSynced: number;
  productsSynced: number;
  failedCount: number;
  message: string;
};

/**
 * Executes a full synchronization of offline-queued items to the central database.
 * 1. Synchronizes offline-created products first to obtain true database IDs.
 * 2. Synchronizes batch offline sales via the idempotency-protected backend endpoint.
 * 3. Removes synced records from local IndexedDB outbox.
 * 4. Refreshes the local product catalog cache with live server stock.
 */
export async function runOfflineSync(shopId: string): Promise<SyncEngineResult> {
  if (typeof window === "undefined" || !shopId) {
    return { success: false, salesSynced: 0, productsSynced: 0, failedCount: 0, message: "Sync skipped (server-side)" };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { success: false, salesSynced: 0, productsSynced: 0, failedCount: 0, message: "Terminal is offline" };
  }

  if (isSyncing) {
    return { success: false, salesSynced: 0, productsSynced: 0, failedCount: 0, message: "Sync already in progress" };
  }

  isSyncing = true;
  let totalSalesSynced = 0;
  let totalProductsSynced = 0;
  let failedCount = 0;

  try {
    // -------------------------------------------------------------
    // Step 1: Synchronize Offline Products (if any)
    // -------------------------------------------------------------
    const pendingProducts = await getPendingProducts(shopId);
    for (const offProd of pendingProducts) {
      try {
        const created = await createProduct(shopId, {
          sku: offProd.sku,
          name: offProd.name,
          price: Number(offProd.price),
          buyingPrice: offProd.buyingPrice !== undefined && offProd.buyingPrice !== null ? Number(offProd.buyingPrice) : 0,
          stockQuantity: offProd.stockQuantity,
          unit: offProd.unit || "pcs",
          lowStockThreshold: offProd.lowStockThreshold || 5,
          categoryId: offProd.categoryId,
        });

        await removeSyncedProduct(offProd.id, created);
        totalProductsSynced++;
      } catch (err: unknown) {
        console.warn("[SyncEngine] Failed to sync offline product:", offProd.name, err);
        failedCount++;
      }
    }

    // -------------------------------------------------------------
    // Step 2: Synchronize Batch Offline Sales
    // -------------------------------------------------------------
    const pendingSales = await getPendingSales(shopId);
    if (pendingSales.length > 0) {
      const saleIds = pendingSales.map((s) => s.clientSaleId);
      await markSalesSyncing(saleIds);

      const syncResult: OfflineSyncResult = await syncOfflineSalesBatch(
        shopId,
        pendingSales.map((s) => ({
          clientSaleId: s.clientSaleId,
          customerId: s.customerId,
          paymentMethod: s.paymentMethod,
          discountAmount: s.discountAmount,
          bankName: s.bankName,
          paymentReference: s.paymentReference,
          createdAt: s.createdAt,
          items: s.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        }))
      );

      const successfulIds: string[] = [];

      for (const res of syncResult.results) {
        if (res.status === "SYNCED" || res.status === "ALREADY_SYNCED") {
          if (res.clientSaleId) {
            successfulIds.push(res.clientSaleId);
          }
        } else if (res.status === "FAILED" && res.clientSaleId) {
          failedCount++;
          await markSaleFailed(res.clientSaleId, res.error || "Sync failed");
        }
      }

      if (successfulIds.length > 0) {
        await removeSyncedSales(successfulIds);
        totalSalesSynced += successfulIds.length;
      }
    }

    // -------------------------------------------------------------
    // Step 3: Refresh Local Product Catalog Cache
    // -------------------------------------------------------------
    if (totalSalesSynced > 0 || totalProductsSynced > 0) {
      try {
        const liveProducts = await getProducts(shopId);
        if (liveProducts && liveProducts.length > 0) {
          await cacheProducts(shopId, liveProducts);
        }
      } catch (catErr) {
        console.warn("[SyncEngine] Catalog refresh after sync failed:", catErr);
      }
    }

    return {
      success: true,
      salesSynced: totalSalesSynced,
      productsSynced: totalProductsSynced,
      failedCount,
      message: `Synced ${totalSalesSynced} sales and ${totalProductsSynced} products.`,
    };
  } catch (err: unknown) {
    console.error("[SyncEngine] Synchronization encountered an unexpected error:", err);
    return {
      success: false,
      salesSynced: totalSalesSynced,
      productsSynced: totalProductsSynced,
      failedCount: failedCount + 1,
      message: err instanceof Error ? err.message : "Sync encountered an unexpected error",
    };
  } finally {
    isSyncing = false;
  }
}
