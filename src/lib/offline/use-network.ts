"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOfflineQueueStats } from "./offline-storage";
import { runOfflineSync, type SyncEngineResult } from "./sync-engine";
import type { OfflineQueueStats } from "./types";

export function useOfflineStatus(
  shopId: string,
  options?: {
    onSyncComplete?: (result: SyncEngineResult) => void;
  }
) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queueStats, setQueueStats] = useState<OfflineQueueStats>({
    pendingSales: 0,
    pendingProducts: 0,
    lastSyncedAt: null,
  });

  const onSyncCompleteRef = useRef(options?.onSyncComplete);
  onSyncCompleteRef.current = options?.onSyncComplete;

  const refreshStats = useCallback(async () => {
    if (!shopId) return;
    try {
      const stats = await getOfflineQueueStats(shopId);
      setQueueStats(stats);
    } catch {
      // ignore
    }
  }, [shopId]);

  const triggerSync = useCallback(async (): Promise<SyncEngineResult | null> => {
    if (!shopId || isSyncing) return null;
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;

    setIsSyncing(true);
    try {
      const result = await runOfflineSync(shopId);
      await refreshStats();
      if (onSyncCompleteRef.current && (result.salesSynced > 0 || result.productsSynced > 0)) {
        onSyncCompleteRef.current(result);
      }
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [shopId, isSyncing, refreshStats]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      await refreshStats();
      // Auto-trigger sync when connectivity is restored
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshStats();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    refreshStats();

    // Periodic sync check when online and queue has items
    const interval = setInterval(() => {
      refreshStats();
      if (navigator.onLine && (queueStats.pendingSales > 0 || queueStats.pendingProducts > 0)) {
        triggerSync();
      }
    }, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [shopId, refreshStats, triggerSync, queueStats.pendingSales, queueStats.pendingProducts]);

  return {
    isOnline,
    isSyncing,
    pendingCount: queueStats.pendingSales + queueStats.pendingProducts,
    queueStats,
    refreshStats,
    triggerSync,
  };
}
