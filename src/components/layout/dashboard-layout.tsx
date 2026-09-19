"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { isMockApiEnabled } from "@/config/env";
import { LoadingState } from "@/components/shared/loading-state";

import { DashboardContent } from "./dashboard-content";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isMockApiEnabled() && (!isAuthenticated || !accessToken)) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, accessToken, router]);

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
