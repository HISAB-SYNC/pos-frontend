/**
 * Unit of Measurement (UoM) and Fractional Quantity Helpers
 */

export const STANDARD_UNITS = [
  { value: "pcs", label: "Pieces (pcs)", isFractional: false },
  { value: "box", label: "Box", isFractional: false },
  { value: "pack", label: "Pack", isFractional: false },
  { value: "bottle", label: "Bottle", isFractional: false },
  { value: "kg", label: "Kilograms (kg)", isFractional: true },
  { value: "g", label: "Grams (g)", isFractional: true },
  { value: "m", label: "Meters (m)", isFractional: true },
  { value: "cm", label: "Centimeters (cm)", isFractional: true },
  { value: "L", label: "Liters (L)", isFractional: true },
  { value: "ml", label: "Milliliters (ml)", isFractional: true },
] as const;

const KNOWN_FRACTIONAL_UNITS = new Set([
  "kg",
  "kgs",
  "kilogram",
  "kilograms",
  "g",
  "gram",
  "grams",
  "m",
  "meter",
  "meters",
  "metre",
  "metres",
  "cm",
  "l",
  "liter",
  "liters",
  "litre",
  "litres",
  "ml",
  "yard",
  "yards",
  "foot",
  "feet",
]);

/**
 * Checks whether a given measurement unit supports fractional / decimal quantities.
 */
export function isFractionalUnit(unit?: string | null): boolean {
  if (!unit) return false;
  const clean = unit.trim().toLowerCase();
  return KNOWN_FRACTIONAL_UNITS.has(clean);
}

/**
 * Formats a quantity cleanly:
 * - Whole numbers: "2"
 * - Decimals up to 3 places without trailing zeros: "1.5", "1.25", "0.625"
 * Optional unit append: "1.5 kg"
 */
export function formatQuantity(quantity: number | string | null | undefined, unit?: string | null): string {
  const num = typeof quantity === "string" ? parseFloat(quantity) : (quantity ?? 0);
  if (isNaN(num)) return `0${unit ? ` ${unit}` : ""}`;

  // Round to max 3 decimal places to avoid IEEE floating-point noise
  const cleanNum = Math.round(num * 1000) / 1000;

  // Format with dynamic decimal places (no useless trailing .000)
  const formatted = cleanNum % 1 === 0 ? cleanNum.toFixed(0) : cleanNum.toString();

  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Calculates line total with safe 2-decimal financial rounding.
 * If a customTotal is supplied (price override), returns that custom total.
 */
export function calculateLineTotal(quantity: number, unitPrice: number, customTotal?: number | null): number {
  if (customTotal !== undefined && customTotal !== null && !isNaN(customTotal) && customTotal >= 0) {
    return Math.round(customTotal * 100) / 100;
  }
  return Math.round(quantity * unitPrice * 100) / 100;
}

/**
 * Calculates quantity from a target Birr budget (Reverse calculation).
 * e.g., Target 50 ETB at 80 ETB/kg = 0.625 kg.
 * Rounded to max 3 decimal places.
 */
export function calculateQuantityFromAmount(targetAmount: number, unitPrice: number): number {
  if (unitPrice <= 0 || targetAmount <= 0) return 0;
  const rawQty = targetAmount / unitPrice;
  return Math.round(rawQty * 1000) / 1000;
}

/**
 * Quick fraction buttons configuration for measured products.
 */
export const FRACTION_PRESETS = [
  { label: "¼ (0.25)", value: 0.25 },
  { label: "½ (0.50)", value: 0.5 },
  { label: "¾ (0.75)", value: 0.75 },
  { label: "1.0", value: 1.0 },
  { label: "1.5", value: 1.5 },
  { label: "2.0", value: 2.0 },
  { label: "5.0", value: 5.0 },
];
