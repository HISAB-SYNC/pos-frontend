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
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} barCategoryGap="28%" barGap={6}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white shadow-xl">
                    <p className="font-semibold text-slate-300">{label}</p>
                    <div className="mt-1.5 space-y-1">
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-slate-400">{entry.name}:</span>
                          </span>
                          <span className="font-bold text-white tabular-nums">
                            {Number(entry.value).toLocaleString()} ETB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 10, color: "#64748b" }}
          />
          <Bar
            dataKey="sales"
            name="Sales Revenue"
            fill="#5B4FE9"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="purchase"
            name="Cost / Purchase"
            fill="#94a3b8"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
