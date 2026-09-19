"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { AndalusLogo } from "@/components/shared/andalus-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";
import { useUiStore } from "@/stores/ui-store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS Checkout", href: "/pos", icon: Store, badge: "Live" },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Sales History", href: "/orders", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Debts / Credit", href: "/debts", icon: HandCoins },
  { label: "Expenses", href: "/expenses", icon: Wallet },
  { label: "Manage Team", href: "/users", icon: UserCog },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Owner Registration", href: "/admin/requests", icon: UserPlus },
  { label: "All Shops", href: "/admin/shops", icon: Building2 },
  { label: "All Users", href: "/admin/users", icon: Users },
  { label: "Monitoring", href: "/admin/monitoring", icon: Activity },
];

const footerNav: NavItem[] = [{ label: "Settings", href: "/settings", icon: Settings }];

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center rounded-lg py-2 text-xs font-medium transition-all duration-150",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-[#c0e763]/25 text-zinc-950 font-semibold border-l-2 border-[#7ea521] shadow-xs"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-[#547311]" : "text-zinc-400 group-hover:text-zinc-700",
        )}
      />
      {!collapsed && (
        <span className="flex-1 truncate tracking-tight">{label}</span>
      )}
      {!collapsed && badge && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            active
              ? "bg-[#c0e763] text-zinc-950"
              : "bg-zinc-100 text-zinc-600",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setActiveShop = useShopStore((state) => state.setActiveShop);
  const activeShopName = useShopStore((state) => state.activeShopName);
  const user = useAuthStore((state) => state.user);

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "SYSTEM_ADMIN" ||
    pathname.startsWith("/admin");

  // RBAC Navigation Filtering
  const permittedNav = useMemo<NavItem[]>(() => {
    if (isSuperAdmin) return adminNav;

    if (user?.role === "SALES") {
      return [
        { label: "POS Checkout", href: "/pos", icon: Store, badge: "Live" },
        { label: "Products Catalog", href: "/products", icon: Package },
        { label: "Sales History", href: "/orders", icon: ShoppingCart },
        { label: "Customers", href: "/customers", icon: Users },
        { label: "Debts / Credit", href: "/debts", icon: HandCoins },
      ];
    }

    if (user?.role === "ADMIN") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "POS Checkout", href: "/pos", icon: Store, badge: "Live" },
        { label: "Products", href: "/products", icon: Package },
        { label: "Inventory", href: "/inventory", icon: Package },
        { label: "Suppliers", href: "/suppliers", icon: Truck },
        { label: "Sales History", href: "/orders", icon: ShoppingCart },
        { label: "Customers", href: "/customers", icon: Users },
        { label: "Debts / Credit", href: "/debts", icon: HandCoins },
        { label: "Reports", href: "/reports", icon: BarChart3 },
        { label: "Manage Sellers", href: "/users", icon: UserCog },
      ];
    }

    // Owner gets full operational suite
    return mainNav;
  }, [isSuperAdmin, user?.role]);

  const navItems = permittedNav;
  const brandHref = isSuperAdmin
    ? "/admin/dashboard"
    : user?.role === "SALES"
    ? "/pos"
    : "/dashboard";

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

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  return (
    <Sidebar className="border-r border-zinc-200/80 bg-[#fafbfc] text-zinc-800">
      <SidebarHeader
        className={cn(
          "border-b border-zinc-200/80 py-4",
          collapsed ? "flex justify-center px-2" : "px-4",
        )}
      >
        <Link
          href={brandHref}
          onClick={closeMobileSidebar}
          className="flex items-center"
        >
          {collapsed ? (
            <AndalusLogo variant="icon" className="size-9 bg-zinc-100" />
          ) : (
            <AndalusLogo variant="compact" textClassName="text-zinc-900" />
          )}
        </Link>

        {!collapsed && activeShopName && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-2xs">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#82a823] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#82a823]" />
            </span>
            <span className="truncate font-medium">{activeShopName}</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={cn("py-3", collapsed ? "px-2" : "px-3")}>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              collapsed={collapsed}
              onNavigate={closeMobileSidebar}
              active={
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`))
              }
            />
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter
        className={cn(
          "space-y-1 border-t border-zinc-200/80 py-3",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {footerNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            onNavigate={closeMobileSidebar}
            active={pathname === item.href}
          />
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "group flex w-full items-center rounded-lg py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
        >
          <LogOut className="size-4 shrink-0 text-zinc-400 group-hover:text-red-600" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
