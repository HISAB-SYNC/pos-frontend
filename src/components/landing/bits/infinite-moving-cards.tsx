import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfiniteMovingCardsProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  /** Seconds for one full loop. */
  duration?: number;
  className?: string;
}

/**
 * Horizontally looping row that pauses on hover (after Aceternity's Infinite Moving Cards).
 * Pure CSS: the list is rendered twice and translated by half its width.
 */
export function InfiniteMovingCards<T>({
  items,
  renderItem,
  getKey,
  duration = 45,
  className,
}: InfiniteMovingCardsProps<T>) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]",
        className,
      )}
      style={{ "--marquee-duration": `${duration}s`, "--marquee-gap": "1.25rem" } as CSSProperties}
    >
      <ul className="flex w-max animate-marquee gap-5 py-1 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[...items, ...items].map((item, i) => (
          <li key={`${getKey(item)}-${i}`} aria-hidden={i >= items.length || undefined} className="shrink-0">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}
