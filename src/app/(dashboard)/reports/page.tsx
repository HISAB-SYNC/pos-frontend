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
import { getProducts } from "@/lib/api/shops";

import type {
  AnalyticsPeriod,
  Product,
  ShopAnalyticsReport,
  TopSellingProductStat,
} from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: "#10b981",
  CARD: "#3b82f6",
  BANK: "#0ea5e9",
  MOBILE: "#5B4FE9",
  TELEBIRR: "#8b5cf6",
};

export default function ReportsPage() {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [period, setPeriod] = useState<AnalyticsPeriod>("weekly");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [analytics, setAnalytics] = useState<ShopAnalyticsReport | null>(null);
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, prods] = await Promise.all([
        getShopAnalytics(activeShopId, {
          period,
          startDate: period === "custom" && customStart ? customStart : undefined,
          endDate: period === "custom" && customEnd ? customEnd : undefined,
        }),
        getProducts(activeShopId).catch(() => []),
      ]);
      setAnalytics(analyticsData);
      if (Array.isArray(prods)) {
        setProductsCatalog(prods);
      }
    } catch (err) {
      console.warn("Could not load analytics reports:", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [activeShopId, period, customStart, customEnd]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getProductSellingPrice = useCallback(
    (item: TopSellingProductStat): number => {
      const rawItemSelling = item.sellingPrice ?? item.price;
      if (rawItemSelling !== undefined && rawItemSelling !== null && !isNaN(Number(rawItemSelling))) {
        return Number(rawItemSelling);
      }
      const matched = productsCatalog.find(
        (p) =>
          p.id === item.productId ||
          p.sku === item.sku ||
          p.name?.toLowerCase() === item.name?.toLowerCase(),
      );
      if (matched?.price && !isNaN(parseFloat(matched.price))) {
        return parseFloat(matched.price);
      }
      if (item.totalQuantitySold > 0 && item.totalRevenue > 0) {
        return parseFloat((item.totalRevenue / item.totalQuantitySold).toFixed(2));
      }
      return 0;
    },
    [productsCatalog],
  );

  const getProductBuyingPrice = useCallback(
    (item: TopSellingProductStat): number => {
      const rawItem = item.buyingPrice ?? item.costPrice;
      if (rawItem !== undefined && rawItem !== null && !isNaN(Number(rawItem))) {
        return Number(rawItem);
      }
      const matched = productsCatalog.find(
        (p) =>
          p.id === item.productId ||
          p.sku === item.sku ||
          p.name?.toLowerCase() === item.name?.toLowerCase(),
      );
      const rawCatalog =
        matched?.buyingPrice ??
        (matched?.attributes as any)?.buyingPrice ??
        (matched?.attributes as any)?.costPrice;
      if (rawCatalog !== undefined && rawCatalog !== null && !isNaN(Number(rawCatalog))) {
        return Number(rawCatalog);
      }
      const sp = getProductSellingPrice(item);
      return sp > 0 ? parseFloat((sp * 0.7).toFixed(2)) : 0;
    },
    [productsCatalog, getProductSellingPrice],
  );

  // Payment Breakdown Chart Data (Cash, Card/Bank, Mobile/Telebirr)
  const paymentChartData = useMemo(() => {
    if (!analytics?.salesAnalytics.paymentMethodBreakdown) return [];
    const breakdown = analytics.salesAnalytics.paymentMethodBreakdown;
    const items: Array<{ name: string; value: number; color: string }> = [];

    const cashAmount = breakdown.CASH?.totalAmount || 0;
    const cardOrBankAmount = (breakdown.CARD?.totalAmount || 0) || (breakdown.BANK?.totalAmount || 0);
    const mobileOrTelebirrAmount = (breakdown.MOBILE?.totalAmount || 0) || (breakdown.TELEBIRR?.totalAmount || 0);

    if (cashAmount > 0) {
      items.push({ name: "Cash", value: cashAmount, color: PAYMENT_METHOD_COLORS.CASH });
    }
    if (cardOrBankAmount > 0) {
      items.push({ name: "Card / Bank", value: cardOrBankAmount, color: PAYMENT_METHOD_COLORS.CARD });
    }
    if (mobileOrTelebirrAmount > 0) {
      items.push({ name: "Mobile / Telebirr", value: mobileOrTelebirrAmount, color: PAYMENT_METHOD_COLORS.MOBILE });
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

    if (topProd.length === 0) {
      exportToCsv(`analytics-report-${period}`, [
        {
          period: period.toUpperCase(),
          dateRange: analytics.dateRange
            ? `${analytics.dateRange.startDate.slice(0, 10)} to ${analytics.dateRange.endDate.slice(0, 10)}`
            : period,
          totalStoreRevenue: (analytics.salesAnalytics?.totalRevenue || 0).toFixed(2),
          totalTransactions: analytics.salesAnalytics?.totalSalesCount || 0,
          averageOrderValue: (analytics.salesAnalytics?.averageOrderValue || 0).toFixed(2),
        },
      ], [
        { header: "Period", key: "period" },
        { header: "Date Range", key: "dateRange" },
        { header: "Total Store Revenue (ETB)", key: "totalStoreRevenue" },
        { header: "Total Transactions", key: "totalTransactions" },
        { header: "Average Order Value (ETB)", key: "averageOrderValue" },
      ]);
      return;
    }

    exportToCsv(`analytics-report-${period}`, topProd, [
      { header: "Product Name", key: "name" },
      { header: "SKU", key: "sku" },
      {
        header: "Buying Price (ETB)",
        formatter: (item) => getProductBuyingPrice(item).toFixed(2),
      },
      {
        header: "Selling Price (ETB)",
        formatter: (item) => getProductSellingPrice(item).toFixed(2),
      },
      { header: "Quantity Sold", key: "totalQuantitySold" },
      {
        header: "Total Buying Cost (ETB)",
        formatter: (item) => {
          const bp = getProductBuyingPrice(item);
          return (bp * item.totalQuantitySold).toFixed(2);
        },
      },
      {
        header: "Revenue Generated (ETB)",
        formatter: (item) => (item.totalRevenue || 0).toFixed(2),
      },
      {
        header: "Gross Profit (ETB)",
        formatter: (item) => {
          const bp = getProductBuyingPrice(item);
          const rev = item.totalRevenue || 0;
          const cost = bp * item.totalQuantitySold;
          return (rev - cost).toFixed(2);
        },
      },
      {
        header: "Profit Margin %",
        formatter: (item) => {
          const bp = getProductBuyingPrice(item);
          const rev = item.totalRevenue || 0;
          const cost = bp * item.totalQuantitySold;
          if (rev > 0) {
            return `${(((rev - cost) / rev) * 100).toFixed(1)}%`;
          }
          return "0.0%";
        },
      },
      {
        header: "Period",
        formatter: () => period.toUpperCase(),
      },
      {
        header: "Date Range",
        formatter: () =>
          analytics.dateRange
            ? `${analytics.dateRange.startDate.slice(0, 10)} to ${analytics.dateRange.endDate.slice(0, 10)}`
            : period,
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
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-900 text-indigo-400 shadow-2xs">
                <BarChart3 className="size-4 text-indigo-400" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Shop Analytics &amp; Reports</h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Performance metrics, sales revenue trends, product leaderboards, and customer insights.
            </p>
          </div>

          {/* Period Selector Tabs & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1 text-xs font-medium max-w-full overflow-x-auto scrollbar-none">
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
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    period === tab.id
                      ? "bg-slate-900 text-white shadow-2xs font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportReportCsv}
              className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 active:scale-95"
            >
              <Download className="size-3.5 text-zinc-500" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 active:scale-95"
            >
              <Printer className="size-3.5 text-zinc-500" />
              Print Report
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {period === "custom" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 text-xs shadow-2xs">
            <span className="font-semibold text-zinc-700">Custom Date Range:</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-hidden"
              />
              <span className="text-zinc-400 font-mono text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={loadAnalytics}
                className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
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
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Store Revenue</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/15">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {(sales?.totalRevenue || 0).toLocaleString()}
              </span>
              <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Tax: {(sales?.totalTaxCollected || 0).toLocaleString()} ETB</span>
              <span className="font-medium text-emerald-600">Completed Sales</span>
            </div>
          </div>

          {/* Total Completed Orders */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Transactions</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200">
                <ShoppingCart className="size-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {sales?.totalSalesCount || 0}
              </span>
              <span className="font-sans text-xs font-normal text-zinc-500">Orders</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Avg Order: <span className="font-mono font-medium text-zinc-700">{(sales?.averageOrderValue || 0).toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Active Customer Spenders */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Customer Base</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {customers?.totalCustomers || 0}
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                +{customers?.newCustomersInPeriod || 0} New
              </span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Catalog: <span className="font-mono font-medium text-zinc-700">{products?.totalProductsCount || 0}</span> Active Products
            </div>
          </div>

          {/* Outstanding Customer Debt */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Outstanding Credit Debt</span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-500/15">
                <HandCoins className="size-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
                {(customers?.outstandingDebt.totalAmount || 0).toLocaleString()}
              </span>
              <span className="font-sans text-xs font-semibold text-rose-600">ETB</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              <span className="font-mono font-medium text-zinc-700">{customers?.outstandingDebt.count || 0}</span> open debtor accounts
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. Charts Row: Sales Revenue Trend & Payment Method Distribution  */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Sales Revenue Trend Chart */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-900">Sales &amp; Revenue Trend</h2>
                <p className="text-xs text-zinc-500">Chronological sales performance over the selected period</p>
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
                      <stop offset="5%" stopColor="#5B4FE9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#5B4FE9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#e4e4e7" }}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#e4e4e7" }}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickFormatter={(val) => `${val.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, "Revenue"]}
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #1E293B",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#5B4FE9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-1">
            <h2 className="text-sm font-bold tracking-tight text-zinc-900">Payment Breakdown</h2>
            <p className="text-xs text-zinc-500">Distribution of sales by payment channel</p>

            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={46}
                    outerRadius={72}
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
                      backgroundColor: "#0F172A",
                      border: "1px solid #1E293B",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
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
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-900">Top Performing Products</h2>
                <p className="text-xs text-zinc-500">Highest quantity sold during this period</p>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                View Catalog &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200/80 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="pb-2.5">Rank</th>
                    <th className="pb-2.5">Product</th>
                    <th className="pb-2.5">SKU</th>
                    <th className="pb-2.5 text-right">Buying Price</th>
                    <th className="pb-2.5 text-right">Selling Price</th>
                    <th className="pb-2.5 text-center">Qty Sold</th>
                    <th className="pb-2.5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products?.topSellingProducts && products.topSellingProducts.length > 0 ? (
                    products.topSellingProducts.map((p, idx) => {
                      const bp = getProductBuyingPrice(p);
                      const sp = getProductSellingPrice(p);
                      return (
                        <tr key={p.productId} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-zinc-400">#{idx + 1}</td>
                          <td className="py-2.5 font-semibold text-zinc-900">{p.name}</td>
                          <td className="py-2.5 font-mono text-zinc-500">{p.sku || "—"}</td>
                          <td className="py-2.5 text-right font-mono text-zinc-600 tabular-nums">
                            {bp > 0 ? `${bp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : "—"}
                          </td>
                          <td className="py-2.5 text-right font-mono font-medium text-zinc-900 tabular-nums">
                            {sp > 0 ? `${sp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : "—"}
                          </td>
                          <td className="py-2.5 text-center font-mono font-bold text-zinc-900 tabular-nums">
                            {p.totalQuantitySold} pcs
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-zinc-900 tabular-nums">
                            {p.totalRevenue.toLocaleString()} ETB
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-zinc-400">
                        No product sales recorded in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Spending Customers */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-900">Top Customer Spenders</h2>
                <p className="text-xs text-zinc-500">Highest purchasing customers in this timeframe</p>
              </div>
              <Link
                href="/customers"
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                All Customers &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200/80 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="pb-2.5">Customer Name</th>
                    <th className="pb-2.5">Contact</th>
                    <th className="pb-2.5 text-center">Orders</th>
                    <th className="pb-2.5 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {customers?.topCustomers && customers.topCustomers.length > 0 ? (
                    customers.topCustomers.map((c) => (
                      <tr key={c.customerId} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 font-semibold text-zinc-900">{c.name}</td>
                        <td className="py-2.5 font-mono text-zinc-500">{c.phone || c.email || "—"}</td>
                        <td className="py-2.5 text-center font-mono font-semibold text-zinc-700 tabular-nums">
                          {c.salesCount}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700 tabular-nums">
                          {c.totalSpent.toLocaleString()} ETB
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-zinc-400">
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

