"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  Filter,
  Hourglass,
  PackageX,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import {
  getAdminNotifications,
  getShopNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  markAllShopNotificationsAsRead,
  markShopNotificationAsRead,
} from "@/lib/api/app-data";
import type {
  AppNotification,
  NotificationSeverity,
  NotificationType,
} from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

function formatFullTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationTypeMeta(type: NotificationType) {
  switch (type) {
    case "LOW_STOCK":
      return {
        label: "Low Stock",
        icon: <PackageX className="size-4 text-amber-600" />,
        color: "bg-amber-50 text-amber-800 border-amber-200",
        actionLabel: "View Product",
        routePrefix: "/products",
      };
    case "PRODUCT_EXPIRED":
      return {
        label: "Product Expired",
        icon: <AlertCircle className="size-4 text-red-600" />,
        color: "bg-red-50 text-red-800 border-red-200",
        actionLabel: "Inspect Item",
        routePrefix: "/products",
      };
    case "PRODUCT_EXPIRING_SOON":
      return {
        label: "Expiring Soon",
        icon: <Hourglass className="size-4 text-amber-600" />,
        color: "bg-amber-50 text-amber-800 border-amber-200",
        actionLabel: "Review Stock",
        routePrefix: "/products",
      };
    case "OVERDUE_DEBT":
      return {
        label: "Overdue Debt",
        icon: <CreditCard className="size-4 text-amber-600" />,
        color: "bg-amber-50 text-amber-800 border-amber-200",
        actionLabel: "Open Debts",
        routePrefix: "/debts",
      };
    case "PENDING_OWNER_APPROVAL":
      return {
        label: "Approval Needed",
        icon: <UserCheck className="size-4 text-blue-600" />,
        color: "bg-blue-50 text-blue-800 border-blue-200",
        actionLabel: "Review Owner",
        routePrefix: "/users",
      };
    case "SYSTEM":
    default:
      return {
        label: "System Alert",
        icon: <Bell className="size-4 text-zinc-600" />,
        color: "bg-zinc-50 text-zinc-800 border-zinc-200",
        actionLabel: "Details",
        routePrefix: "",
      };
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const shopId = useShopStore((state) => state.activeShopId) || user?.shopId || "";
  const isSuperAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SYSTEM_ADMIN";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [readFilter, setReadFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin) {
        const feed = await getAdminNotifications({
          isRead: readFilter === "UNREAD" ? false : readFilter === "READ" ? true : undefined,
          page,
          limit: PAGE_SIZE,
        });
        setNotifications(feed.notifications);
        setUnreadCount(feed.unreadCount);
        setTotalCount(feed.total);
      } else if (shopId) {
        const feed = await getShopNotifications(shopId, {
          isRead: readFilter === "UNREAD" ? false : readFilter === "READ" ? true : undefined,
          type: typeFilter !== "ALL" ? (typeFilter as NotificationType) : undefined,
          severity: severityFilter !== "ALL" ? (severityFilter as NotificationSeverity) : undefined,
          page,
          limit: PAGE_SIZE,
        });
        setNotifications(feed.notifications);
        setUnreadCount(feed.unreadCount);
        setTotalCount(feed.total);
      }
    } catch (err) {
      console.warn("Could not load notifications:", err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, shopId, readFilter, typeFilter, severityFilter, page]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkRead(id: string) {
    try {
      if (isSuperAdmin) {
        await markAdminNotificationAsRead(id);
      } else if (shopId) {
        await markShopNotificationAsRead(shopId, id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("Could not mark notification read:", err);
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
    } catch (err) {
      console.warn("Could not mark all notifications read:", err);
    }
  }

  const filteredNotifications = useMemo(() => {
    if (!search.trim()) return notifications;
    const q = search.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q),
    );
  }, [notifications, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Toolbar                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Notification Center
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Live operational alerts, low-stock warnings, product expiration notices, and system events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 transition-colors"
            >
              <CheckCheck className="size-3.5 text-zinc-500" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadNotifications}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
          >
            <RotateCcw className="size-3.5 text-indigo-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Top Summary KPI Cards                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Unread Alerts
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
              <Bell className="size-4 text-[#5B4FE9]" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
            {unreadCount}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
            Requires attention
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Critical Alerts
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-500/20">
              <AlertCircle className="size-4 text-red-600" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-red-700 tabular-nums">
            {notifications.filter((n) => n.severity === "CRITICAL").length}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-red-600">
            Out-of-stock or expired
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Warnings &amp; Expiring
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-500/20">
              <Hourglass className="size-4 text-amber-600" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
            {notifications.filter((n) => n.severity === "WARNING").length}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-amber-600">
            Upcoming action required
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Filters Toolbar                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Read / Unread Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setReadFilter("ALL");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                readFilter === "ALL"
                  ? "bg-white text-zinc-900 font-bold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All Alerts
            </button>
            <button
              type="button"
              onClick={() => {
                setReadFilter("UNREAD");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                readFilter === "UNREAD"
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setReadFilter("READ");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                readFilter === "READ"
                  ? "bg-white text-zinc-900 font-bold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Read History
            </button>
          </div>

          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts..."
                className="h-9 w-48 sm:w-56 rounded-xl border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none"
              />
            </div>

            {!isSuperAdmin && (
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-zinc-800 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="PRODUCT_EXPIRED">Product Expired</option>
                <option value="PRODUCT_EXPIRING_SOON">Expiring Soon</option>
                <option value="OVERDUE_DEBT">Overdue Debt</option>
                <option value="SYSTEM">System</option>
              </select>
            )}

            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-zinc-800 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Notification Cards List                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            <LoadingState />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No Notifications Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              You are all caught up! There are no alerts matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredNotifications.map((n) => {
              const meta = getNotificationTypeMeta(n.type);

              return (
                <div
                  key={n.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-colors ${
                    n.isRead
                      ? "bg-white hover:bg-zinc-50/80"
                      : n.severity === "CRITICAL"
                      ? "bg-red-50/40 hover:bg-red-50/70"
                      : n.severity === "WARNING"
                      ? "bg-amber-50/30 hover:bg-amber-50/60"
                      : "bg-zinc-50/60 hover:bg-zinc-100/60"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}
                    >
                      {meta.icon}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${meta.color}`}
                        >
                          {meta.label}
                        </span>

                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                            n.severity === "CRITICAL"
                              ? "border-red-200 bg-red-100 text-red-800"
                              : n.severity === "WARNING"
                              ? "border-amber-200 bg-amber-100 text-amber-800"
                              : "border-zinc-200 bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {n.severity}
                        </span>

                        <h3 className="text-xs font-bold text-zinc-900 truncate">
                          {n.title}
                        </h3>

                        {!n.isRead && (
                          <span className="size-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                        )}
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatFullTime(n.createdAt)}
                        </span>

                        {n.isRead && n.readAt && (
                          <span className="text-zinc-400">
                            • Read at {formatFullTime(n.readAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {meta.routePrefix && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!n.isRead) handleMarkRead(n.id);
                          router.push(meta.routePrefix);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <span>{meta.actionLabel}</span>
                        <ExternalLink className="size-3 text-zinc-400" />
                      </button>
                    )}

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        <Check className="size-3 text-emerald-600" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
            <div>
              Page <span className="font-semibold text-zinc-900 font-mono">{page}</span> of{" "}
              <span className="font-semibold text-zinc-900 font-mono">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
