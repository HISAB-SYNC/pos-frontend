import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";

export type EntryKind = "in" | "out" | "moved";

const STYLES: Record<EntryKind, { circle: string; Icon: typeof ArrowDownLeft }> = {
  in: { circle: "bg-emerald-50 text-emerald-600 ring-emerald-200/70", Icon: ArrowDownLeft },
  out: { circle: "bg-rose-50 text-rose-600 ring-rose-200/70", Icon: ArrowUpRight },
  moved: { circle: "bg-indigo-50 text-[#5B4FE9] ring-indigo-200/70", Icon: ArrowLeftRight },
};

/**
 * Round icon that says at a glance what happened to the money:
 * arrow down-left (green) = money came in, arrow up-right (red) = money went
 * out, two arrows (indigo) = moved between your own accounts.
 */
export function EntryIcon({ kind, className = "size-9" }: { kind: EntryKind; className?: string }) {
  const { circle, Icon } = STYLES[kind];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ring-1 ${circle} ${className}`} aria-hidden>
      <Icon className="size-[45%]" strokeWidth={2.5} />
    </span>
  );
}
