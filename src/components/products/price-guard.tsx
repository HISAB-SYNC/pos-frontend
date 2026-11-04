"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

import { checkPrices, confirmFlags, marginOf, type PriceIssue } from "@/lib/utils/pricing";

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/**
 * Price checks for a product form: local checks as the user types, plus any
 * price issue the backend reports. Saving needs an explicit "these prices are
 * correct" once there is an issue; the confirm resets when the prices change.
 */
export function usePriceGuard(input: {
  price: number;
  buyingPrice: number;
  previousPrice?: number | null;
  previousBuyingPrice?: number | null;
}) {
  const { price, buyingPrice, previousPrice, previousBuyingPrice } = input;
  const key = `${price}|${buyingPrice}`;
  const localIssues = useMemo(
    () => checkPrices({ price, buyingPrice, previousPrice, previousBuyingPrice }),
    [price, buyingPrice, previousPrice, previousBuyingPrice],
  );
  const [serverIssue, setServerIssue] = useState<{ key: string; issue: PriceIssue } | null>(null);
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);

  const extra =
    serverIssue?.key === key && !localIssues.some((i) => i.code === serverIssue.issue.code) ? [serverIssue.issue] : [];
  const issues = [...localIssues, ...extra];
  const confirmed = confirmedKey === key;

  return {
    issues,
    confirmed,
    setConfirmed: (value: boolean) => setConfirmedKey(value ? key : null),
    /** True while there are price issues the user hasn't confirmed. */
    blocked: issues.length > 0 && !confirmed,
    /** Flags to send with the save request. */
    flags: confirmed ? confirmFlags(issues) : {},
    /**
     * Turns a backend price error into a confirmable issue. Returns true when
     * the error was a price issue (the form should not show it as a failure).
     */
    handleServerError(err: unknown) {
      const e = err as { code?: string; message?: string } | null;
      if (!e?.code || !e.code.startsWith("PRICE_")) return false;
      setServerIssue({ key, issue: { code: e.code as PriceIssue["code"], message: e.message || "Please check the prices." } });
      setConfirmedKey(null);
      return true;
    },
  };
}

/** Live "profit per unit" line under the price fields. */
export function MarginHint({ price, buyingPrice }: { price: number; buyingPrice: number }) {
  const m = marginOf(price, buyingPrice);
  if (!m) return null;
  const tone = m.profit <= 0 ? "text-rose-700" : m.marginPct < 10 ? "text-amber-700" : "text-emerald-700";
  return (
    <p className={`text-[11px] font-medium ${tone}`}>
      {m.profit === 0
        ? "Sells at cost: no profit per unit"
        : m.profit < 0
        ? `Loss of ${formatEtb(-m.profit)} ETB on every unit sold`
        : `Profit ${formatEtb(m.profit)} ETB per unit (${m.marginPct}% margin)`}
    </p>
  );
}

/** Lists price issues and asks the user to confirm before saving. */
export function PriceIssuesBox({
  issues,
  confirmed,
  onConfirmChange,
}: {
  issues: PriceIssue[];
  confirmed: boolean;
  onConfirmChange: (value: boolean) => void;
}) {
  if (issues.length === 0) return null;
  const belowCost = issues.some((i) => i.code === "PRICE_BELOW_COST");
  return (
    <div
      className={`space-y-2 rounded-md border p-3 text-xs ${
        belowCost ? "border-rose-200 bg-rose-50/70 text-rose-900" : "border-amber-200 bg-amber-50/70 text-amber-900"
      }`}
    >
      <p className="flex items-center gap-1.5 font-semibold">
        <AlertTriangle className="size-3.5 shrink-0" />
        Please check the prices
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {issues.map((i) => (
          <li key={`${i.code}-${i.message}`}>{i.message}</li>
        ))}
      </ul>
      <label className="flex cursor-pointer items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirmChange(e.target.checked)}
          className={`size-3.5 ${belowCost ? "accent-rose-600" : "accent-amber-600"}`}
        />
        {belowCost ? "Yes, sell at or below cost on purpose" : "Yes, these prices are correct"}
      </label>
    </div>
  );
}
