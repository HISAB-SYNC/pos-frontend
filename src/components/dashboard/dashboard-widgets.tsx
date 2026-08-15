import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricTone = "blue" | "purple" | "orange" | "green";

const toneStyles: Record<MetricTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-emerald-50 text-emerald-600",
};

export function OverviewMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: MetricTone;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", toneStyles[tone])}>
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <div>
        <p className="text-xl font-bold text-[#111827]">{value.toLocaleString()}</p>
        <p className="text-sm text-[#6b7280]">{label}</p>
      </div>
    </div>
  );
}

export function DashboardCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SeeAllLink({ href }: { href: string }) {
  return (
    <a href={href} className="text-sm font-medium text-[#2563eb] hover:underline">
      See All
    </a>
  );
}
