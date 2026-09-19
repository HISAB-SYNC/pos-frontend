import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type MetricTone = "lime" | "dark" | "emerald" | "amber" | "blue" | "purple" | "orange" | "green";

const toneStyles: Record<MetricTone, { box: string; icon: string }> = {
  lime: { box: "bg-[#f3fad9] ring-1 ring-[#c0e763]/60", icon: "text-zinc-900" },
  dark: { box: "bg-zinc-900", icon: "text-[#c0e763]" },
  emerald: { box: "bg-emerald-50 ring-1 ring-emerald-500/20", icon: "text-emerald-700" },
  green: { box: "bg-emerald-50 ring-1 ring-emerald-500/20", icon: "text-emerald-700" },
  amber: { box: "bg-amber-50 ring-1 ring-amber-500/20", icon: "text-amber-700" },
  orange: { box: "bg-amber-50 ring-1 ring-amber-500/20", icon: "text-amber-700" },
  blue: { box: "bg-zinc-100 ring-1 ring-zinc-300/40", icon: "text-zinc-900" },
  purple: { box: "bg-zinc-100 ring-1 ring-zinc-300/40", icon: "text-zinc-900" },
};

export function OverviewMetric({
  label,
  value,
  icon: Icon,
  tone = "lime",
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: MetricTone;
  trend?: string;
}) {
  const currentTone = toneStyles[tone] || toneStyles.lime;

  return (
    <div className="flex items-center gap-3.5">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105",
          currentTone.box,
        )}
      >
        <Icon className={cn("size-5", currentTone.icon)} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-xl font-bold tracking-tight text-zinc-900 tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <span className="text-[10px] font-semibold text-emerald-600">
              {trend}
            </span>
          )}
        </div>
        <p className="truncate text-xs font-medium text-zinc-500">{label}</p>
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
    <section
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300/80",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SeeAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 transition-colors hover:text-zinc-950"
    >
      <span>View details</span>
      <ArrowUpRight className="size-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900" />
    </Link>
  );
}
