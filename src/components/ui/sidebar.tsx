"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ defaultOpen = true, children }: { defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen);

  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }

  return context;
}

export function Sidebar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <aside className={cn("hidden h-full w-64 shrink-0 border-r bg-sidebar-background text-sidebar-foreground lg:flex lg:flex-col", !open && "lg:w-0 lg:overflow-hidden", className)}>
        {children}
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <div className="flex h-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { setOpen } = useSidebar();

  return <Button variant="outline" size="icon" className={cn("lg:hidden", className)} onClick={() => setOpen(true)} {...props}><Menu className="size-4" /></Button>;
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-header" className={cn("border-b p-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-content" className={cn("flex-1 overflow-auto p-4", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-footer" className={cn("border-t p-4", className)} {...props} />;
}

export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="sidebar-inset" className={cn("flex min-h-screen flex-1 flex-col", className)} {...props} />;
}
