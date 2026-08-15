"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
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

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Orders", href: "/pos", icon: ShoppingCart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Expenses", href: "/expenses", icon: Wallet },
  { label: "Manage User", href: "/settings", icon: UserCog },
];

const footerNav = [{ label: "Settings", href: "/settings", icon: Settings }];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
        "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-[#eff6ff] text-[#2563eb]"
          : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-[#2563eb]" : "text-[#6b7280]")} />
      {!collapsed && <span>{label}</span>}
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

  function handleLogout() {
    clearSession();
    setActiveShop(null);
    router.push("/login");
  }

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  return (
    <Sidebar className="border-r border-[#e5e7eb] bg-white">
      <SidebarHeader
        className={cn(
          "border-b border-[#e5e7eb] py-5",
          collapsed ? "flex justify-center px-2" : "px-5",
        )}
      >
        <Link href="/dashboard" onClick={closeMobileSidebar}>
          {collapsed ? (
            <AndalusLogo variant="icon" className="size-9" />
          ) : (
            <AndalusLogo variant="compact" />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className={cn("py-4", collapsed ? "px-2" : "px-3")}>
        <nav className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={closeMobileSidebar}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className={cn("space-y-1 border-t border-[#e5e7eb] py-4", collapsed ? "px-2" : "px-3")}>
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
          title={collapsed ? "Log Out" : undefined}
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-[#4b5563] transition-colors hover:bg-[#f9fafb] hover:text-[#111827]",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          )}
        >
          <LogOut className="size-[18px] shrink-0 text-[#6b7280]" />
          {!collapsed && "Log Out"}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
