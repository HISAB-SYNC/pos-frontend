"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setActiveShop = useShopStore((state) => state.setActiveShop);

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN" || user?.role === "SYSTEM_ADMIN";
  const isSales = user?.role === "SALES";

  // Global keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  function handleSelect(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  async function handleSignOut() {
    onOpenChange(false);
    try {
      const { logout } = await import("@/lib/api/auth");
      await logout();
    } catch {
      // Graceful fallback
    }
    clearSession();
    setActiveShop(null);
    router.push("/login");
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] sm:w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex items-center border-b border-zinc-100 px-3">
        <Search className="mr-2.5 size-4 shrink-0 text-zinc-400" />
        <CommandInput
          placeholder="Type a page, tool, or action..."
          className="h-12 w-full bg-transparent text-xs font-medium text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
        <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline-block">
          ESC
        </kbd>
      </div>

      <CommandList className="max-h-[340px] overflow-y-auto p-2 text-xs">
        <CommandEmpty className="py-8 text-center text-xs text-zinc-500">
          No matching pages or actions found.
        </CommandEmpty>

        {/* Quick Operations Group */}
        <CommandGroup heading="Quick Actions" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <CommandItem
            onSelect={() => handleSelect("/pos")}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <div className="flex size-6 items-center justify-center rounded bg-indigo-50 text-[#5B4FE9]">
              <Store className="size-3.5" />
            </div>
            <span>New Sale (Open POS)</span>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">/pos</span>
          </CommandItem>

          {!isSales && (
            <CommandItem
              onSelect={() => handleSelect("/products")}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <div className="flex size-6 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                <Plus className="size-3.5" />
              </div>
              <span>Add or Manage Products</span>
              <span className="ml-auto font-mono text-[10px] text-zinc-400">/products</span>
            </CommandItem>
          )}

          <CommandItem
            onSelect={() => handleSelect("/debts")}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <div className="flex size-6 items-center justify-center rounded bg-amber-50 text-amber-600">
              <HandCoins className="size-3.5" />
            </div>
            <span>Receive Debt Settlement</span>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">/debts</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1.5 h-px bg-zinc-100" />

        {/* Navigation Group */}
        <CommandGroup heading="Navigation" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {!isSales && !isSuperAdmin && (
            <CommandItem
              onSelect={() => handleSelect("/dashboard")}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
            >
              <LayoutDashboard className="size-4 text-zinc-500" />
              <span>Dashboard Overview</span>
            </CommandItem>
          )}

          <CommandItem
            onSelect={() => handleSelect("/orders")}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <ShoppingCart className="size-4 text-zinc-500" />
            <span>Sales History & Receipts</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect("/customers")}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <Users className="size-4 text-zinc-500" />
            <span>Customer Directory & Ledger</span>
          </CommandItem>

          {!isSales && (
            <>
              <CommandItem
                onSelect={() => handleSelect("/inventory")}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <Package className="size-4 text-zinc-500" />
                <span>Stock & Inventory Adjustments</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect("/reports")}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <BarChart3 className="size-4 text-zinc-500" />
                <span>Reports & Analytics</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleSelect("/expenses")}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <Wallet className="size-4 text-zinc-500" />
                <span>Store Expenses</span>
              </CommandItem>
            </>
          )}

          {isSuperAdmin && (
            <>
              <CommandItem
                onSelect={() => handleSelect("/admin/dashboard")}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <LayoutDashboard className="size-4 text-zinc-500" />
                <span>Admin Overview</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/admin/shops")}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <Building2 className="size-4 text-zinc-500" />
                <span>All Shops Management</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator className="my-1.5 h-px bg-zinc-100" />

        {/* Settings & Account */}
        <CommandGroup heading="System" className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <CommandItem
            onSelect={() => handleSelect("/settings")}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <Settings className="size-4 text-zinc-500" />
            <span>Store Settings & Profile</span>
          </CommandItem>

          <CommandItem
            onSelect={handleSignOut}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="size-4 text-red-500" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
