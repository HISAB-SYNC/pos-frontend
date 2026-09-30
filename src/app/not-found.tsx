"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  FileQuestion,
  HandCoins,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
} from "lucide-react";
import { AndalusLogo } from "@/components/shared/andalus-mark";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/60 p-4 text-zinc-900 selection:bg-[#5B4FE9]/20 selection:text-zinc-950">
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Logo / Brand */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white px-4 py-2 shadow-2xs">
            <AndalusLogo className="size-6" />
            <span className="text-sm font-bold tracking-tight text-zinc-900">
              Andalus POS
            </span>
          </div>
        </div>

        {/* 404 Card */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10 shadow-xl shadow-zinc-200/50">
          {/* Visual Icon Badge */}
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/30">
            <FileQuestion className="size-8 text-[#5B4FE9]" />
          </div>

          <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs font-bold text-zinc-700">
            ERROR 404
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Page Not Found
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
            The page you are looking for doesn't exist, was moved, or has been removed.
          </p>

          {/* Primary Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 active:scale-95"
            >
              <ArrowLeft className="size-3.5" />
              Go Back
            </button>
            <Link
              href="/dashboard"
              className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
            >
              <LayoutDashboard className="size-3.5 text-indigo-400" />
              Back to Dashboard
            </Link>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="mt-8 border-t border-zinc-100 pt-6">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Quick Shortcuts
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
              <Link
                href="/pos"
                className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70 transition-all"
              >
                <Store className="size-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">POS Checkout</span>
              </Link>
              <Link
                href="/products"
                className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70 transition-all"
              >
                <Package className="size-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">Products</span>
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70 transition-all"
              >
                <ShoppingCart className="size-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">Sales History</span>
              </Link>
              <Link
                href="/debts"
                className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70 transition-all"
              >
                <HandCoins className="size-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">Debts / Credit</span>
              </Link>
              <Link
                href="/notifications"
                className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70 transition-all col-span-2 sm:col-span-2"
              >
                <Compass className="size-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">Notifications Center</span>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11px] text-zinc-400">
          Need assistance? Contact your system administrator or support team.
        </p>
      </div>
    </div>
  );
}
