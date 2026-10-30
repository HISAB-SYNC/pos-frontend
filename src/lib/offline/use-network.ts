"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api/client";
import { getOfflineQueueStats } from "./offline-storage";
import { runOfflineSync, type SyncEngineResult } from "./sync-engine";
import type { OfflineQueueStats } from "./types";

/**
 * Checks if the backend server is reachable via a lightweight /health probe.
 */
async function probeBackendReachability(): Promise<boolean> {
  if (typeof window === "undefined") return true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export function useOfflineStatus(
  shopId: string,
  options?: {
    onSyncComplete?: (result: SyncEngineResult) => void;
  }
) {
  const [isForcedOffline, setIsForcedOffline] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("pos:force_offline") === "true";
    } catch {
      return false;
    }
  });

  const [isNetworkReachable, setIsNetworkReachable] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queueStats, setQueueStats] = useState<OfflineQueueStats>({
    pendingSales: 0,
    pendingProducts: 0,
    lastSyncedAt: null,
  });

  const isOnline = !isForcedOffline && isNetworkReachable;

  const onSyncCompleteRef = useRef(options?.onSyncComplete);
  useEffect(() => {
    onSyncCompleteRef.current = options?.onSyncComplete;
  }, [options?.onSyncComplete]);

  // Guards a sync in flight without making callbacks depend on state, so their
  // identities stay stable and the polling effect below doesn't re-run (and
  // re-probe /health) every time a sync starts or finishes.
  const isSyncingRef = useRef(false);

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
    if (!shopId || isSyncingRef.current) return null;
    if (isForcedOffline) return null;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await runOfflineSync(shopId);
      await refreshStats();
      if (onSyncCompleteRef.current && (result.salesSynced > 0 || result.productsSynced > 0)) {
        onSyncCompleteRef.current(result);
      }
      return result;
    } catch {
      return null;
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [shopId, isForcedOffline, refreshStats]);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (isForcedOffline) {
      return false;
    }

    const reachable = await probeBackendReachability();
    setIsNetworkReachable(reachable);

    if (reachable) {
      await refreshStats();
      triggerSync();
    }
    return reachable;
  }, [isForcedOffline, refreshStats, triggerSync]);

  const toggleForceOffline = useCallback(() => {
    setIsForcedOffline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pos:force_offline", String(next));
      } catch {
        // ignore
      }
      if (!next) {
        // Going back to online mode -> probe connection
        checkConnectivity();
      }
      return next;
    });
  }, [checkConnectivity]);

  // Latest values for the polling interval, read without re-running the effect.
  const pollStateRef = useRef({ isNetworkReachable, pendingCount: 0 });
  useEffect(() => {
    pollStateRef.current = {
      isNetworkReachable,
      pendingCount: queueStats.pendingSales + queueStats.pendingProducts,
    };
  }, [isNetworkReachable, queueStats.pendingSales, queueStats.pendingProducts]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fast initial check
    if (!navigator.onLine) {
      setIsNetworkReachable(false);
    } else {
      checkConnectivity();
    }

    const handleBrowserOnline = async () => {
      await checkConnectivity();
    };

    const handleBrowserOffline = () => {
      setIsNetworkReachable(false);
      refreshStats();
    };

    const handleApiNetworkFailure = () => {
      setIsNetworkReachable(false);
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);
    window.addEventListener("pos:network-offline", handleApiNetworkFailure);

    refreshStats();

    // Smart Polling:
    // - If unreachable, probe every 10s to see if back online
    // - If online and has queued items, flush sync every 15s
    const interval = setInterval(() => {
      refreshStats();
      if (!isForcedOffline) {
        const { isNetworkReachable: reachable, pendingCount } = pollStateRef.current;
        if (!reachable) {
          checkConnectivity();
        } else if (pendingCount > 0) {
          triggerSync();
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      window.removeEventListener("pos:network-offline", handleApiNetworkFailure);
      clearInterval(interval);
    };
  }, [isForcedOffline, checkConnectivity, refreshStats, triggerSync]);

  return {
    isOnline,
    isForcedOffline,
    isNetworkReachable,
    isSyncing,
    pendingCount: queueStats.pendingSales + queueStats.pendingProducts,
    queueStats,
    refreshStats,
    triggerSync,
    toggleForceOffline,
    checkConnectivity,
  };
}
