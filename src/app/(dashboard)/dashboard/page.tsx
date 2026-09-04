"use client";

import {
  CircleDollarSign,
  Package,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Tags,
  TrendingUp,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useUiStore } from "@/stores/ui-store";

import { DashboardCard, OverviewMetric, SeeAllLink } from "@/components/dashboard/dashboard-widgets";
import { OrderSummaryChart } from "@/components/dashboard/order-summary-chart";
import { SalesPurchaseChart } from "@/components/dashboard/sales-purchase-chart";
import { LoadingState } from "@/components/shared/loading-state";
import { getDashboardMetrics } from "@/lib/api/app-data";
import type { DashboardMetrics } from "@/lib/mock/data";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Notifications panel                                                   */
/* ------------------------------------------------------------------ */

type Notification = { id: string; message: string };

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "1", message: "Low Sun Chips" },
  { id: "2", message: "Coca Cola Expiration" },
  { id: "3", message: "Debt Due Alert" },
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

  // Close on outside click
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
      className="absolute right-4 top-14 z-50 w-80 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-xl"
    >
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-red-400 text-red-400">
                <span className="text-xs font-bold leading-none">!</span>
              </div>
              <span className="text-sm font-medium text-[#111827]">{n.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== n.id))}
              className="text-[#9ca3af] transition-colors hover:text-[#374151]"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <a
          href="/notifications"
          className="mt-4 block text-center text-sm font-medium text-[#2563eb] hover:underline"
        >
          See All
        </a>
      )}
      {items.length === 0 && (
        <p className="mt-2 text-center text-sm text-[#9ca3af]">No new notifications</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Low Quantity Stock item                                               */
/* ------------------------------------------------------------------ */

const PRODUCT_EMOJIS: Record<string, string> = {
  "Sun Chips": "🍟",
  "Whole Milk 1L": "🥛",
  "Cooking Oil 1L": "🫙",
};

function LowStockItem({
  name,
  remainingQuantity,
  unit,
}: {
  name: string;
  remainingQuantity: number;
  unit: string;
}) {
  const emoji = PRODUCT_EMOJIS[name] ?? "📦";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl p-2 transition-colors hover:bg-[#f9fafb]">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-2xl shadow-sm">
          {emoji}
        </div>
        <div>
          <p className="font-semibold text-[#111827]">{name}</p>
          <p className="text-xs text-[#6b7280]">
            Remaining Quantity : {remainingQuantity} {unit}
          </p>
        </div>
      </div>
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
        Low
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page: Andalus POS Main Business Dashboard                           */
/* ------------------------------------------------------------------ */

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
    <div className="relative space-y-5">
      {/* Notifications panel (floating) */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* ================================================================= */}
      {/* 1. Core Financial & Business KPI Cards (4 Balanced Cards)        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Sales Revenue */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Total Revenue</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-[#111827]">
              {metrics.salesOverview.revenue.toLocaleString()} <span className="text-sm font-semibold text-[#6b7280]">ETB</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6b7280]">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
                {metrics.salesOverview.sales} Total Sales
              </span>
              <span>completed</span>
            </div>
          </div>
        </div>

        {/* Net Profit Card (Calculated: Revenue - COGS - Expenses) */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Net Profit</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">Live</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700 shadow-sm">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-700">
              {metrics.netProfit.toLocaleString()} <span className="text-sm font-semibold text-emerald-600">ETB</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Revenue - COGS ({metrics.cogs.toLocaleString()}) - Exp ({metrics.totalExpenses.toLocaleString()})
            </p>
          </div>
        </div>

        {/* Outstanding Customer Debt */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/40 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Outstanding Debt</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CircleDollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-red-600">
              {metrics.outstandingDebt.toLocaleString()} <span className="text-sm font-semibold text-[#6b7280]">ETB</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-[#6b7280]">
              <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                {metrics.debtorsCount} Customers
              </span>
              <a href="/debts" className="font-semibold text-blue-600 hover:underline">
                View Ledger →
              </a>
            </div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Today&apos;s Sales</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-[#111827]">
              {metrics.todayRevenue.toLocaleString()} <span className="text-sm font-semibold text-[#6b7280]">ETB</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6b7280]">
              <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 font-medium text-purple-700">
                {metrics.todaySalesCount} Sales Today
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
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Sales &amp; Purchase Trend</h2>
              <p className="text-xs text-[#6b7280]">Comparative monthly performance</p>
            </div>
            <select className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#374151] shadow-sm focus:outline-none">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Yearly</option>
            </select>
          </div>
          <SalesPurchaseChart data={metrics.salesAndPurchase} />
        </section>

        {/* Payment Method Breakdown (Cash, Bank, Telebirr) */}
        <DashboardCard title="Payment Method Breakdown">
          <div className="space-y-4 pt-1">
            <p className="text-xs text-[#6b7280]">
              Real transaction collections across simplified payment options:
            </p>

            {/* Cash */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#374151]">
                  <span>💵</span> Cash
                </span>
                <span className="font-bold text-[#111827]">
                  {metrics.paymentBreakdown.cash.toLocaleString()} ETB{" "}
                  <span className="text-[11px] font-normal text-[#6b7280]">({cashPct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${cashPct}%` }} />
              </div>
            </div>

            {/* Bank */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#374151]">
                  <span>🏦</span> Bank
                </span>
                <span className="font-bold text-[#111827]">
                  {metrics.paymentBreakdown.bank.toLocaleString()} ETB{" "}
                  <span className="text-[11px] font-normal text-[#6b7280]">({bankPct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${bankPct}%` }} />
              </div>
            </div>

            {/* Telebirr */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[#374151]">
                  <span>📱</span> Telebirr
                </span>
                <span className="font-bold text-[#111827]">
                  {metrics.paymentBreakdown.telebirr.toLocaleString()} ETB{" "}
                  <span className="text-[11px] font-normal text-[#6b7280]">({telebirrPct}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f4f6]">
                <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${telebirrPct}%` }} />
              </div>
            </div>

            {/* Total collected footer */}
            <div className="mt-4 flex items-center justify-between border-t border-[#f3f4f6] pt-3 text-xs">
              <span className="font-medium text-[#6b7280]">Total Collections:</span>
              <span className="font-bold text-[#111827]">{totalCollected.toLocaleString()} ETB</span>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ================================================================= */}
      {/* 3. Bottom Row: Top Selling Stock & Low Quantity Stock Alerts     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Top Selling Stock */}
        <DashboardCard title="Top Selling Stock" action={<SeeAllLink href="/products" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Sold Qty</th>
                  <th className="pb-3 font-medium">Remaining</th>
                  <th className="pb-3 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topSellingStock.map((item) => (
                  <tr
                    key={item.name}
                    className="border-b border-[#f3f4f6] transition-colors last:border-0 hover:bg-[#f9fafb]"
                  >
                    <td className="py-3 font-medium text-[#111827]">{item.name}</td>
                    <td className="py-3 text-[#374151]">{item.soldQuantity}</td>
                    <td className="py-3 text-[#374151]">{item.remainingQuantity}</td>
                    <td className="py-3 text-[#374151]">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Low Quantity Stock */}
        <DashboardCard title="Low Quantity Stock Alerts" action={<SeeAllLink href="/inventory" />}>
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

