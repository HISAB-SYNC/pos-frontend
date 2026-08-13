import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";

export function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="space-y-1">
          <div className="text-lg font-semibold">MiniShop</div>
          <Badge variant="secondary" className="w-fit">Foundation</Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <nav className="space-y-1 text-sm">
          <Link className="block rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" href="/dashboard">Dashboard</Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" href="/pos">POS</Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" href="/products">Products</Link>
        </nav>
        <Separator className="my-4 bg-sidebar-border" />
        <div className="text-xs text-muted-foreground">Role-aware navigation will live here.</div>
      </SidebarContent>
      <SidebarFooter>
        <div className="text-xs text-muted-foreground">MiniShop shell</div>
      </SidebarFooter>
    </Sidebar>
  );
}
