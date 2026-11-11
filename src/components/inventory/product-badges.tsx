"use client";

/* ------------------------------------------------------------------ */
/* Product Avatar: Professional Monogram Badge                         */
/* ------------------------------------------------------------------ */
export function ProductAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SK";

  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-zinc-100 font-mono text-[11px] font-bold text-zinc-700 shadow-2xs ${
        className ?? ""
      }`}
    >
      {initials}
    </div>
  );
}

export function ExpiryBadge({ expiryDate }: { expiryDate?: string | null }) {
  if (!expiryDate) {
    return <span className="text-zinc-400 text-[11px]">—</span>;
  }
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) {
    return <span className="text-zinc-400 text-[11px]">—</span>;
  }

  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
        <span className="size-1.5 rounded-full bg-red-600" />
        Expired
      </span>
    );
  }

  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-600" />
        {diffDays}d left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
      {exp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Status badge                                                       */
/* ------------------------------------------------------------------ */
export function StatusBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  const isOutOfStock = quantity <= 0;
  const isLow = quantity <= threshold;

  if (isOutOfStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="size-1.5 rounded-full bg-rose-600" />
        Out of Stock
      </span>
    );
  }

  if (isLow) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="size-1.5 rounded-full bg-amber-600" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      Available
    </span>
  );
}
