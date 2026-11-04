/**
 * Price-entry checks, the same rules the backend enforces, so forms can warn
 * before saving (and products added offline are checked too):
 * - PRICE_BELOW_COST: buying price is not lower than the selling price.
 * - PRICE_UNUSUAL_CHANGE: a price jumps to 3× or more (or a third or less) of
 *   its current value, e.g. 3,940 typed instead of 54.
 * - PRICE_UNUSUAL_MARGIN: selling price is more than 5× the buying price,
 *   often a missing decimal point.
 */

export const JUMP_RATIO = 3;
export const MAX_MARKUP_RATIO = 5;

export type PriceIssueCode = "PRICE_BELOW_COST" | "PRICE_UNUSUAL_CHANGE" | "PRICE_UNUSUAL_MARGIN";
export type PriceIssue = { code: PriceIssueCode; message: string };

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function checkPrices(input: {
  price: number;
  buyingPrice: number;
  /** Current prices of an existing product (omit for new products). */
  previousPrice?: number | null;
  previousBuyingPrice?: number | null;
}): PriceIssue[] {
  const { price: sell, buyingPrice: buy } = input;
  const issues: PriceIssue[] = [];

  if (sell > 0 && buy > 0 && buy >= sell) {
    issues.push({
      code: "PRICE_BELOW_COST",
      message: `Buying price (${fmt(buy)} ETB) is not lower than the selling price (${fmt(sell)} ETB). Each sale would lose ${fmt(Math.round((buy - sell) * 100) / 100)} ETB.`,
    });
  }

  const jumps: Array<[string, number, number | null | undefined]> = [
    ["Buying price", buy, input.previousBuyingPrice],
    ["Selling price", sell, input.previousPrice],
  ];
  for (const [label, next, prev] of jumps) {
    if (!prev || prev <= 0 || next <= 0 || next === prev) continue;
    const ratio = next / prev;
    if (ratio >= JUMP_RATIO || ratio <= 1 / JUMP_RATIO) {
      const times = Math.round((ratio >= 1 ? ratio : 1 / ratio) * 10) / 10;
      issues.push({
        code: "PRICE_UNUSUAL_CHANGE",
        message: `${label} changes from ${fmt(prev)} to ${fmt(next)} ETB (${fmt(times)}× ${ratio >= 1 ? "higher" : "lower"}). Is that a typo?`,
      });
    }
  }

  if (buy > 0 && sell / buy > MAX_MARKUP_RATIO) {
    issues.push({
      code: "PRICE_UNUSUAL_MARGIN",
      message: `Selling price (${fmt(sell)} ETB) is more than ${MAX_MARKUP_RATIO}× the buying price (${fmt(buy)} ETB). Is a decimal point missing?`,
    });
  }

  return issues;
}

/** Confirm flags the backend expects for the issues the user accepted. */
export function confirmFlags(issues: Array<{ code: string }>) {
  return {
    confirmBelowCost: issues.some((i) => i.code === "PRICE_BELOW_COST") || undefined,
    confirmUnusualPrice: issues.some((i) => i.code !== "PRICE_BELOW_COST") || undefined,
  };
}

/** Profit per unit and margin %, or null when either price is missing. */
export function marginOf(price: number, buyingPrice: number) {
  if (!(price > 0) || !(buyingPrice > 0)) return null;
  const profit = Math.round((price - buyingPrice) * 100) / 100;
  return { profit, marginPct: Math.round((profit / price) * 1000) / 10 };
}
