"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Landmark,
  Package,
  Plus,
  RotateCcw,
  ShoppingCart,
  Smartphone,
  Store,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DashboardCard, SeeAllLink } from "@/components/dashboard/dashboard-widgets";
import { SalesPurchaseChart } from "@/components/dashboard/sales-purchase-chart";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { getDashboardMetrics } from "@/lib/api/app-data";
import type { DashboardMetrics } from "@/lib/mock/data";
import { MOCK_IDS } from "@/lib/mock/data";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";
import { useUiStore } from "@/stores/ui-store";

/* ------------------------------------------------------------------ */
/* Low Quantity Stock item with Restock action                        */
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-white p-2.5 transition-colors hover:border-zinc-200 hover:bg-zinc-50/60">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-200/90 bg-zinc-50 font-mono text-[11px] font-bold text-zinc-700">
          {initials || "SK"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-zinc-900">{name}</p>
          <p className="font-mono text-[11px] text-zinc-500 tabular-nums">
            {remainingQuantity} {unit} in stock
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
          <span className="size-1.5 rounded-full bg-rose-600" />
          Low
        </span>
        <Link
          href={`/inventory?search=${encodeURIComponent(name)}`}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
        >
          Restock
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "weekly">("monthly");

  useEffect(() => {
    if (authUser?.role === "SALES") {
      router.replace("/pos");
    }
  }, [authUser, router]);

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

  if (authUser?.role === "SALES") return <LoadingState />;

  if (isLoading || !metrics) return <LoadingState />;

  const totalCollected =
    metrics.paymentBreakdown.cash +
    metrics.paymentBreakdown.bank +
    metrics.paymentBreakdown.telebirr;

  const cashPct = totalCollected > 0 ? Math.round((metrics.paymentBreakdown.cash / totalCollected) * 100) : 0;
  const bankPct = totalCollected > 0 ? Math.round((metrics.paymentBreakdown.bank / totalCollected) * 100) : 0;
  const telebirrPct = totalCollected > 0 ? Math.round((metrics.paymentBreakdown.telebirr / totalCollected) * 100) : 0;

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="relative space-y-6">

        {/* ================================================================= */}
        {/* Quick Operational Actions Bar                                     */}
        {/* ================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-950">Store Overview</h1>
            <p className="text-xs text-zinc-500">Live commercial performance, cash flow, and inventory status</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#5B4FE9] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#4D40D9] transition-all"
            >
              <Store className="size-3.5" />
              <span>New Sale (POS)</span>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/90 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-950 transition-all"
            >
              <Plus className="size-3.5 text-zinc-500" />
              <span>Add Product</span>
            </Link>
            <Link
              href="/debts"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/90 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-950 transition-all"
            >
              <HandCoins className="size-3.5 text-zinc-500" />
              <span>Debt Ledger</span>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 1. Core Financial & Business KPI Cards                            */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Sales Revenue */}
          <div className="group relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Total Revenue
              </span>
              <div className="flex size-8 items-center justify-center rounded-md bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
                <TrendingUp className="size-4" />
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

          {/* Net Profit Card (High-Contrast Slate-900 Accent) */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xs transition-all hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Net Profit (Live)
              </span>
              <div className="flex size-8 items-center justify-center rounded-md bg-slate-800 text-indigo-300">
                <Wallet className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
                {metrics.netProfit.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-400">ETB</span>
              </div>
              <p className="mt-2 truncate text-[11px] text-slate-400">
                COGS: {metrics.cogs.toLocaleString()} ETB · Exp: {metrics.totalExpenses.toLocaleString()} ETB
              </p>
            </div>
          </div>

          {/* Outstanding Customer Debt */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Outstanding Debt
              </span>
              <div className="flex size-8 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-400/30">
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
          <div className="relative overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Today&apos;s Revenue
              </span>
              <div className="flex size-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-800">
                <ShoppingCart className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {metrics.todayRevenue.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-zinc-500">ETB</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
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
          <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs xl:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-900">Sales &amp; Revenue Trends</h2>
                <p className="text-xs text-zinc-500">
                  {trendPeriod === "monthly"
                    ? "Monthly commercial volume overview"
                    : "Daily commercial volume (Last 7 Days)"}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setTrendPeriod("monthly")}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                    trendPeriod === "monthly"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setTrendPeriod("weekly")}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                    trendPeriod === "weekly"
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Last 7 Days
                </button>
              </div>
            </div>
            <SalesPurchaseChart
              data={
                trendPeriod === "weekly" && metrics.trendWeekly && metrics.trendWeekly.length > 0
                  ? metrics.trendWeekly
                  : metrics.salesAndPurchase
              }
            />
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
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[#5B4FE9] transition-all duration-500"
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
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-slate-800 transition-all duration-500"
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
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
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
                  <tr className="border-b border-zinc-100 text-zinc-400">
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Product</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Sold</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Stock</th>
                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px] text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {metrics.topSellingStock.map((item) => (
                    <tr
                      key={item.name}
                      className="transition-colors hover:bg-zinc-50/80"
                    >
                      <td className="py-2.5 font-medium text-zinc-900">{item.name}</td>
                      <td className="py-2.5 font-mono font-medium text-zinc-600 tabular-nums">{item.soldQuantity}</td>
                      <td className="py-2.5 font-mono font-medium text-zinc-600 tabular-nums">{item.remainingQuantity}</td>
                      <td className="py-2.5 font-mono font-bold text-zinc-900 tabular-nums text-right">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          {/* Low Quantity Stock */}
          <DashboardCard
            title="Low Inventory Warnings"
            action={
              metrics.lowQuantityStock.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-700">
                  <span className="size-1.5 rounded-full bg-rose-600" />
                  {metrics.lowQuantityStock.length} items
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Healthy
                </span>
              )
            }
          >
            {metrics.lowQuantityStock.length > 0 ? (
              <div className="space-y-1.5">
                {metrics.lowQuantityStock.map((item) => (
                  <LowStockItem
                    key={item.id}
                    name={item.name}
                    remainingQuantity={item.remainingQuantity}
                    unit={item.unit}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-7 text-center">
                <div className="mb-2.5 flex size-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70">
                  <CheckCircle2 className="size-4" />
                </div>
                <p className="text-xs font-bold text-zinc-900">No Low Inventory Warnings</p>
                <p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-zinc-500">
                  All catalog items are currently above minimum replenishment levels.
                </p>
                <Link
                  href="/inventory"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-950 hover:underline"
                >
                  <span>View Full Inventory</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </RouteGuard>
  );
}
