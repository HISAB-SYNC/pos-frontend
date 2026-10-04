"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Search, Settings, Store, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  getAdminUnreadNotificationCount,
  getShopUnreadNotificationCount,
} from "@/lib/api/app-data";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";
import { useUiStore } from "@/stores/ui-store";

import { CommandPalette } from "./command-palette";
import { NotificationsPanel } from "./notifications-panel";
import { ShopSwitcher } from "./shop-switcher";

export function DashboardHeader() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const shopId = useShopStore((state) => state.activeShopId) || user?.shopId || "";
  const setActiveShop = useShopStore((state) => state.setActiveShop);

  const toggleNotificationPanel = useUiStore(
    (state) => state.toggleNotificationPanel,
  );
  const notifOpen = useUiStore((state) => state.notificationPanelOpen);
  const setNotifOpen = useUiStore((state) => state.setNotificationPanelOpen);

  const commandPaletteOpen = useUiStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "SYSTEM_ADMIN";

  const loadUnreadCount = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const count = await getAdminUnreadNotificationCount();
        setUnreadCount(count);
      } else if (shopId) {
        const count = await getShopUnreadNotificationCount(shopId);
        setUnreadCount(count);
      }
    } catch {
      // Graceful fallback
    }
  }, [isSuperAdmin, shopId]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  async function handleLogout() {
    try {
      const { logout } = await import("@/lib/api/auth");
      await logout();
    } catch {
      // Graceful
    }
    clearSession();
    setActiveShop(null);
    router.push("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 sm:gap-4 border-b border-zinc-200/80 bg-white px-3 sm:px-6">
        <SidebarTrigger className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" />

        {/* Global Search Bar (Desktop Trigger for Command Palette) */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="group relative mx-auto hidden w-full max-w-md flex-1 items-center justify-between rounded-md border border-zinc-200/90 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-300 hover:bg-white md:flex"
        >
          <div className="flex items-center gap-2.5">
            <Search className="size-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
            <span className="font-normal text-zinc-500">Quick search pages, products, actions...</span>
          </div>
          <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 relative">
          {/* Mobile Search Icon Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="flex size-9 items-center justify-center rounded-md border border-zinc-200/90 bg-white text-zinc-600 hover:bg-zinc-50 md:hidden"
            aria-label="Open search"
          >
            <Search className="size-4" />
          </button>

          {/* Multi-shop dropdown switcher */}
          {!isSuperAdmin && <ShopSwitcher />}

          {/* Notifications button */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotificationPanel}
              className="relative flex size-9 items-center justify-center rounded-md border border-zinc-200/90 bg-white text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#5B4FE9] text-[10px] font-bold text-white shadow-xs ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Floating Notifications Panel */}
            <NotificationsPanel
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              onUnreadCountChange={(c) => setUnreadCount(c)}
            />
          </div>

          {/* User profile dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md p-1 hover:bg-zinc-100 transition-colors outline-none focus:ring-2 focus:ring-[#5B4FE9]/30"
              >
                <Avatar className="size-8 rounded-md border border-zinc-200 shadow-2xs">
                  <AvatarFallback className="bg-slate-900 text-xs font-bold text-indigo-300 rounded-md">
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
                <ChevronDown className="hidden size-3 text-zinc-400 sm:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-lg border-zinc-200 bg-white p-1 shadow-lg">
              <div className="px-2.5 py-2">
                <p className="text-xs font-bold text-zinc-900">{user?.name || "User"}</p>
                <p className="truncate text-[11px] text-zinc-500">{user?.email || "user@store.local"}</p>
                <div className="mt-1.5">
                  <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-700">
                    {user?.role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : user?.role === "OWNER"
                      ? "Store Owner"
                      : user?.role === "ADMIN"
                      ? "Shop Admin"
                      : "Sales Operator"}
                  </span>
                </div>
              </div>

              <div className="my-1 h-px bg-zinc-100" />

              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <Settings className="size-3.5 text-zinc-400" />
                <span>Account & Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/pos")}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer"
              >
                <Store className="size-3.5 text-zinc-400" />
                <span>POS Register</span>
              </DropdownMenuItem>

              <div className="my-1 h-px bg-zinc-100" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="size-3.5 text-red-500" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </>
  );
}
