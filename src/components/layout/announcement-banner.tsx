"use client";

import { ArrowRight, Megaphone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useAuthStore } from "@/stores/auth-store";

/**
 * Temporary, dismissible announcement shown under the header.
 * To announce something new: change `id` (so everyone sees it again) and the text.
 * It disappears on its own after `until`.
 */
const ANNOUNCEMENT = {
  id: "products-merged-into-inventory",
  until: "2027-01-31",
  title: "Products have moved to Inventory",
  message:
    "The Products tab is gone. Add, edit and organise products (and categories) from the Inventory tab, next to your stock.",
  linkLabel: "Go to Inventory",
  href: "/inventory",
};

const STORAGE_KEY = `announcement-dismissed:${ANNOUNCEMENT.id}`;
const CHANGE_EVENT = "announcement-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Hidden once dismissed or after the end date. */
function isDismissed() {
  if (new Date(`${ANNOUNCEMENT.until}T23:59:59`).getTime() < Date.now()) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AnnouncementBanner() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  // Server render and first paint treat it as dismissed, so it never flashes.
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);

  const isPlatformAdmin = role === "SUPER_ADMIN" || role === "SYSTEM_ADMIN" || pathname.startsWith("/admin");
  // POS keeps a fixed-height layout, so the banner stays off that screen.
  const hidden = dismissed || isPlatformAdmin || pathname.startsWith("/pos");
  if (hidden) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage blocked: it just comes back next visit */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const onTarget = pathname.startsWith(ANNOUNCEMENT.href);

  return (
    <div className="border-b border-indigo-200/70 bg-indigo-50 px-3.5 py-2.5 sm:px-5 lg:px-6" role="status">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
          <Megaphone className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 text-xs sm:flex sm:items-center sm:gap-2">
          <p className="font-bold text-zinc-900">{ANNOUNCEMENT.title}</p>
          <p className="text-zinc-600">{ANNOUNCEMENT.message}</p>
        </div>
        {!onTarget && (
          <Link
            href={ANNOUNCEMENT.href}
            className="hidden shrink-0 items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 sm:inline-flex"
          >
            {ANNOUNCEMENT.linkLabel}
            <ArrowRight className="size-3" />
          </Link>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-md p-1 text-zinc-500 hover:bg-indigo-100 hover:text-zinc-900"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
