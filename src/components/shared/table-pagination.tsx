"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type Pagination<T> = {
  /** Current page, 1-based and always within range */
  page: number;
  setPage: (page: number | ((current: number) => number)) => void;
  pageItems: T[];
  totalPages: number;
  /** 1-based index of the first row on the page (0 when empty) */
  from: number;
  /** 1-based index of the last row on the page */
  to: number;
  total: number;
  pageSize: number;
};

/**
 * Client-side pagination for an already filtered and sorted list.
 *
 * The page goes back to 1 whenever the list length changes (a filter or search
 * was applied) and is always clamped to the last page, so callers never need
 * to reset it by hand.
 */
export function usePagination<T>(items: T[], pageSize = 15): Pagination<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [state, setState] = useState({ page: 1, total });

  const page = state.total === total ? Math.min(Math.max(1, state.page), totalPages) : 1;

  const setPage: Pagination<T>["setPage"] = (next) => {
    const value = typeof next === "function" ? next(page) : next;
    setState({ page: Math.min(Math.max(1, value), totalPages), total });
  };

  const start = (page - 1) * pageSize;
  return {
    page,
    setPage,
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    total,
    pageSize,
  };
}

/** True when the row at `index` (in the full list) is on the current page. */
export function isOnPage(pagination: Pick<Pagination<unknown>, "page" | "pageSize">, index: number) {
  const start = (pagination.page - 1) * pagination.pageSize;
  return index >= start && index < start + pagination.pageSize;
}

const buttonClass =
  "rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40";

/** Footer with "Showing x to y of N", Previous / Next. Renders nothing on a single page. */
export function TablePagination({
  pagination,
  noun = "rows",
  className,
}: {
  pagination: Pick<Pagination<unknown>, "page" | "setPage" | "totalPages" | "from" | "to" | "total">;
  noun?: string;
  className?: string;
}) {
  const { page, setPage, totalPages, from, to, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500 print:hidden",
        className,
      )}
    >
      <div>
        Showing <span className="font-mono font-semibold tabular-nums text-zinc-900">{from}</span> to{" "}
        <span className="font-mono font-semibold tabular-nums text-zinc-900">{to}</span> of{" "}
        <span className="font-mono font-semibold tabular-nums text-zinc-900">{total}</span> {noun}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className={buttonClass}>
          Previous
        </button>
        <span className="px-2 font-mono text-xs tabular-nums text-zinc-600">
          {page} / {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={buttonClass}>
          Next
        </button>
      </div>
    </div>
  );
}
