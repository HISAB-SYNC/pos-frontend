"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronDown,
  Coins,
  CreditCard,
  Crown,
  DollarSign,
  Download,
  HandCoins,
  Package,
  PieChart as PieChartIcon,
  Printer,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { getShopAnalytics } from "@/lib/api/app-data";

import type {
  AnalyticsPeriod,
  ShopAnalyticsReport,
} from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: "#10b981",
  BANK: "#3b82f6",
  TELEBIRR: "#8b5cf6",
};

export default function ReportsPage() {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [analytics, setAnalytics] = useState<ShopAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShopAnalytics(activeShopId, {
        period,
        startDate: period === "custom" && customStart ? customStart : undefined,
        endDate: period === "custom" && customEnd ? customEnd : undefined,
      });
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  }, [activeShopId, period, customStart, customEnd]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Payment Breakdown Chart Data (Cash, Bank, Telebirr)
  const paymentChartData = useMemo(() => {
    if (!analytics?.salesAnalytics.paymentMethodBreakdown) return [];
    const breakdown = analytics.salesAnalytics.paymentMethodBreakdown;
    const items: Array<{ name: string; value: number; color: string }> = [];

    if (breakdown.CASH?.totalAmount) {
      items.push({ name: "Cash", value: breakdown.CASH.totalAmount, color: PAYMENT_METHOD_COLORS.CASH });
    }
    if (breakdown.BANK?.totalAmount) {
      items.push({ name: "Bank", value: breakdown.BANK.totalAmount, color: PAYMENT_METHOD_COLORS.BANK });
    }
    if (breakdown.TELEBIRR?.totalAmount) {
      items.push({ name: "Telebirr", value: breakdown.TELEBIRR.totalAmount, color: PAYMENT_METHOD_COLORS.TELEBIRR });
    }
    return items;
  }, [analytics]);


  if (loading && !analytics) {
    return <LoadingState />;
  }

  const sales = analytics?.salesAnalytics;
  const products = analytics?.productAnalytics;
  const customers = analytics?.customerAnalytics;

  function handleExportReportCsv() {
    if (!analytics) return;
    const topProd = analytics.productAnalytics?.topSellingProducts || [];
    exportToCsv(`analytics-report-${period}`, topProd, [
      { header: "Top Product Name", key: "name" },
      { header: "Quantity Sold", key: "totalQuantitySold" },
      {
        header: "Revenue Generated (ETB)",
        formatter: (item) => (item.totalRevenue || 0).toFixed(2),
      },
      {
        header: "Period",
        formatter: () => period,
      },
      {
        header: "Total Store Revenue (ETB)",
        formatter: () => (analytics.salesAnalytics?.totalRevenue || 0).toFixed(2),
      },
      {
        header: "Total Transactions",
        formatter: () => analytics.salesAnalytics?.totalSalesCount || 0,
      },
    ]);

  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN"]}>
      <div className="space-y-6">


      {/* ================================================================= */}
      {/* 1. Header Toolbar & Period Toggle                                 */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <BarChart3 className="size-4" />
            </span>
            <h1 className="text-xl font-bold text-[#111827]">Shop Analytics &amp; Reports</h1>
          </div>
          <p className="text-xs text-[#6b7280]">
            Performance metrics, sales revenue trends, product leaderboards, and customer insights
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-sm">
            {[
              { id: "daily", label: "Today" },
              { id: "weekly", label: "Past 7 Days" },
              { id: "monthly", label: "Past 30 Days" },
              { id: "custom", label: "Custom" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id as AnalyticsPeriod)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  period === tab.id
                    ? "bg-[#111827] text-white shadow-sm"
                    : "text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportReportCsv}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
          >
            <Download className="size-3.5 text-[#6b7280]" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            <Printer className="size-3.5 text-[#6b7280]" />
            Print Report
          </button>
        </div>
      </div>


      {/* Custom Date Range Inputs */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-3.5 text-xs shadow-sm">
          <span className="font-semibold text-[#374151]">Custom Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 rounded-lg border border-[#e5e7eb] px-2 text-xs focus:border-[#2563eb] focus:outline-none"
            />
            <span className="text-[#9ca3af]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 rounded-lg border border-[#e5e7eb] px-2 text-xs focus:border-[#2563eb] focus:outline-none"
            />
            <button
              type="button"
              onClick={loadAnalytics}
              className="rounded-lg bg-[#111827] px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. KPI Summary Metric Cards                                       */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Total Revenue</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#111827]">
              {(sales?.totalRevenue || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-[#6b7280]">ETB</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#6b7280]">
            <span>Tax: {(sales?.totalTaxCollected || 0).toLocaleString()} ETB</span>
            <span className="text-emerald-600 font-medium">Completed Sales</span>
          </div>
        </div>

        {/* Total Completed Orders */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Total Sales Count</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#111827]">{sales?.totalSalesCount || 0}</span>
            <span className="text-xs text-[#6b7280]">Orders</span>
          </div>
          <div className="mt-2 text-[11px] text-[#6b7280]">
            Avg Order: {(sales?.averageOrderValue || 0).toLocaleString()} ETB / sale
          </div>
        </div>

        {/* Active Customer Spenders */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Customer Base</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#111827]">{customers?.totalCustomers || 0}</span>
            <span className="text-xs text-purple-600 font-medium">
              +{customers?.newCustomersInPeriod || 0} New
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#6b7280]">
            Catalog: {products?.totalProductsCount || 0} Active Products
          </div>
        </div>

        {/* Outstanding Customer Debt */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Outstanding Credit Debt</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <HandCoins className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#dc2626]">
              {(customers?.outstandingDebt.totalAmount || 0).toLocaleString()}
            </span>
            <span className="text-xs text-[#dc2626]">ETB</span>
          </div>
          <div className="mt-2 text-[11px] text-[#6b7280]">
            {customers?.outstandingDebt.count || 0} Open debtor accounts
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. Charts Row: Sales Revenue Trend & Payment Method Distribution  */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Sales Revenue Trend Chart */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Sales &amp; Revenue Trend</h2>
              <p className="text-xs text-[#6b7280]">Chronological sales performance over the selected period</p>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sales?.salesTrend || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickFormatter={(val) => `${val.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-bold text-[#111827]">Payment Methods Breakdown</h2>
          <p className="text-xs text-[#6b7280]">Distribution of completed sales by payment channel</p>

          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} ETB`, String(name)]}
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. Tables Row: Top Selling Products & Top Customers Leaderboards  */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Top Performing Products</h2>
              <p className="text-xs text-[#6b7280]">Highest quantity sold during this period</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-[#2563eb] hover:underline"
            >
              View Catalog
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
                <tr>
                  <th className="pb-2.5">Rank</th>
                  <th className="pb-2.5">Product</th>
                  <th className="pb-2.5">SKU</th>
                  <th className="pb-2.5 text-center">Qty Sold</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {products?.topSellingProducts && products.topSellingProducts.length > 0 ? (
                  products.topSellingProducts.map((p, idx) => (
                    <tr key={p.productId} className="hover:bg-[#f9fafb]">
                      <td className="py-2.5 font-bold text-[#6b7280]">#{idx + 1}</td>
                      <td className="py-2.5 font-bold text-[#111827]">{p.name}</td>
                      <td className="py-2.5 font-mono text-[#6b7280]">{p.sku}</td>
                      <td className="py-2.5 text-center font-bold text-[#2563eb]">
                        {p.totalQuantitySold} pcs
                      </td>
                      <td className="py-2.5 text-right font-bold text-[#111827]">
                        {p.totalRevenue.toLocaleString()} ETB
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[#9ca3af]">
                      No product sales recorded in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Spending Customers */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Top Customer Spenders</h2>
              <p className="text-xs text-[#6b7280]">Highest purchasing customers in this timeframe</p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-semibold text-[#2563eb] hover:underline"
            >
              All Customers
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
                <tr>
                  <th className="pb-2.5">Customer Name</th>
                  <th className="pb-2.5">Contact</th>
                  <th className="pb-2.5 text-center">Orders</th>
                  <th className="pb-2.5 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {customers?.topCustomers && customers.topCustomers.length > 0 ? (
                  customers.topCustomers.map((c) => (
                    <tr key={c.customerId} className="hover:bg-[#f9fafb]">
                      <td className="py-2.5 font-bold text-[#111827]">{c.name}</td>
                      <td className="py-2.5 text-[#6b7280]">{c.phone || c.email || "-"}</td>
                      <td className="py-2.5 text-center font-semibold text-[#374151]">
                        {c.salesCount}
                      </td>
                      <td className="py-2.5 text-right font-bold text-[#16a34a]">
                        {c.totalSpent.toLocaleString()} ETB
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-[#9ca3af]">
                      No customer transactions found in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}

