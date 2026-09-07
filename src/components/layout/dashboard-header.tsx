"use client";

import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

const NOTIF_COUNT = 3;

export function DashboardHeader() {
  const user = useAuthStore((state) => state.user);
  const toggleNotificationPanel = useUiStore((state) => state.toggleNotificationPanel);
  const notifOpen = useUiStore((state) => state.notificationPanelOpen);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[#e5e7eb] bg-white px-4 sm:px-6">
      <SidebarTrigger />

      <div className="relative mx-auto hidden w-full max-w-xl flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
        <Input
          placeholder="Search product, supplier, order"
          className="h-10 rounded-lg border-[#e5e7eb] bg-[#f9fafb] pl-10 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={toggleNotificationPanel}
          className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-[#f3f4f6]"
          aria-label="Notifications"
          aria-expanded={notifOpen}
        >
          <Bell className="size-5 text-[#4b5563]" />
          {NOTIF_COUNT > 0 && (
            <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              {NOTIF_COUNT}
            </span>
          )}
        </button>

        <Avatar className="size-9 border border-[#e5e7eb]">
          <AvatarFallback className="bg-[#eff6ff] text-sm font-semibold text-[#2563eb]">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
