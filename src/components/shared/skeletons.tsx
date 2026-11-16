"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/use-t";

/**
 * Loading placeholders shaped like the pages they stand in for, so the layout
 * does not jump when the data arrives. All of them work from phone to desktop
 * (columns drop away and grids stack on small screens).
 */

/** One grey block. */
export function Bone({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-zinc-200/70", className)} />;
}

/** Tells screen readers the area is loading. Wrap a skeleton in it. */
function Busy({ children, className }: { children: React.ReactNode; className?: string }) {
  const t = useT();
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t("shared.loading")}</span>
      {children}
    </div>
  );
}

const card = "rounded-xl border border-zinc-200/80 bg-white shadow-2xs";

/** Title, subtitle and a few buttons; the buttons wrap under the title on phones. */
export function PageHeaderSkeleton({ actions = 2 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Bone className="h-6 w-44" />
        <Bone className="h-3 w-64 max-w-full" />
      </div>
      {actions > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actions }).map((_, i) => (
            <Bone key={i} className="h-9 w-28" />
          ))}
        </div>
      )}
    </div>
  );
}

/** A row of summary cards: label, big number, hint. */
export function CardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", count === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(card, "space-y-3 p-4 sm:p-5", count === 3 && i === 0 && "col-span-2 lg:col-span-1")}>
          <div className="flex items-center justify-between">
            <Bone className="h-3 w-20" />
            <Bone className="size-8 rounded-lg" />
          </div>
          <Bone className="h-7 w-28" />
          <Bone className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Rows with a round icon, two text lines and an amount on the right. Used for
 * lists (activity, payments, notifications) and inside table cells.
 */
export function ListSkeleton({ rows = 5, avatar = true, className }: { rows?: number; avatar?: boolean; className?: string }) {
  return (
    <Busy className={cn("divide-y divide-zinc-100", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          {avatar && <Bone className="size-9 shrink-0 rounded-full" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className={cn("h-3.5", i % 2 ? "w-2/5" : "w-3/5")} />
            <Bone className="h-3 w-1/3" />
          </div>
          <Bone className="h-4 w-16 shrink-0 sm:w-20" />
        </div>
      ))}
    </Busy>
  );
}

/**
 * A table card: toolbar (chips and search), header and rows. Columns beyond the
 * first two are hidden on phones so rows keep a sensible width.
 */
export function TableSkeleton({
  rows = 6,
  columns = 4,
  toolbar = true,
  className,
}: {
  rows?: number;
  columns?: number;
  toolbar?: boolean;
  className?: string;
}) {
  return (
    <Busy className={cn(card, "overflow-hidden", className)}>
      {toolbar && (
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Bone className="h-9 w-56 max-w-full" />
          <div className="flex gap-2">
            <Bone className="h-9 w-full sm:w-52" />
            <Bone className="h-9 w-20 shrink-0" />
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:px-5">
        {Array.from({ length: columns }).map((_, c) => (
          <Bone key={c} className={cn("h-3 flex-1", c > 1 && "hidden sm:block")} />
        ))}
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className={cn("flex-1", c > 1 && "hidden sm:block")}>
                <Bone className={cn("h-4", c === 0 ? "w-4/5" : c % 2 ? "w-3/5" : "w-2/3")} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Header, summary cards and a table: the shape of most list pages. */
export function TablePageSkeleton({ cards = 4, actions = 2, rows = 7 }: { cards?: number; actions?: number; rows?: number }) {
  return (
    <Busy className="space-y-5 sm:space-y-6">
      <PageHeaderSkeleton actions={actions} />
      {cards > 0 && <CardsSkeleton count={cards} />}
      <TableSkeleton rows={rows} />
    </Busy>
  );
}

/** The dashboard: header, KPI cards, a wide chart card and two side cards. */
export function DashboardSkeleton() {
  return (
    <Busy className="space-y-5 sm:space-y-6">
      <PageHeaderSkeleton actions={3} />
      <CardsSkeleton count={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={cn(card, "space-y-4 p-5 lg:col-span-2")}>
          <Bone className="h-4 w-40" />
          <Bone className="h-56 w-full sm:h-64" />
        </div>
        <div className={cn(card, "space-y-4 p-5")}>
          <Bone className="h-4 w-32" />
          <Bone className="mx-auto size-40 rounded-full" />
          <Bone className="h-3 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={cn(card, "p-5")}>
          <Bone className="mb-4 h-4 w-36" />
          <ListSkeleton rows={4} avatar={false} className="-mx-4 sm:-mx-5" />
        </div>
        <div className={cn(card, "p-5")}>
          <Bone className="mb-4 h-4 w-36" />
          <ListSkeleton rows={4} className="-mx-4 sm:-mx-5" />
        </div>
      </div>
    </Busy>
  );
}

/** Funds: balances, period choice with three numbers, then the activity list. */
export function FundsSkeleton() {
  return (
    <Busy className="space-y-5">
      <PageHeaderSkeleton actions={2} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="space-y-3 rounded-xl bg-slate-900/90 px-5 py-4">
          <Bone className="h-3 w-32 bg-slate-700" />
          <Bone className="h-9 w-44 bg-slate-700" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(card, "space-y-2.5 px-3 py-3 sm:px-4")}>
              <Bone className="h-3 w-14" />
              <Bone className="h-6 w-full max-w-24" />
              <Bone className="hidden h-3 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Bone className="h-9 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(card, "space-y-2 p-3 sm:p-4")}>
            <Bone className="h-3 w-10" />
            <Bone className="h-6 w-full max-w-24" />
          </div>
        ))}
      </div>
      <div className={cn(card, "overflow-hidden")}>
        <div className="border-b border-zinc-100 p-3 sm:p-4">
          <Bone className="h-9 w-72 max-w-full" />
        </div>
        <ListSkeleton rows={6} />
      </div>
    </Busy>
  );
}

/** A supplier (or customer) page: back link, name card, amount card and two lists. */
export function DetailPageSkeleton() {
  return (
    <Busy className="space-y-5">
      <Bone className="h-4 w-28" />
      <div className={cn(card, "flex flex-wrap items-center gap-4 p-4 sm:p-5")}>
        <Bone className="size-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-6 w-48 max-w-full" />
          <Bone className="h-3 w-36" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-20" />
          <Bone className="h-9 w-24" />
        </div>
      </div>
      <div className={cn(card, "flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5")}>
        <div className="space-y-2">
          <Bone className="h-3 w-16" />
          <Bone className="h-9 w-40" />
        </div>
        <Bone className="h-10 w-24" />
      </div>
      <div className={cn(card, "overflow-hidden")}>
        <div className="border-b border-zinc-100 px-5 py-3">
          <Bone className="h-4 w-36" />
        </div>
        <ListSkeleton rows={4} avatar={false} />
      </div>
      <div className={cn(card, "overflow-hidden")}>
        <div className="border-b border-zinc-100 px-5 py-3">
          <Bone className="h-4 w-28" />
        </div>
        <ListSkeleton rows={4} />
      </div>
    </Busy>
  );
}

/** POS checkout: search and categories, a product grid, and the order panel on large screens. */
export function PosSkeleton() {
  return (
    <Busy className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      <div className="space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Bone className="h-6 w-36" />
            <Bone className="hidden h-3 w-56 sm:block" />
          </div>
          <Bone className="h-9 w-full sm:w-80" />
        </div>
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-8 w-20 shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn(card, "space-y-3 p-3")}>
              <div className="flex justify-between">
                <Bone className="h-4 w-14" />
                <Bone className="h-4 w-12" />
              </div>
              <Bone className="h-4 w-4/5" />
              <Bone className="h-3 w-1/3" />
              <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                <Bone className="h-5 w-16" />
                <Bone className="size-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn(card, "hidden space-y-4 p-5 lg:block")}>
        <Bone className="h-5 w-32" />
        <Bone className="h-9 w-full" />
        <Bone className="h-24 w-full" />
        <Bone className="h-10 w-full" />
      </div>
    </Busy>
  );
}
