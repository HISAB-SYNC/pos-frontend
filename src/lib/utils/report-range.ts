import type { MessageKey } from "@/lib/i18n/messages";

export type Preset = "TODAY" | "WEEK" | "MONTH" | "ALL" | "CUSTOM";

/** `labelKey` is a message key: render it with `t(p.labelKey)`. `label` is the English fallback. */
export const PRESETS: Array<{ id: Preset; label: string; labelKey: MessageKey }> = [
  { id: "TODAY", label: "Today", labelKey: "shared.today" },
  { id: "WEEK", label: "7 days", labelKey: "reports.period.week" },
  { id: "MONTH", label: "This month", labelKey: "reports.period.month" },
  { id: "ALL", label: "All time", labelKey: "reports.period.all" },
  { id: "CUSTOM", label: "Custom", labelKey: "reports.period.custom" },
];

type Translate = (key: MessageKey) => string;
type FormatDate = (value: Date) => string;

export type DateRange = { from?: string; to?: string };

export function localDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Plain local dates for the backend (it reads them as shop-local days). */
export function rangeFor(preset: Preset, customFrom: string, customTo: string): DateRange {
  const now = new Date();
  if (preset === "TODAY") return { from: localDate(now), to: localDate(now) };
  if (preset === "WEEK") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return { from: localDate(from), to: localDate(now) };
  }
  if (preset === "MONTH") return { from: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: localDate(now) };
  if (preset === "CUSTOM") return { from: customFrom || undefined, to: customTo || undefined };
  return {};
}

export function formatDay(value: string, formatDate?: FormatDate) {
  const date = new Date(`${value}T00:00:00`);
  if (formatDate) return formatDate(date);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Text for the selected period, e.g. "1 Nov 2026 – Today". Pass `t` and
 * `formatDate` (from useT / useFormat) to get it in the interface language.
 */
export function periodLabel(preset: Preset, range: DateRange, t?: Translate, formatDate?: FormatDate) {
  const tr = (key: MessageKey, fallback: string) => (t ? t(key) : fallback);
  if (preset === "ALL" || (!range.from && !range.to)) return tr("reports.period.all", "All time");
  if (range.from && range.to && range.from === range.to) return formatDay(range.from, formatDate);
  return `${range.from ? formatDay(range.from, formatDate) : tr("reports.period.start", "Start")} – ${
    range.to ? formatDay(range.to, formatDate) : tr("shared.today", "Today")
  }`;
}
