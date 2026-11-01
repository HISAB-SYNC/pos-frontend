import { isMockApiEnabled } from "@/config/env";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { NotificationFeedResponse, NotificationSeverity, NotificationType } from "./types";

/* ------------------------------------------------------------------ */
/* Shop Notifications API                                             */
/* ------------------------------------------------------------------ */
export async function getShopNotifications(
  shopId: string,
  params?: {
    isRead?: boolean;
    type?: NotificationType;
    severity?: NotificationSeverity;
    page?: number;
    limit?: number;
  },
): Promise<NotificationFeedResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  if (isMockApiEnabled()) {
    const store = getMockStore();
    let notifs = (store.notifications || []).filter((n) => !n.shopId || n.shopId === shopId);

    if (notifs.length === 0) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 86400000);

      store.products.forEach((p) => {
        if (!p.shopId || p.shopId === shopId) {
          if (p.stockQuantity <= (p.lowStockThreshold || 5)) {
            notifs.push({
              id: `notif-stock-${p.id}`,
              shopId,
              type: "LOW_STOCK",
              severity: p.stockQuantity === 0 ? "CRITICAL" : "WARNING",
              title: `Low Stock Alert: ${p.name}`,
              message: `${p.name} (SKU: ${p.sku}) has ${p.stockQuantity} ${p.unit || "pcs"} remaining (threshold: ${p.lowStockThreshold || 5}).`,
              entityId: p.id,
              metadata: { stockQuantity: p.stockQuantity, threshold: p.lowStockThreshold, unit: p.unit },
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
          if (p.expiryDate) {
            const exp = new Date(p.expiryDate);
            if (!isNaN(exp.getTime())) {
              if (exp <= now) {
                notifs.push({
                  id: `notif-exp-${p.id}`,
                  shopId,
                  type: "PRODUCT_EXPIRED",
                  severity: "CRITICAL",
                  title: `Product Expired: ${p.name}`,
                  message: `${p.name} (SKU: ${p.sku}) expired on ${exp.toLocaleDateString()}.`,
                  entityId: p.id,
                  metadata: { expiryDate: p.expiryDate },
                  isRead: false,
                  createdAt: new Date().toISOString(),
                });
              } else if (exp <= in7Days) {
                const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
                notifs.push({
                  id: `notif-exp-soon-${p.id}`,
                  shopId,
                  type: "PRODUCT_EXPIRING_SOON",
                  severity: "WARNING",
                  title: `Expiring Soon: ${p.name}`,
                  message: `${p.name} (SKU: ${p.sku}) will expire in ${diffDays} day${diffDays === 1 ? "" : "s"} (${exp.toLocaleDateString()}).`,
                  entityId: p.id,
                  metadata: { expiryDate: p.expiryDate, daysRemaining: diffDays },
                  isRead: false,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      });
      store.notifications = notifs;
    }

    if (params?.isRead !== undefined) {
      notifs = notifs.filter((n) => n.isRead === params.isRead);
    }
    if (params?.type) {
      notifs = notifs.filter((n) => n.type === params.type);
    }
    if (params?.severity) {
      notifs = notifs.filter((n) => n.severity === params.severity);
    }

    const total = notifs.length;
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = notifs.slice((page - 1) * limit, page * limit);

    return {
      notifications: paginated,
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  const query = new URLSearchParams();
  if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params?.type) query.set("type", params.type);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const res = await apiRequest<any>(`${API_ENDPOINTS.shops.notifications(shopId)}${suffix}`);
    if (res && res.notifications) {
      return res as NotificationFeedResponse;
    }
    if (Array.isArray(res)) {
      return {
        notifications: res,
        total: res.length,
        page: 1,
        limit: 20,
        totalPages: 1,
        unreadCount: res.filter((r: any) => !r.isRead).length,
      };
    }
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  } catch (err) {
    console.warn("Could not fetch shop notifications live:", err);
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  }
}

export async function getShopUnreadNotificationCount(shopId: string): Promise<number> {
  if (isMockApiEnabled()) {
    const feed = await getShopNotifications(shopId);
    return feed.unreadCount;
  }

  try {
    const res = await apiRequest<{ count: number }>(API_ENDPOINTS.shops.notificationsUnreadCount(shopId));
    return typeof res?.count === "number" ? res.count : 0;
  } catch {
    const feed = await getShopNotifications(shopId);
    return feed.unreadCount;
  }
}

export async function markShopNotificationAsRead(shopId: string, id: string): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    const item = (store.notifications || []).find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
    }
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.shops.markNotificationRead(shopId, id), { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark shop notification as read:", err);
  }
}

export async function markAllShopNotificationsAsRead(shopId: string): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    (store.notifications || []).forEach((n) => {
      if (!n.shopId || n.shopId === shopId) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      }
    });
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.shops.markAllNotificationsRead(shopId), { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark all shop notifications as read:", err);
  }
}

/* ------------------------------------------------------------------ */
/* SuperAdmin Notifications API                                       */
/* ------------------------------------------------------------------ */
export async function getAdminNotifications(params?: {
  isRead?: boolean;
  page?: number;
  limit?: number;
}): Promise<NotificationFeedResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  if (isMockApiEnabled()) {
    const store = getMockStore();
    let notifs = (store.notifications || []).filter((n) => !n.shopId);
    if (notifs.length === 0) {
      notifs = [
        {
          id: "notif-adm-01",
          shopId: null,
          type: "PENDING_OWNER_APPROVAL",
          severity: "INFO",
          title: "Pending Owner Approval",
          message: "New shop owner registration awaiting approval.",
          entityId: "owner-pending-id",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];
      store.notifications = notifs;
    }
    if (params?.isRead !== undefined) {
      notifs = notifs.filter((n) => n.isRead === params.isRead);
    }
    const total = notifs.length;
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      notifications: notifs.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages,
      unreadCount,
    };
  }

  const query = new URLSearchParams();
  if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  try {
    const res = await apiRequest<any>(`${API_ENDPOINTS.admin.notifications}${suffix}`);
    if (res && res.notifications) {
      return res as NotificationFeedResponse;
    }
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  } catch (err) {
    console.warn("Could not fetch admin notifications:", err);
    return { notifications: [], total: 0, page: 1, limit: 20, totalPages: 1, unreadCount: 0 };
  }
}

export async function getAdminUnreadNotificationCount(): Promise<number> {
  if (isMockApiEnabled()) {
    const feed = await getAdminNotifications();
    return feed.unreadCount;
  }

  try {
    const res = await apiRequest<{ count: number }>(API_ENDPOINTS.admin.notificationsUnreadCount);
    return typeof res?.count === "number" ? res.count : 0;
  } catch {
    const feed = await getAdminNotifications();
    return feed.unreadCount;
  }
}

export async function markAdminNotificationAsRead(id: string): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    const item = (store.notifications || []).find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
    }
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.admin.markNotificationRead(id), { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark admin notification as read:", err);
  }
}

export async function markAllAdminNotificationsAsRead(): Promise<void> {
  if (isMockApiEnabled()) {
    const store = getMockStore();
    (store.notifications || []).forEach((n) => {
      if (!n.shopId) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      }
    });
    return;
  }

  try {
    await apiRequest(API_ENDPOINTS.admin.markAllNotificationsRead, { method: "PATCH" });
  } catch (err) {
    console.warn("Could not mark all admin notifications as read:", err);
  }
}
