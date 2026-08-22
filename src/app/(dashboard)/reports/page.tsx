"use client";

import { Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LoadingState } from "@/components/shared/loading-state";
import { getReportMetrics } from "@/lib/api/app-data";
import type { ReportMetrics } from "@/lib/api/app-data";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Custom Chart Tooltip (Matching Screenshot)                         */
/* ------------------------------------------------------------------ */
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const revenueItem = payload.find((p: any) => p.dataKey === "revenue");
    const val = revenueItem?.value || payload[0]?.value || 0;

    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-5 py-3 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        <p className="text-[11px] font-normal text-[#9ca3af]">This Month</p>
        <p className="my-0.5 text-base font-extrabold text-[#111827]">
          {Number(val).toLocaleString()}
        </p>
        <p className="text-[11px] font-normal text-[#9ca3af]">{label}</p>
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Profit & Revenue Chart Component                                   */
/* ------------------------------------------------------------------ */
function ProfitRevenueChart({ data }: { data: ReportMetrics["profitAndRevenue"] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[280px] w-full animate-pulse rounded-xl bg-slate-50" />;
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradProf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fdba74" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#fdba74" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="0" />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            dy={10}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            domain={[20000, 80000]}
            ticks={[20000, 40000, 60000, 80000]}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickFormatter={(val) => `${val.toLocaleString()}`}
          />

          <Tooltip
            content={<CustomChartTooltip />}
            cursor={{ stroke: "#3b82f6", strokeWidth: 1.5, strokeDasharray: "4 4" }}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 12, paddingTop: 18, color: "#6b7280" }}
            formatter={(value) => <span className="mx-2 text-xs text-[#6b7280]">{value}</span>}
          />

          {/* Revenue Curve */}
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#gradRev)"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#2563eb",
              stroke: "#ffffff",
              strokeWidth: 2.5,
            }}
          />

          {/* Profit Curve */}
          <Area
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="#fed7aa"
            strokeWidth={2.5}
            fill="url(#gradProf)"
            dot={false}
            activeDot={{
              r: 6,
              fill: "#f97316",
              stroke: "#ffffff",
              strokeWidth: 2.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Reports Page Component                                         */
/* ------------------------------------------------------------------ */
export default function ReportsPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<"Weekly" | "Monthly" | "Yearly">("Weekly");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReportMetrics(shopId);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading || !metrics) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP ROW: Overview (ETB) & Best selling category                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-base font-semibold text-[#111827]">Reports</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Overview (ETB) */}
          <div className="md:col-span-5 lg:col-span-5">
            <h2 className="mb-4 text-sm font-semibold text-[#111827]">Overview(ETB)</h2>
            <div className="grid grid-cols-3 gap-2">
              {/* Total Profit */}
              <div>
                <p className="text-lg font-bold text-[#111827]">
                  {metrics.overview.totalProfit.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#6b7280]">Total Profit</p>
              </div>

              {/* Revenue */}
              <div>
                <p className="text-lg font-bold text-[#f59e0b]">
                  {metrics.overview.revenue.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#f59e0b]">Revenue</p>
              </div>

              {/* Sales */}
              <div>
                <p className="text-lg font-bold text-[#8b5cf6]">
                  {metrics.overview.sales.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-[#8b5cf6]">Sales</p>
              </div>
            </div>
          </div>

          {/* Best selling category */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111827]">Best selling category</h2>
              <Link
                href="/products"
                className="text-xs font-medium text-[#2563eb] hover:underline"
              >
                See All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[#9ca3af]">
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Turn Over(ETB)</th>
                    <th className="pb-2 font-medium">Increase By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9fafb]">
                  {metrics.bestSellingCategories.map((item) => (
                    <tr key={item.category} className="transition-colors hover:bg-slate-50/60">
                      <td className="py-2.5 font-normal text-[#374151]">{item.category}</td>
                      <td className="py-2.5 font-medium text-[#111827]">
                        {item.turnOver.toLocaleString()}
                      </td>
                      <td className="py-2.5 font-medium text-[#16a34a]">{item.increaseBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MIDDLE ROW: Profit & Revenue Chart                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#111827]">Profit & Revenue</h2>

          {/* Time Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <Calendar className="size-3.5 text-[#6b7280]" />
              <span>{timeRange}</span>
              <ChevronDown className="size-3 text-[#9ca3af]" />
            </button>
          </div>
        </div>

        <ProfitRevenueChart data={metrics.profitAndRevenue} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. BOTTOM ROW: Best selling product Table                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">Best selling product</h2>
          <Link
            href="/products"
            className="text-xs font-medium text-[#2563eb] hover:underline"
          >
            See All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-[#f3f4f6] text-left text-[#9ca3af]">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Product ID</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Remaining Quantity</th>
                <th className="pb-3 font-medium">Turn Over(ETB)</th>
                <th className="pb-3 font-medium">Increase By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f9fafb]">
              {metrics.bestSellingProducts.map((item, idx) => (
                <tr key={`${item.name}-${idx}`} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="py-3 font-medium text-[#111827]">{item.name}</td>
                  <td className="py-3 text-[#6b7280]">{item.productId}</td>
                  <td className="py-3 text-[#6b7280]">{item.category}</td>
                  <td className="py-3 text-[#6b7280]">{item.remainingQuantity}</td>
                  <td className="py-3 font-medium text-[#111827]">
                    {item.turnOver.toLocaleString()}
                  </td>
                  <td className="py-3 font-medium text-[#16a34a]">{item.increaseBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
