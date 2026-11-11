"use client";

import { useEffect, useRef } from "react";

/**
 * Lets a mouse wheel scroll a horizontally overflowing row sideways.
 * Touchpads already send horizontal deltas, so those are left to the browser;
 * only mostly-vertical wheel gestures are converted, and only while the row can still scroll.
 */
export function useHorizontalWheel<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      if (!el || el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const atStart = el.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && event.deltaY > 0;
      if (atStart || atEnd) return; // let the page scroll once the row hits an edge

      event.preventDefault();
      el.scrollLeft += event.deltaY;
    }

    // Must be non-passive so preventDefault can stop the page from scrolling.
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return ref;
}
