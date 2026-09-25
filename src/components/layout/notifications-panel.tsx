"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  ExternalLink,
  Hourglass,
  PackageX,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getAdminNotifications,
  getShopNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  markAllShopNotificationsAsRead,
  markShopNotificationAsRead,
} from "@/lib/api/app-data";
import type { AppNotification, NotificationType } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "LOW_STOCK":
      return <PackageX className="size-4 text-amber-600" />;
    case "PRODUCT_EXPIRED":
      return <AlertCircle className="size-4 text-red-600" />;
    case "PRODUCT_EXPIRING_SOON":
      return <Hourglass className="size-4 text-amber-600" />;
    case "OVERDUE_DEBT":
      return <CreditCard className="size-4 text-amber-600" />;
    case "PENDING_OWNER_APPROVAL":
      return <UserCheck className="size-4 text-blue-600" />;
    case "SYSTEM":
    default:
      return <Bell className="size-4 text-zinc-600" />;
  }
}

export function NotificationsPanel({
  open,
  onClose,
  onUnreadCountChange,
}: {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const shopId = useShopStore((state) => state.activeShopId) || user?.shopId || "";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SYSTEM_ADMIN";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      if (isSuperAdmin) {
        const feed = await getAdminNotifications({ limit: 15 });
        setNotifications(feed.notifications);
        setUnreadCount(feed.unreadCount);
        onUnreadCountChange?.(feed.unreadCount);
      } else if (shopId) {
        const feed = await getShopNotifications(shopId, { limit: 15 });
        setNotifications(feed.notifications);
        setUnreadCount(feed.unreadCount);
        onUnreadCountChange?.(feed.unreadCount);
      }
    } catch (err) {
      console.warn("Could not load notifications in drawer:", err);
    } finally {
      setIsLoading(false);
    }
  }, [open, isSuperAdmin, shopId, onUnreadCountChange]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  async function handleMarkRead(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    try {
      if (isSuperAdmin) {
        await markAdminNotificationAsRead(id);
      } else if (shopId) {
        await markShopNotificationAsRead(shopId, id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      onUnreadCountChange?.(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.warn("Could not mark notification as read:", err);
    }
  }

  async function handleMarkAllRead() {
    try {
      if (isSuperAdmin) {
        await markAllAdminNotificationsAsRead();
      } else if (shopId) {
        await markAllShopNotificationsAsRead(shopId);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch (err) {
      console.warn("Could not mark all notifications as read:", err);
    }
  }

  function handleNotificationClick(n: AppNotification) {
    if (!n.isRead) {
      handleMarkRead(n.id);
    }
    onClose();

    if (n.type === "LOW_STOCK" || n.type === "PRODUCT_EXPIRED" || n.type === "PRODUCT_EXPIRING_SOON") {
      router.push("/products");
    } else if (n.type === "OVERDUE_DEBT") {
      router.push("/debts");
    } else if (n.type === "PENDING_OWNER_APPROVAL") {
      router.push("/admin/requests");
    } else {
      router.push("/notifications");
    }
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            Notifications
          </h3>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-[#c0e763] px-2 py-0.5 text-[10px] font-bold text-zinc-950">
              {unreadCount} unread
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              All caught up
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="size-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="my-2.5 max-h-80 overflow-y-auto space-y-2 pr-0.5">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-zinc-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            <Bell className="mx-auto mb-2 size-6 text-zinc-300" />
            No active notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`group flex items-start justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                n.isRead
                  ? "border-zinc-100 bg-white hover:bg-zinc-50"
                  : n.severity === "CRITICAL"
                  ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                  : n.severity === "WARNING"
                  ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50/70"
                  : "border-zinc-200/90 bg-zinc-50/80 hover:bg-zinc-100/80"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${
                    n.severity === "CRITICAL"
                      ? "bg-red-100"
                      : n.severity === "WARNING"
                      ? "bg-amber-100"
                      : "bg-zinc-100"
                  }`}
                >
                  {getNotificationIcon(n.type)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold leading-tight text-zinc-900">
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="size-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] leading-snug text-zinc-600 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-400 pt-0.5">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </div>

              {!n.isRead && (
                <button
                  type="button"
                  onClick={(e) => handleMarkRead(n.id, e)}
                  className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-800 transition-colors"
                  title="Mark as read"
                >
                  <Check className="size-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 pt-2 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors"
        >
          <span>View Notification Center</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
