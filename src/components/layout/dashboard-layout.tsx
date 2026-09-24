"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { isMockApiEnabled } from "@/config/env";
import { LoadingState } from "@/components/shared/loading-state";

import { DashboardContent } from "./dashboard-content";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

const emptySubscribe = () => () => {};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!isMockApiEnabled() && (!isAuthenticated || !accessToken)) {
      router.replace("/login");
      return;
    }

    // Role-based route guard: SALES users are restricted to POS, products, orders, customers, debts
    if (user?.role === "SALES") {
      const restrictedRoutes = ["/dashboard", "/expenses", "/suppliers", "/reports", "/inventory", "/users"];
      const isRestricted = restrictedRoutes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      if (isRestricted) {
        router.replace("/pos");
      }
    }
  }, [hydrated, isAuthenticated, accessToken, user?.role, pathname, router]);

  if (!hydrated) {
    return <LoadingState />;
  }

  if (!isMockApiEnabled() && (!isAuthenticated || !accessToken)) {
    return <LoadingState />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <DashboardContent>{children}</DashboardContent>
        </div>
      </div>
    </SidebarProvider>
  );
}
