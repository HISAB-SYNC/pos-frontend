"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardMetrics } from "@/lib/mock/data";

type SalesPurchaseChartProps = {
  data: DashboardMetrics["salesAndPurchase"];
};

const NET_PROFIT_GREEN = "#059669";
const NET_LOSS_RED = "#e11d48";

/** Dot colored by sign: green for profit, red for a loss. */
function NetProfitDot(props: { cx?: number; cy?: number; value?: number | null }) {
  const { cx, cy, value } = props;
  if (cx === undefined || cy === undefined || value === undefined || value === null) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill={value < 0 ? NET_LOSS_RED : NET_PROFIT_GREEN} stroke="#fff" strokeWidth={1.5} />;
}

export function SalesPurchaseChart({ data }: SalesPurchaseChartProps) {
  const showNetProfit = data.some((d) => d.netProfit !== undefined);

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} barCategoryGap="28%" barGap={6}>
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
              Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const point = payload[0]?.payload as SalesPurchaseChartProps["data"][number] | undefined;
                const rows: Array<{ name: string; value: number; color: string }> = [
                  { name: "Sales Revenue", value: point?.sales ?? 0, color: "#5B4FE9" },
                  { name: "Cost of goods", value: point?.purchase ?? 0, color: "#94a3b8" },
                ];
                if (showNetProfit && point) {
                  rows.push({ name: "Expenses", value: point.expenses ?? 0, color: "#f59e0b" });
                  rows.push({
                    name: "Net Profit",
                    value: point.netProfit ?? 0,
                    color: (point.netProfit ?? 0) < 0 ? NET_LOSS_RED : NET_PROFIT_GREEN,
                  });
                }
                return (
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white shadow-xl">
                    <p className="font-semibold text-slate-300">{label}</p>
                    <div className="mt-1.5 space-y-1">
                      {rows.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-400">{entry.name}:</span>
                          </span>
                          <span className="font-bold text-white tabular-nums">
                            {entry.value.toLocaleString()} ETB
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
            name="Cost of goods"
            fill="#94a3b8"
            radius={[3, 3, 0, 0]}
          />
          {showNetProfit && (
            <Line
              type="monotone"
              dataKey="netProfit"
              name="Net Profit"
              stroke={NET_PROFIT_GREEN}
              strokeWidth={2}
              dot={<NetProfitDot />}
              activeDot={{ r: 5 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
