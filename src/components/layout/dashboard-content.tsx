import { cn } from "@/lib/utils";

export function DashboardContent({ className, children }: React.HTMLAttributes<HTMLElement>) {
  return <main className={cn("flex-1 bg-[#f3f4f6] p-4 sm:p-6", className)}>{children}</main>;
}
