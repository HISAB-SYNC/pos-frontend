/**
 * Native IndexedDB Wrapper for Offline POS Capabilities.
 * Provides resilient, zero-dependency client-side persistence for:
 * - Product catalog caching (for instant offline barcode scan & search)
 * - Offline sales outbox queue
 * - Offline quick-added products
 * - Metadata & sync timestamps
 */

const DB_NAME = "hisab_pos_offline_db";
const DB_VERSION = 1;

export const STORES = {
  PRODUCTS: "products",
  OFFLINE_SALES: "offline_sales",
  OFFLINE_PRODUCTS: "offline_products",
  META: "meta",
} as const;

let dbInstance: IDBDatabase | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

export function openDatabase(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB is only available in browser environments"));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Products Store: Cache of active products for fast offline search
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const prodStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: "id" });
        prodStore.createIndex("shopId", "shopId", { unique: false });
        prodStore.createIndex("sku", "sku", { unique: false });
        prodStore.createIndex("name", "name", { unique: false });
      }

      // 2. Offline Sales Store: Outbox of sales completed while disconnected
      if (!db.objectStoreNames.contains(STORES.OFFLINE_SALES)) {
        const salesStore = db.createObjectStore(STORES.OFFLINE_SALES, { keyPath: "clientSaleId" });
        salesStore.createIndex("shopId", "shopId", { unique: false });
        salesStore.createIndex("status", "status", { unique: false });
        salesStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // 3. Offline Products Store: Quick-added products created while disconnected
      if (!db.objectStoreNames.contains(STORES.OFFLINE_PRODUCTS)) {
        const offProdStore = db.createObjectStore(STORES.OFFLINE_PRODUCTS, { keyPath: "id" });
        offProdStore.createIndex("shopId", "shopId", { unique: false });
        offProdStore.createIndex("status", "status", { unique: false });
      }

      // 4. Meta Store: Key-value sync timestamps and flags
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error("[OfflineDB] Failed to open IndexedDB:", error);
      reject(error);
    };
  });
}

/**
 * Generic helper to run a transaction and return a promise.
 */
export async function withTransaction<T>(
  storeName: (typeof STORES)[keyof typeof STORES],
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let result: T;
    let callbackPromise: Promise<T> | null = null;

    try {
      const cbResult = callback(store);
      if (cbResult instanceof Promise) {
        callbackPromise = cbResult;
      } else {
        result = cbResult;
      }
    } catch (err) {
      tx.abort();
      return reject(err);
    }

    tx.oncomplete = async () => {
      if (callbackPromise) {
        try {
          const resolved = await callbackPromise;
          resolve(resolved);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(result);
      }
    };

    tx.onerror = () => {
      reject(tx.error);
    };

    tx.onabort = () => {
      reject(tx.error || new Error("Transaction aborted"));
    };
  });
}
