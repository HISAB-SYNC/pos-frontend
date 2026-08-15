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
/* Page                                                                  */
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

  return (
    <div className="relative space-y-5">
      {/* Notifications panel (floating) */}
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Row 1 – Sales Overview + Inventory Summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DashboardCard title="Sales Overview" className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <OverviewMetric label="Sales" value={metrics.salesOverview.sales} icon={ShoppingCart} tone="blue" />
            <OverviewMetric label="Revenue" value={metrics.salesOverview.revenue} icon={TrendingUp} tone="purple" />
            <OverviewMetric label="Profit" value={metrics.salesOverview.profit} icon={Wallet} tone="orange" />
            <OverviewMetric label="Cost" value={metrics.salesOverview.cost} icon={CircleDollarSign} tone="green" />
          </div>
        </DashboardCard>

        <DashboardCard title="Inventory Summary">
          <div className="grid gap-6">
            <OverviewMetric
              label="Quantity in Hand"
              value={metrics.inventorySummary.quantityInHand}
              icon={Package}
              tone="orange"
            />
            <OverviewMetric
              label="To be received"
              value={metrics.inventorySummary.toBeReceived}
              icon={Truck}
              tone="purple"
            />
          </div>
        </DashboardCard>
      </div>

      {/* Row 2 – Purchase Overview + Product Summary */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DashboardCard title="Purchase Overview" className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <OverviewMetric label="Purchase" value={metrics.purchaseOverview.purchase} icon={ShoppingBag} tone="blue" />
            <OverviewMetric label="Cost" value={metrics.purchaseOverview.cost} icon={CircleDollarSign} tone="green" />
            <OverviewMetric label="Cancel" value={metrics.purchaseOverview.cancel} icon={RotateCcw} tone="purple" />
            <OverviewMetric label="Return" value={metrics.purchaseOverview.return} icon={RotateCcw} tone="orange" />
          </div>
        </DashboardCard>

        <DashboardCard title="Product Summary">
          <div className="grid gap-6">
            <OverviewMetric
              label="Number of Suppliers"
              value={metrics.productSummary.suppliers}
              icon={Truck}
              tone="blue"
            />
            <OverviewMetric
              label="Number of Categories"
              value={metrics.productSummary.categories}
              icon={Tags}
              tone="purple"
            />
          </div>
        </DashboardCard>
      </div>

      {/* Row 3 – Charts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Sales & Purchase chart with Weekly selector */}
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#111827]">Sales &amp; Purchase</h2>
            <select className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#374151] shadow-sm focus:outline-none">
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>
          <SalesPurchaseChart data={metrics.salesAndPurchase} />
        </section>

        <DashboardCard title="Order Summary">
          <OrderSummaryChart data={metrics.orderSummary} />
        </DashboardCard>
      </div>

      {/* Row 4 – Tables */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Top Selling Stock */}
        <DashboardCard title="Top Selling Stock" action={<SeeAllLink href="/products" />}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Sold Quantity</th>
                  <th className="pb-3 font-medium">Remaining Quantity</th>
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
        <DashboardCard title="Low Quantity Stock" action={<SeeAllLink href="/inventory" />}>
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
