"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardMetrics } from "@/lib/mock/data";

type SalesPurchaseChartProps = {
  data: DashboardMetrics["salesAndPurchase"];
};

export function SalesPurchaseChart({ data }: SalesPurchaseChartProps) {
  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%" barGap={4}>
          <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "#f9fafb" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : String(value), undefined]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "#6b7280" }}
          />
          <Bar dataKey="purchase" name="Purchase" fill="#818cf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sales" name="Sales" fill="#34d399" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
