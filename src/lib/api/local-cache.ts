import type { TeamMember } from "./types";

/* ------------------------------------------------------------------ */
/* Client-side Persistence Helpers for Offline/Hybrid Synchronization  */
/* ------------------------------------------------------------------ */
const CREDIT_ITEMS_STORAGE_KEY = "pos_credit_debt_items";
const STAFF_OVERRIDES_STORAGE_KEY = "pos_staff_overrides";

export function saveCreditSaleItems(
  identifier: string,
  items: Array<{ productId?: string; name: string; quantity: number; unitPrice?: number; totalPrice?: number }>,
) {
  if (typeof window === "undefined" || !identifier || !items || items.length === 0) return;
  try {
    const raw = localStorage.getItem(CREDIT_ITEMS_STORAGE_KEY);
    const map: Record<string, typeof items> = raw ? JSON.parse(raw) : {};
    map[identifier] = items;
    localStorage.setItem(CREDIT_ITEMS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to persist credit sale items:", e);
  }
}

export function getCachedCreditSaleItems(
  identifier?: string,
): Array<{ productId?: string; name: string; quantity: number; unitPrice?: number; totalPrice?: number }> | null {
  if (typeof window === "undefined" || !identifier) return null;
  try {
    const raw = localStorage.getItem(CREDIT_ITEMS_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[identifier] || null;
  } catch {
    return null;
  }
}

export function saveStaffOverride(memberId: string, override: Partial<TeamMember>) {
  if (typeof window === "undefined" || !memberId) return;
  try {
    const raw = localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY);
    const map: Record<string, Partial<TeamMember>> = raw ? JSON.parse(raw) : {};
    map[memberId] = { ...(map[memberId] || {}), ...override };
    localStorage.setItem(STAFF_OVERRIDES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to persist staff override:", e);
  }
}

export function getStaffOverrides(): Record<string, Partial<TeamMember>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
