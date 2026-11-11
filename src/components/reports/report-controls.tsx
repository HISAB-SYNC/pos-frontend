"use client";

import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

import { PRESETS, type Preset } from "@/lib/utils/report-range";

export const reportInputClass =
  "h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

/** Today / 7 days / This month / All time / Custom, with the two date inputs for Custom. */
export function PeriodBar({
  preset,
  onPreset,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
}: {
  preset: Preset;
  onPreset: (preset: Preset) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              preset === p.id
                ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === "CUSTOM" && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <input type="date" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} className={reportInputClass} />
          <span>to</span>
          <input type="date" value={customTo} onChange={(e) => onCustomTo(e.target.value)} className={reportInputClass} />
        </div>
      )}
    </div>
  );
}

/** Table header cell that toggles sorting and shows an asc/desc arrow. */
export function ReportSortTh<K extends string>({
  label,
  field,
  activeField,
  desc,
  onSort,
  right,
  className = "px-4 py-2.5",
}: {
  label: string;
  field: K;
  activeField: K;
  desc: boolean;
  onSort: (field: K) => void;
  right?: boolean;
  className?: string;
}) {
  return (
    <th className={`${className} ${right ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`flex w-full items-center gap-1.5 font-bold hover:text-zinc-900 ${right ? "justify-end" : ""}`}
      >
        <span>{label}</span>
        {activeField === field ? (
          desc ? <ChevronDown className="size-3 text-zinc-900" /> : <ChevronUp className="size-3 text-zinc-900" />
        ) : (
          <ArrowUpDown className="size-3 text-zinc-400" />
        )}
      </button>
    </th>
  );
}
