"use client";

import { useState } from "react";
import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { ShopSwitcher } from "./shop-switcher";

const NOTIF_COUNT = 3;

export function DashboardHeader() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const toggleNotificationPanel = useUiStore(
    (state) => state.toggleNotificationPanel,
  );
  const notifOpen = useUiStore((state) => state.notificationPanelOpen);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "SYSTEM_ADMIN";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 sm:gap-4 border-b border-zinc-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-md">
      <SidebarTrigger className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" />

      {/* Global Search Bar (Desktop) */}
      <div className="relative mx-auto hidden w-full max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search products, orders, customers..."
          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-9 pr-14 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c0e763]/40"
        />
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-x-0 top-0 z-30 flex h-16 items-center gap-2 bg-white px-3 md:hidden">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search store..."
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs font-medium text-zinc-900 focus:border-zinc-800 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 md:hidden"
          aria-label="Open search"
        >
          <Search className="size-4" />
        </button>

        {/* Multi-shop dropdown switcher */}
        {!isSuperAdmin && <ShopSwitcher />}

        {/* Notifications button */}
        <button
          type="button"
          onClick={toggleNotificationPanel}
          className="relative flex size-9 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
          aria-label="Notifications"
          aria-expanded={notifOpen}
        >
          <Bell className="size-4" />
          {NOTIF_COUNT > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#c0e763] text-[10px] font-bold text-zinc-950 shadow-xs ring-2 ring-white">
              {NOTIF_COUNT}
            </span>
          )}
        </button>

        {/* User avatar & role */}
        <div className="flex items-center gap-2 pl-1">
          <Avatar className="size-9 border border-zinc-200 shadow-xs">
            <AvatarFallback className="bg-zinc-900 text-xs font-bold text-[#c0e763]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-semibold leading-none text-zinc-900">
              {user?.name || "Cashier"}
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-zinc-500">
              {user?.role === "SUPER_ADMIN"
                ? "Platform Admin"
                : user?.role === "OWNER"
                ? "Store Owner"
                : user?.role === "ADMIN"
                ? "Shop Admin"
                : "Sales Operator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
