"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Store } from "lucide-react";
import Link from "next/link";
import { getOwnerShops } from "@/lib/api/shops";
import type { Shop } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

export function ShopSwitcher() {
  const user = useAuthStore((state) => state.user);
  const { activeShopId, activeShopName, setActiveShop } = useShopStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load shops owned by or accessible to user
  useEffect(() => {
    let isMounted = true;
    async function loadShops() {
      if (!user) return;

      // Non-owners (e.g. ADMIN, SALES) do not have permission for GET /shops
      if (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "SYSTEM_ADMIN") {
        if (user.shopId && !activeShopId) {
          setActiveShop({ id: user.shopId, name: activeShopName || "My Store" });
        }
        return;
      }

      try {
        setLoading(true);
        const data = await getOwnerShops();
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setShops(list);
          // If no active shop is currently selected, pick the first one
          if (list.length > 0 && !activeShopId) {
            setActiveShop({ id: list[0].id, name: list[0].name });
          }
        }
      } catch (err) {
        console.warn("Could not load shops from backend, using fallback store data:", err);
        try {
          const { mockGetOwnerShops } = await import("@/lib/mock/shops.mock");
          const fallback = await mockGetOwnerShops();
          if (isMounted && fallback.length > 0) {
            setShops(fallback);
            if (!activeShopId) {
              setActiveShop({ id: fallback[0].id, name: fallback[0].name });
            }
          }
        } catch {
          // Ignore fallback error
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShops();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, user?.shopId]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentShop = shops.find((s) => s.id === activeShopId);
  const displayName = currentShop?.name || activeShopName || "Select Shop";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition-all hover:border-zinc-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#c0e763]/50"
        aria-expanded={isOpen}
      >
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#82a823] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#82a823]" />
        </span>
        <Store className="size-3.5 text-zinc-500 shrink-0" />
        <span className="max-w-[140px] truncate text-left font-medium text-zinc-900 sm:max-w-[180px]">
          {displayName}
        </span>
        <ChevronDown className="size-3.5 text-zinc-400 shrink-0 transition-transform duration-150" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Switch Store
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-zinc-400">
                Loading stores...
              </div>
            ) : shops.length === 0 ? (
              <div className="px-3 py-3 text-xs text-zinc-500 text-center">
                No stores registered yet.
              </div>
            ) : (
              shops.map((shop) => {
                const isSelected = shop.id === activeShopId;
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => {
                      setActiveShop({ id: shop.id, name: shop.name });
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-[#c0e763]/25 font-semibold text-zinc-950"
                        : "text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900"
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate font-medium">{shop.name}</div>
                      {shop.businessType && (
                        <div className="text-[10px] text-zinc-400 capitalize truncate">
                          {shop.businessType} {shop.currency ? `• ${shop.currency}` : ""}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-[#608018]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-1 border-t border-zinc-100 pt-1">
            <Link
              href="/onboarding"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Plus className="size-3.5 text-zinc-400" />
              <span>Register New Store</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
