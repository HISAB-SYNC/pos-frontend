import { BarChart3, Package, ShoppingCart, TrendingUp } from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[620px] lg:h-[480px]">
      <div className="absolute left-0 top-8 z-10 w-[78%] rotate-[-2deg] rounded-xl border border-black/5 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="mb-3 flex items-center gap-2 border-b border-black/5 pb-3">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <div className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <div className="space-y-2 rounded-lg bg-[#f8fafc] p-2">
            {["Dashboard", "Products", "Reports", "Suppliers"].map((item) => (
              <div
                key={item}
                className={`rounded-md px-2 py-1.5 text-[10px] ${item === "Dashboard" ? "bg-[#111827] text-white" : "text-[#64748b]"}`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <MetricCard icon={<TrendingUp className="size-3" />} label="Sales Overview" />
              <MetricCard icon={<Package className="size-3" />} label="Inventory Summary" />
            </div>
            <div className="rounded-lg border border-black/5 p-2">
              <div className="mb-2 text-[10px] font-medium text-[#334155]">Sales & Purchase</div>
              <div className="flex h-16 items-end gap-1.5">
                {[40, 65, 45, 80, 55, 70, 48].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-sm bg-[#111827]/80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-0 z-20 w-[72%] rotate-[1.5deg] rounded-xl border border-black/5 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
        <div className="mb-3 text-xs font-semibold text-[#111827]">Purchase Overview</div>
        <div className="mb-3 h-24 rounded-lg bg-gradient-to-t from-[#eef2f7] to-white">
          <svg viewBox="0 0 200 80" className="h-full w-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#111827"
              strokeWidth="2"
              points="0,60 30,45 60,55 90,25 120,35 150,15 180,30 200,20"
            />
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label="Orders" value="1,284" />
          <MiniStat label="Revenue" value="ETB 84K" />
        </div>
      </div>

      <div className="absolute bottom-0 left-[12%] z-30 w-[68%] rounded-xl border border-black/5 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#111827]">Low Quantity Stock</span>
          <BarChart3 className="size-4 text-[#64748b]" />
        </div>
        <div className="space-y-2">
          {[
            { name: "Whole Milk 1L", stock: "2 left" },
            { name: "Brown Bread", stock: "4 left" },
            { name: "Cooking Oil 1L", stock: "3 left" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-md bg-[#f8fafc] px-2 py-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded bg-[#eef2f7]">
                  <ShoppingCart className="size-3 text-[#64748b]" />
                </div>
                <span className="text-[10px] text-[#334155]">{item.name}</span>
              </div>
              <span className="text-[10px] font-medium text-red-500">{item.stock}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-black/5 p-2">
      <div className="mb-1 flex items-center gap-1 text-[#64748b]">{icon}</div>
      <div className="text-[10px] font-medium text-[#334155]">{label}</div>
      <div className="mt-2 h-8 rounded bg-[#f1f5f9]">
        <div className="h-full w-2/3 rounded bg-[#111827]/15" />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8fafc] p-2">
      <div className="text-[9px] text-[#64748b]">{label}</div>
      <div className="text-[11px] font-semibold text-[#111827]">{value}</div>
    </div>
  );
}
