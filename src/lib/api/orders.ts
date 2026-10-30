import { isMockApiEnabled } from "@/config/env";
import { getMockStore } from "@/lib/mock/store";
import type { OrderRecord, OverallOrdersSummary, Sale } from "./types";

import { getSales } from "./sales";

export async function getReportMetrics(_shopId: string) {
  const { seedReportMetrics } = await import("@/lib/mock/data");
  return seedReportMetrics;
}

export async function getOverallOrdersSummary(shopId: string): Promise<OverallOrdersSummary> {
  const orders = await getOrders(shopId);
  const totalCount = orders.length;
  const received = orders.filter((o) => o.status === "Confirmed");
  const returned = orders.filter((o) => o.status === "Returned");
  const onTheWay = orders.filter((o) => o.status === "Out for delivery" || o.status === "Delayed");
  const rev = received.reduce((sum, o) => sum + (typeof o.price === "number" ? o.price : parseFloat(String(o.price)) || 0), 0);
  const retCost = returned.reduce((sum, o) => sum + (typeof o.price === "number" ? o.price : parseFloat(String(o.price)) || 0), 0);

  return {
    totalOrders: { count: totalCount, subtext: "Total recorded" },
    totalReceived: { count: received.length, subtext: "Delivered & Confirmed", revenue: rev, revenueLabel: "Revenue" },
    totalReturned: { count: returned.length, subtext: "Returns", cost: retCost, costLabel: "Cost" },
    onTheWay: { orderedCount: onTheWay.length, orderedLabel: "Pending/In-Transit", cost: 0, costLabel: "Cost" },
  };
}



export async function getOrders(shopId: string): Promise<OrderRecord[]> {
  const store = getMockStore();

  if (isMockApiEnabled()) {
    return store.orders.filter((o) => !o.shopId || o.shopId === shopId);
  }

  const sales = await getSales(shopId);
  if (Array.isArray(sales) && sales.length > 0) {
    return sales.map((s) => {
      const firstItem = s.items?.[0];
      const productName = firstItem?.product?.name || firstItem?.productId || "POS Sale Order";
      const totalQty = s.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 1;

      return {
        id: s.id,
        shopId: s.shopId || shopId,
        orderId: s.id.slice(0, 8),
        product: s.items && s.items.length > 1 ? `${productName} +${s.items.length - 1} items` : productName,
        price: parseFloat(s.totalAmount || "0"),
        quantity: `${totalQty} Packet`,
        expectedDelivery: new Date(s.createdAt).toLocaleDateString("en-GB"),
        status: s.status === "COMPLETED" ? "Confirmed" : s.status === "CANCELLED" ? "Returned" : "Out for delivery",
      };
    });
  }
  return [];
}

export async function createOrder(
  _shopId: string,
  input: {
    product: string;
    price: number | string;
    quantity: string;
    orderId?: string;
    expectedDelivery: string;
    status: "Delayed" | "Confirmed" | "Returned" | "Out for delivery";
  },
) {
  const newOrder: OrderRecord = {
    id: `ord-${Date.now()}`,
    product: input.product,
    price: input.price,
    quantity: input.quantity,
    orderId: input.orderId || `${Math.floor(1000 + Math.random() * 9000)}`,
    expectedDelivery: input.expectedDelivery,
    status: input.status,
  };

  const { seedOrders } = await import("@/lib/mock/data");
  seedOrders.unshift(newOrder);
  return newOrder;
}

export async function updateOrder(
  _shopId: string,
  orderId: string,
  input: Partial<Omit<OrderRecord, "id">>,
) {
  const { seedOrders } = await import("@/lib/mock/data");
  const ord = seedOrders.find((o) => o.id === orderId || o.orderId === orderId);
  if (ord) {
    Object.assign(ord, input);
    return ord;
  }
  return { id: orderId, ...input } as OrderRecord;
}

export async function deleteOrder(_shopId: string, orderId: string) {
  const { seedOrders } = await import("@/lib/mock/data");
  const idx = seedOrders.findIndex((o) => o.id === orderId || o.orderId === orderId);
  if (idx !== -1) {
    seedOrders.splice(idx, 1);
  }
  return { success: true, message: "Order deleted" };
}
