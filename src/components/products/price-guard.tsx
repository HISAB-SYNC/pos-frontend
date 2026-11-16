"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/use-t";
import { confirmFlags, JUMP_RATIO, MAX_MARKUP_RATIO, marginOf, type PriceIssue } from "@/lib/utils/pricing";

type Translate = ReturnType<typeof useT>;

function formatEtb(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/**
 * Same rules as `checkPrices` in lib/utils/pricing, with the warning text in
 * the interface language.
 */
function checkPricesT(
  t: Translate,
  input: { price: number; buyingPrice: number; previousPrice?: number | null; previousBuyingPrice?: number | null },
): PriceIssue[] {
  const { price: sell, buyingPrice: buy } = input;
  const issues: PriceIssue[] = [];

  if (sell > 0 && buy > 0 && buy >= sell) {
    issues.push({
      code: "PRICE_BELOW_COST",
      message:
        buy === sell
          ? t("inventory.priceSame", { price: formatEtb(sell) })
          : t("inventory.priceBelowCost", {
              buy: formatEtb(buy),
              sell: formatEtb(sell),
              loss: formatEtb(Math.round((buy - sell) * 100) / 100),
            }),
    });
  }

  const jumps: Array<[boolean, number, number | null | undefined]> = [
    [true, buy, input.previousBuyingPrice],
    [false, sell, input.previousPrice],
  ];
  for (const [isBuying, next, prev] of jumps) {
    if (!prev || prev <= 0 || next <= 0 || next === prev) continue;
    const ratio = next / prev;
    if (ratio >= JUMP_RATIO || ratio <= 1 / JUMP_RATIO) {
      const times = Math.round((ratio >= 1 ? ratio : 1 / ratio) * 10) / 10;
      const up = ratio >= 1;
      const key: MessageKey = isBuying
        ? up
          ? "inventory.buyJumpUp"
          : "inventory.buyJumpDown"
        : up
        ? "inventory.sellJumpUp"
        : "inventory.sellJumpDown";
      issues.push({
        code: "PRICE_UNUSUAL_CHANGE",
        message: t(key, { from: formatEtb(prev), to: formatEtb(next), times: formatEtb(times) }),
      });
    }
  }

  if (buy > 0 && sell / buy > MAX_MARKUP_RATIO) {
    issues.push({
      code: "PRICE_UNUSUAL_MARGIN",
      message: t("inventory.priceUnusualMargin", { sell: formatEtb(sell), max: MAX_MARKUP_RATIO, buy: formatEtb(buy) }),
    });
  }

  return issues;
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
  const t = useT();
  const { price, buyingPrice, previousPrice, previousBuyingPrice } = input;
  const key = `${price}|${buyingPrice}`;
  const localIssues = useMemo(
    () => checkPricesT(t, { price, buyingPrice, previousPrice, previousBuyingPrice }),
    [t, price, buyingPrice, previousPrice, previousBuyingPrice],
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
      setServerIssue({ key, issue: { code: e.code as PriceIssue["code"], message: e.message || t("inventory.checkPrices") } });
      setConfirmedKey(null);
      return true;
    },
  };
}

/** Live "profit per unit" line under the price fields. */
export function MarginHint({ price, buyingPrice }: { price: number; buyingPrice: number }) {
  const t = useT();
  const m = marginOf(price, buyingPrice);
  if (!m) return null;
  const tone = m.profit <= 0 ? "text-rose-700" : m.marginPct < 10 ? "text-amber-700" : "text-emerald-700";
  return (
    <p className={`text-[11px] font-medium ${tone}`}>
      {m.profit === 0
        ? t("inventory.sellsAtCost")
        : m.profit < 0
        ? t("inventory.lossPerUnit", { amount: formatEtb(-m.profit) })
        : t("inventory.profitPerUnit", { amount: formatEtb(m.profit), margin: m.marginPct })}
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
  const t = useT();
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
        {t("inventory.checkPrices")}
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
        {belowCost ? t("inventory.confirmBelowCost") : t("inventory.confirmPrices")}
      </label>
    </div>
  );
}
