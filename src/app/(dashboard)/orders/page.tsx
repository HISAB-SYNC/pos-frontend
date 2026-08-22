"use client";

import { Download, Filter, Plus, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createOrder, getOrders, getOverallOrdersSummary } from "@/lib/api/app-data";
import type { OrderRecord, OverallOrdersSummary } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* New Order Modal Dialog                                              */
/* ------------------------------------------------------------------ */
function AddOrderModal({
  open,
  onClose,
  onCreated,
  shopId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
}) {
  const [form, setForm] = useState({
    product: "",
    price: "",
    quantity: "",
    orderId: "",
    expectedDelivery: "",
    status: "Confirmed" as "Delayed" | "Confirmed" | "Returned" | "Out for delivery",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product.trim()) return;

    setIsSubmitting(true);
    try {
      await createOrder(shopId, {
        product: form.product.trim(),
        price: form.price ? Number(form.price) : "—",
        quantity: form.quantity.trim() || "1 Packets",
        orderId: form.orderId.trim(),
        expectedDelivery: form.expectedDelivery.trim() || new Date().toLocaleDateString("en-GB"),
        status: form.status,
      });
      onCreated();
      onClose();
      setForm({
        product: "",
        price: "",
        quantity: "",
        orderId: "",
        expectedDelivery: "",
        status: "Confirmed",
      });
    } catch (err) {
      console.error(err);
      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">New Order</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Product Name</label>
            <input
              name="product"
              value={form.product}
              onChange={handleChange}
              required
              placeholder="e.g. Coca Cola"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Price (ETB)</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 75"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Quantity</label>
              <input
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g. 43 Packets"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Order ID</label>
              <input
                name="orderId"
                value={form.orderId}
                onChange={handleChange}
                placeholder="e.g. 7535"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#374151]">Expected Delivery</label>
              <input
                name="expectedDelivery"
                value={form.expectedDelivery}
                onChange={handleChange}
                placeholder="e.g. 11/12/22"
                className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#374151]">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Delayed">Delayed</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#111827] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1f2937] disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Orders Page Component                                          */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 9;

export default function OrdersPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [summary, setSummary] = useState<OverallOrdersSummary | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, ords] = await Promise.all([
        getOverallOrdersSummary(shopId),
        getOrders(shopId),
      ]);
      setSummary(sum);
      setOrders(ords);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentOrders = useMemo(
    () => orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [orders, page],
  );

  function getStatusColor(status: OrderRecord["status"]) {
    switch (status) {
      case "Delayed":
        return "text-[#f59e0b]";
      case "Confirmed":
        return "text-[#2563eb]";
      case "Out for delivery":
        return "text-[#16a34a]";
      case "Returned":
      default:
        return "text-[#6b7280]";
    }
  }

  return (
    <>
      <AddOrderModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <div className="space-y-4">
        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP CARD: Overall Orders                                         */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-[#111827]">Overall Orders</h2>

          {summary && (
            <div className="grid grid-cols-1 divide-y divide-[#f3f4f6] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {/* Group 1: Total Orders */}
              <div className="px-3 py-2 first:pl-0">
                <p className="text-xs font-semibold text-[#2563eb]">Total Orders</p>
                <p className="mt-2 text-xl font-bold text-[#111827]">{summary.totalOrders.count}</p>
                <p className="mt-1 text-[11px] text-[#9ca3af]">{summary.totalOrders.subtext}</p>
              </div>

              {/* Group 2: Total Received */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-[#f59e0b]">Total Received</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalReceived.count}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalReceived.subtext}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalReceived.revenue.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalReceived.revenueLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 3: Total Returned */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-[#8b5cf6]">Total Returned</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalReturned.count}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalReturned.subtext}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.totalReturned.cost.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">
                      {summary.totalReturned.costLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 4: On the way */}
              <div className="px-4 py-2 last:pr-0">
                <p className="text-xs font-semibold text-[#f87171]">On the way</p>
                <div className="mt-2 flex items-center gap-6">
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.onTheWay.orderedCount}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">{summary.onTheWay.orderedLabel}</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#111827]">
                      {summary.onTheWay.cost.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[#9ca3af]">{summary.onTheWay.costLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. BOTTOM CARD: Orders Table                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
            <h1 className="text-lg font-semibold text-[#111827]">Orders</h1>

            <div className="flex items-center gap-2.5">
              {/* Download button */}
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
              >
                Download
              </button>

              {/* Filters button */}
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
              >
                <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
                Filters
              </button>

              {/* Order button */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
              >
                Order
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                  <th className="px-6 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium">Price(ETB)</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Expected Delivery</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#9ca3af]">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="px-6 py-3.5 font-medium text-[#111827]">{order.product}</td>
                      <td className="px-4 py-3.5 text-[#374151]">
                        {typeof order.price === "number" ? order.price.toLocaleString() : order.price}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151]">{order.quantity}</td>
                      <td className="px-4 py-3.5 text-[#374151]">{order.orderId}</td>
                      <td className="px-4 py-3.5 text-[#374151]">{order.expectedDelivery}</td>
                      <td className="px-6 py-3.5">
                        <span className={`font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-xs text-[#6b7280]">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
