"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Landmark,
  Package,
  RotateCcw,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { DashboardCard, SeeAllLink } from "@/components/dashboard/dashboard-widgets";
import { SalesPurchaseChart } from "@/components/dashboard/sales-purchase-chart";
import { LoadingState } from "@/components/shared/loading-state";
import { getDashboardMetrics } from "@/lib/api/app-data";
import type { DashboardMetrics } from "@/lib/mock/data";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";
import { useUiStore } from "@/stores/ui-store";

/* ------------------------------------------------------------------ */
/* Notifications panel                                                */
/* ------------------------------------------------------------------ */
type Notification = { id: string; message: string; type: "alert" | "warning" | "info" };

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "1", message: "Low stock alert for Sun Chips (< 5 items)", type: "warning" },
  { id: "2", message: "Customer debt overdue notice (2 accounts)", type: "alert" },
  { id: "3", message: "Daily cash register reconciliation pending", type: "info" },
];

function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-4 top-14 z-50 w-84 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-black/10 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Notifications</h3>
        <span className="rounded-full bg-[#f3fad9] px-2 py-0.5 text-[10px] font-bold text-zinc-900">
          {items.length} new
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((n) => (
          <div
            key={n.id}
            className="flex items-start justify-between gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2.5 transition-colors hover:bg-zinc-100/70"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-2 rounded-full bg-[#c0e763] ring-2 ring-[#c0e763]/30" />
              <span className="text-xs font-medium leading-snug text-zinc-800">{n.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== n.id))}
              className="text-zinc-400 transition-colors hover:text-zinc-700"
              title="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-4 text-center text-xs text-zinc-400">All notifications cleared</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Low Quantity Stock item without emoji                              */
/* ------------------------------------------------------------------ */
function LowStockItem({
  name,
  remainingQuantity,
  unit,
}: {
  name: string;
  remainingQuantity: number;
  unit: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl p-2.5 transition-colors hover:bg-zinc-50">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 font-mono text-xs font-bold text-zinc-800 shadow-xs">
          {initials || "IT"}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900">{name}</p>
          <p className="font-mono text-[11px] text-zinc-500 tabular-nums">
            {remainingQuantity} {unit} remaining
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
        <span className="size-1.5 rounded-full bg-red-600" />
        Low
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const notifOpen = useUiStore((state) => state.notificationPanelOpen);
  const setNotifOpen = useUiStore((state) => state.setNotificationPanelOpen);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const data = await getDashboardMetrics(shopId);
        if (mounted) setMetrics(data);
      } catch (err) {
        console.warn("Could not load dashboard metrics:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [shopId]);

  if (isLoading || !metrics) return <LoadingState />;

  const totalCollected =
    metrics.paymentBreakdown.cash +
    metrics.paymentBreakdown.bank +
    metrics.paymentBreakdown.telebirr;

  const cashPct = totalCollected > 0 ? Math.round((metrics.paymentBreakdown.cash / totalCollected) * 100) : 0;
  const bankPct = totalCollected > 0 ? Math.round((metrics.paymentBreakdown.bank / totalCollected) * 100) : 0;
  const telebirrPct = totalCollected > 0 ? Math.round((metrics.paymentBreakdown.telebirr / totalCollected) * 100) : 0;

  return (
    <div className="relative space-y-6">
      {/* Notifications panel (floating) */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* ================================================================= */}
      {/* 1. Core Financial & Business KPI Cards                            */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Sales Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Total Revenue
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#f3fad9] text-zinc-950 ring-1 ring-[#c0e763]/60">
              <TrendingUp className="size-4 text-zinc-900" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.salesOverview.revenue.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-800">
                {metrics.salesOverview.sales} sales
              </span>
              <span>completed</span>
            </div>
          </div>
        </div>

        {/* Net Profit Card (High-Contrast Obsidian Pro Accent) */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0c1017] p-5 shadow-md shadow-black/10 transition-all hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Net Profit (Live)
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-[#c0e763]">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight text-[#c0e763] tabular-nums">
              {metrics.netProfit.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-400">ETB</span>
            </div>
            <p className="mt-2 truncate text-[11px] text-zinc-400">
              COGS: {metrics.cogs.toLocaleString()} ETB · Exp: {metrics.totalExpenses.toLocaleString()} ETB
            </p>
          </div>
        </div>

        {/* Outstanding Customer Debt */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Outstanding Debt
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-400/30">
              <CircleDollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight text-amber-900 tabular-nums">
              {metrics.outstandingDebt.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-800">
                {metrics.debtorsCount} accounts
              </span>
              <Link
                href="/debts"
                className="inline-flex items-center gap-1 font-semibold text-zinc-900 hover:underline"
              >
                <span>Ledger</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Today&apos;s Revenue
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {metrics.todayRevenue.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="inline-flex items-center rounded-md bg-[#f3fad9] px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-900">
                {metrics.todaySalesCount} sales today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. Middle Row: Sales & Purchase Chart + Payment Breakdown         */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Sales & Purchase Trend Chart */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-zinc-900">Sales &amp; Revenue Trends</h2>
              <p className="text-xs text-zinc-500">Monthly commercial volume overview</p>
            </div>
            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
              Current Year
            </span>
          </div>
          <SalesPurchaseChart data={metrics.salesAndPurchase} />
        </section>

        {/* Payment Method Breakdown (Cash, Bank, Telebirr) */}
        <DashboardCard title="Payment Method Breakdown">
          <div className="space-y-4 pt-1">
            <p className="text-xs text-zinc-500">
              Collections split by payment channel:
            </p>

            {/* Cash */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-zinc-700">
                  <Banknote className="size-4 text-emerald-600" />
                  <span>Cash</span>
                </span>
                <span className="font-mono font-bold text-zinc-900 tabular-nums">
                  {metrics.paymentBreakdown.cash.toLocaleString()} ETB{" "}
                  <span className="font-sans text-[11px] font-normal text-zinc-400">({cashPct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-[#c0e763] transition-all duration-500"
                  style={{ width: `${cashPct}%` }}
                />
              </div>
            </div>

            {/* Bank */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-zinc-700">
                  <Landmark className="size-4 text-blue-600" />
                  <span>Bank Transfer</span>
                </span>
                <span className="font-mono font-bold text-zinc-900 tabular-nums">
                  {metrics.paymentBreakdown.bank.toLocaleString()} ETB{" "}
                  <span className="font-sans text-[11px] font-normal text-zinc-400">({bankPct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all duration-500"
                  style={{ width: `${bankPct}%` }}
                />
              </div>
            </div>

            {/* Telebirr */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-zinc-700">
                  <Smartphone className="size-4 text-amber-600" />
                  <span>Telebirr</span>
                </span>
                <span className="font-mono font-bold text-zinc-900 tabular-nums">
                  {metrics.paymentBreakdown.telebirr.toLocaleString()} ETB{" "}
                  <span className="font-sans text-[11px] font-normal text-zinc-400">({telebirrPct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${telebirrPct}%` }}
                />
              </div>
            </div>

            {/* Total collected footer */}
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
              <span className="font-medium text-zinc-500">Total Tendered:</span>
              <span className="font-mono font-bold text-zinc-900 tabular-nums">
                {totalCollected.toLocaleString()} ETB
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ================================================================= */}
      {/* 3. Bottom Row: Top Selling Stock & Low Quantity Stock Alerts     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Top Selling Stock */}
        <DashboardCard title="Top Selling Products" action={<SeeAllLink href="/products" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400">
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Product</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Sold</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Stock</th>
                  <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {metrics.topSellingStock.map((item) => (
                  <tr
                    key={item.name}
                    className="transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="py-3 font-semibold text-zinc-900">{item.name}</td>
                    <td className="py-3 font-mono font-medium text-zinc-600 tabular-nums">{item.soldQuantity}</td>
                    <td className="py-3 font-mono font-medium text-zinc-600 tabular-nums">{item.remainingQuantity}</td>
                    <td className="py-3 font-mono font-bold text-zinc-900 tabular-nums">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Low Quantity Stock */}
        <DashboardCard title="Low Inventory Warnings" action={<SeeAllLink href="/inventory" />}>
          <div className="space-y-1">
            {metrics.lowQuantityStock.map((item) => (
              <LowStockItem
                key={item.id}
                name={item.name}
                remainingQuantity={item.remainingQuantity}
                unit={item.unit}
              />
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
