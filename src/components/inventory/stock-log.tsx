"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { getStockAdjustments } from "@/lib/api";
import type { StockAdjustmentList, StockAdjustmentReason } from "@/lib/api/types";
import { formatQuantity } from "@/lib/utils/units";

export const REASON_LABELS: Record<StockAdjustmentReason, string> = {
  DAMAGED: "Damaged",
  EXPIRED: "Expired",
  LOST: "Lost or stolen",
  OWN_USE: "Used by the shop",
  COUNT_CORRECTION: "Stock count correction",
  CUSTOMER_RETURN: "Customer returned it",
  FOUND: "Found extra stock",
  TRANSFER_IN: "Moved in from another store",
  TRANSFER_OUT: "Moved to another store",
  OTHER: "Other",
};

/** Reasons offered for each kind of change in the Adjust Stock form. */
export const REASONS_FOR: Record<"ADD" | "REMOVE" | "SET", StockAdjustmentReason[]> = {
  ADD: ["FOUND", "CUSTOMER_RETURN", "TRANSFER_IN", "COUNT_CORRECTION", "OTHER"],
  REMOVE: ["DAMAGED", "EXPIRED", "LOST", "OWN_USE", "TRANSFER_OUT", "COUNT_CORRECTION", "OTHER"],
  SET: ["COUNT_CORRECTION", "OTHER"],
};

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ChangeCell({ change, unit }: { change: number; unit?: string }) {
  return (
    <span className={`font-mono font-semibold tabular-nums ${change < 0 ? "text-rose-700" : "text-emerald-700"}`}>
      {change > 0 ? "+" : ""}
      {formatQuantity(change, unit)}
    </span>
  );
}

/** The last few stock changes of one product, shown inside the Adjust Stock form. */
export function RecentProductChanges({ shopId, productId, unit }: { shopId: string; productId: string; unit?: string }) {
  const [data, setData] = useState<StockAdjustmentList | null>(null);

  useEffect(() => {
    let mounted = true;
    getStockAdjustments(shopId, { productId, limit: 4 })
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [shopId, productId]);

  if (!data || data.items.length === 0) return null;

  return (
    <div>
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recent stock changes</p>
      <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200/80">
        {data.items.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
            <span className="truncate text-zinc-600">
              {REASON_LABELS[a.reason]}
              <span className="ml-1.5 font-mono text-[10px] text-zinc-400">{formatDate(a.createdAt)}</span>
            </span>
            <ChangeCell change={a.change} unit={unit} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every stock change in the shop with its reason and value. */
export function StockLogModal({ shopId, onClose }: { shopId: string; onClose: () => void }) {
  const [reason, setReason] = useState<StockAdjustmentReason | "">("");
  const [result, setResult] = useState<{ key: string; data: StockAdjustmentList | null; error: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    getStockAdjustments(shopId, { reason: reason || undefined, limit: 200 })
      .then((data) => {
        if (mounted) setResult({ key: reason, data, error: false });
      })
      .catch(() => {
        if (mounted) setResult({ key: reason, data: null, error: true });
      });
    return () => {
      mounted = false;
    };
  }, [shopId, reason]);

  const isLoading = result?.key !== reason;
  const data = !isLoading ? result?.data : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Stock log</h2>
            <p className="text-xs text-zinc-500">Every stock change that wasn&apos;t a sale or a paid restock, and why.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as StockAdjustmentReason | "")}
            className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden"
          >
            <option value="">All reasons</option>
            {(Object.keys(REASON_LABELS) as StockAdjustmentReason[]).map((r) => (
              <option key={r} value={r}>
                {REASON_LABELS[r]}
              </option>
            ))}
          </select>
          {data && (
            <span className="text-xs text-zinc-500">
              {data.count} {data.count === 1 ? "change" : "changes"} · Stock value lost{" "}
              <span className="font-mono font-bold tabular-nums text-rose-700">{formatEtb(data.valueLost)} ETB</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-12 text-center text-xs text-zinc-400">Loading…</p>
          ) : result?.error ? (
            <p className="py-12 text-center text-xs text-zinc-500">Couldn&apos;t load the stock log.</p>
          ) : !data || data.items.length === 0 ? (
            <p className="py-12 text-center text-xs text-zinc-500">No stock changes recorded yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="sticky top-0 bg-zinc-50 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-2 font-bold">Date</th>
                  <th className="px-3 py-2 font-bold">Product</th>
                  <th className="px-3 py-2 font-bold">Reason</th>
                  <th className="px-3 py-2 text-right font-bold">Change</th>
                  <th className="px-5 py-2 text-right font-bold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.items.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap px-5 py-2 font-mono text-zinc-500">{formatDate(a.createdAt)}</td>
                    <td className="px-3 py-2 text-zinc-800">
                      {a.productName}
                      <span className="ml-1.5 font-mono text-[10px] text-zinc-400">
                        {formatQuantity(a.quantityBefore)} → {formatQuantity(a.quantityAfter)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {REASON_LABELS[a.reason]}
                      {a.notes && <span className="block text-[10px] text-zinc-400">{a.notes}</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <ChangeCell change={a.change} />
                    </td>
                    <td
                      className={`px-5 py-2 text-right font-mono tabular-nums ${
                        a.valueChange < 0 ? "text-rose-700" : "text-zinc-600"
                      }`}
                    >
                      {a.valueChange > 0 ? "+" : ""}
                      {formatEtb(a.valueChange)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data && data.count > data.items.length && (
          <p className="border-t border-zinc-100 px-5 py-2.5 text-[11px] text-zinc-500">
            Showing the latest {data.items.length} of {data.count}.
          </p>
        )}
      </div>
    </div>
  );
}
