import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardContent } from "./dashboard-content";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
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
