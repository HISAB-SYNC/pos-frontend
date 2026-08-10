import { cn } from "@/lib/utils";

export function DashboardContent({ className, children }: React.HTMLAttributes<HTMLElement>) {
  return <main className={cn("flex-1 p-4 sm:p-6", className)}>{children}</main>;
}
