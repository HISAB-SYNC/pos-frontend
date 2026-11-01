/**
 * Money helpers shared by the restock and supplier-payment forms and the KPI
 * cards. Amounts are ETB; results are rounded to the cent.
 */

/** Rounds to 2 decimals (cents), avoiding 0.1 + 0.2 style float noise. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Line total: quantity × unit price, rounded to the cent. */
export function lineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

/**
 * How much more a payment needs than the account shows. 0 when the account
 * covers it, or when the balance is unknown.
 */
export function shortfall(balance: number | null, amount: number): number {
  if (balance === null || amount <= balance) return 0;
  return roundMoney(amount - balance);
}

/**
 * The account's balance after paying `amount`, counting money added from
 * outside (`added`, e.g. the owner's own money covering a shortfall).
 */
export function balanceAfter(balance: number | null, amount: number, added = 0): number | null {
  if (balance === null) return null;
  return roundMoney(balance + added - amount);
}

/** Percent change from `previous` to `current`; null when there's nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!(previous > 0)) return null;
  return ((current - previous) / previous) * 100;
}

/** Sum of amounts, rounded to the cent. */
export function sumMoney(values: number[]): number {
  return roundMoney(values.reduce((total, v) => total + v, 0));
}
