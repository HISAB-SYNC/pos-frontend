export type Preset = "TODAY" | "WEEK" | "MONTH" | "ALL" | "CUSTOM";

export const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "TODAY", label: "Today" },
  { id: "WEEK", label: "7 days" },
  { id: "MONTH", label: "This month" },
  { id: "ALL", label: "All time" },
  { id: "CUSTOM", label: "Custom" },
];

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

export function formatDay(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function periodLabel(preset: Preset, range: DateRange) {
  if (preset === "ALL" || (!range.from && !range.to)) return "All time";
  if (range.from && range.to && range.from === range.to) return formatDay(range.from);
  return `${range.from ? formatDay(range.from) : "Start"} – ${range.to ? formatDay(range.to) : "Today"}`;
}
