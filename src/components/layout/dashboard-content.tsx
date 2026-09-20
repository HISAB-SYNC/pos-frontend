import { cn } from "@/lib/utils";

export function DashboardContent({ className, children }: React.HTMLAttributes<HTMLElement>) {
  return <main className={cn("flex-1 w-full max-w-full overflow-x-hidden bg-[#f3f4f6] p-3.5 sm:p-5 lg:p-6", className)}>{children}</main>;
}
