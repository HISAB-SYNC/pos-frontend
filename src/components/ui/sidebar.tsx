"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";

type SidebarContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileOpen = useUiStore((state) => state.mobileSidebarOpen);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen);

  const value = React.useMemo(
    () => ({
      collapsed,
      mobileOpen,
      toggleCollapsed,
      setMobileOpen,
    }),
    [collapsed, mobileOpen, toggleCollapsed, setMobileOpen],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }

  return context;
}

export function Sidebar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r bg-sidebar-background text-sidebar-foreground transition-[width] duration-200 ease-in-out z-30 lg:flex",
          collapsed ? "w-[72px]" : "w-64",
          className,
        )}
      >
        {children}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <div className="flex h-full flex-col overflow-hidden">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { collapsed, toggleCollapsed, setMobileOpen } = useSidebar();

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className={cn("lg:hidden", className)}
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        {...props}
      >
        <PanelLeftOpen className="size-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className={cn("hidden lg:inline-flex", className)}
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        {...props}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </Button>
    </>
  );
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-header" className={cn("shrink-0 border-b p-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-footer" className={cn("shrink-0 border-t p-4", className)} {...props} />;
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-inset" className={cn("flex min-h-screen flex-1 flex-col", className)} {...props} />;
}

