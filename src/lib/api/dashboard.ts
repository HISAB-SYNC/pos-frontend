import { isMockApiEnabled } from "@/config/env";
import type { DashboardMetrics } from "@/lib/mock";
import { getMockStore } from "@/lib/mock/store";
import { apiRequest } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { BackendDashboardMetrics, BackendDashboardOverview, DashboardPeriod, Debt, Product, Sale } from "./types";

export async function getBackendDashboardMetrics(shopId: string) {
  if (isMockApiEnabled()) {
    return {
      todaysSales: { count: 12, totalAmount: 4500.5 },
      lowStockCount: 3,
      outstandingDebts: { count: 4, totalAmount: 1200.0 },
    } as BackendDashboardMetrics;
  }

  return apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId));
}

function resolveItemCostPrice(it: any, matchedProduct?: Product): number {
  const directItemCost = it?.costPrice ?? it?.buyingPrice ?? it?.product?.buyingPrice ?? it?.product?.costPrice;
  if (directItemCost !== undefined && directItemCost !== null && !isNaN(Number(directItemCost)) && Number(directItemCost) > 0) {
    return Number(directItemCost);
  }

  const prodCost = matchedProduct?.buyingPrice ?? (matchedProduct as any)?.costPrice;
  if (prodCost !== undefined && prodCost !== null && !isNaN(Number(prodCost)) && Number(prodCost) > 0) {
    return Number(prodCost);
  }

  const attrs = (matchedProduct?.attributes ?? {}) as Record<string, any>;
  const attrCost = attrs?.buyingPrice ?? attrs?.costPrice;
  if (attrCost !== undefined && attrCost !== null && !isNaN(Number(attrCost)) && Number(attrCost) > 0) {
    return Number(attrCost);
  }

  return 0;
}

function computeSaleCogs(s: Sale, products: Product[]): number {
  if (s.items && Array.isArray(s.items) && s.items.length > 0) {
    return s.items.reduce((sum: number, it: any) => {
      const prod = products.find(
        (p) =>
          p.id === it.productId ||
          (it.product?.id && p.id === it.product.id) ||
          (it.product?.sku && p.sku === it.product.sku) ||
          (it.product?.name && p.name?.toLowerCase() === it.product.name.toLowerCase()),
      );
      const costPrice = resolveItemCostPrice(it, prod);
      return sum + costPrice * (it.quantity || 1);
    }, 0);
  }

  const directSaleCost = (s as any)?.totalCost ?? (s as any)?.cogs ?? (s as any)?.cost;
  if (directSaleCost !== undefined && directSaleCost !== null && !isNaN(Number(directSaleCost)) && Number(directSaleCost) > 0) {
    return Number(directSaleCost);
  }

  return 0;
}

function localDateKey(d: Date, withDay: boolean) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  if (!withDay) return `${y}-${m}`;
  return `${y}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

function paymentLabel(method: string) {
  const m = (method || "CASH").toUpperCase();
  if (m === "BANK" || m === "BANK_TRANSFER" || m === "CARD") return "Bank";
  if (m === "TELEBIRR" || m === "MOBILE") return "Telebirr";
  return "Cash";
}

/** Builds dashboard metrics from the backend's server-side totals. */
function metricsFromOverview(
  metrics: BackendDashboardMetrics,
  overview: BackendDashboardOverview,
  lowStock: Product[],
): DashboardMetrics {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthly = new Map(overview.monthly.map((m) => [m.period, m]));
  const daily = new Map(overview.daily.map((d) => [d.period, d]));
  const now = new Date();

  const salesAndPurchase = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const row = monthly.get(localDateKey(d, false));
    return { month: monthNames[d.getMonth()], sales: Math.round(row?.sales ?? 0), purchase: Math.round(row?.purchase ?? 0) };
  });

  const trendWeekly = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - idx));
    const row = daily.get(localDateKey(d, true));
    return { month: `${dayNames[d.getDay()]} ${d.getDate()}`, sales: Math.round(row?.sales ?? 0), purchase: Math.round(row?.purchase ?? 0) };
  });

  const cogs = Math.round(overview.cogs);
  const grossProfit = Math.round(overview.revenue - overview.cogs);

  return {
    salesOverview: {
      sales: overview.salesCount,
      revenue: overview.revenue,
      profit: grossProfit,
      cost: cogs,
    },
    netProfit: Math.round(grossProfit - overview.expensesTotal),
    grossProfit,
    totalExpenses: Math.round(overview.expensesTotal),
    cogs,
    outstandingDebt: Math.round(metrics.outstandingDebts.totalAmount),
    debtorsCount: metrics.outstandingDebts.count,
    todaySalesCount: overview.today.count,
    todayRevenue: Math.round(overview.today.revenue),
    paymentBreakdown: {
      cash: Math.round(overview.paymentBreakdown.CASH ?? 0),
      bank: Math.round(overview.paymentBreakdown.CARD ?? 0),
      telebirr: Math.round(overview.paymentBreakdown.MOBILE ?? 0),
    },
    salesAndPurchase,
    trendWeekly,
    topSellingStock: overview.topSelling.map((p) => ({
      name: p.name,
      soldQuantity: p.soldQuantity,
      remainingQuantity: p.remainingQuantity,
      price: `${p.price.toLocaleString()} Birr`,
    })),
    lowQuantityStock: lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      remainingQuantity: p.stockQuantity,
      unit: p.unit || "pcs",
    })),
    recentSales: overview.recentSales.map((s) => ({
      id: s.id.slice(0, 8),
      customerName: s.customerName || "Walk-in Customer",
      totalAmount: s.totalAmount,
      paymentMethod: paymentLabel(s.paymentMethod),
      date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: s.status,
    })),
  };
}

export async function getDashboardMetrics(shopId: string): Promise<DashboardMetrics> {
  const store = getMockStore();

  const computeMockDashboardMetrics = (targetShopId: string): DashboardMetrics => {
    const shopSales = store.sales.filter((s) => {
      const st = (s.status || "COMPLETED").toUpperCase();
      return (!s.shopId || s.shopId === targetShopId) && st !== "CANCELLED" && st !== "VOIDED" && st !== "REFUNDED" && st !== "RETURNED";
    });
    const shopProducts = store.products.filter((p) => p.shopId === targetShopId);
    const shopExpenses = store.expenses.filter((e) => (!e.shopId || e.shopId === targetShopId) && e.status === "Paid");
    const shopCustomers = store.customers.filter((c) => !c.shopId || c.shopId === targetShopId);
    const shopDebts = store.debts.filter((d) => !d.shopId || d.shopId === targetShopId);

    const totalSalesRev = shopSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);

    let totalCogs = 0;
    shopSales.forEach((s) => {
      totalCogs += computeSaleCogs(s, shopProducts);
    });

    const totalPaidExpenses = shopExpenses.reduce(
      (sum, e) => sum + (typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount || "0").replace(/,/g, "")) || 0),
      0,
    );

    const grossProfit = totalSalesRev - totalCogs;
    const netProfit = grossProfit - totalPaidExpenses;

    const totalOutstandingDebt = shopDebts.reduce((sum, d) => sum + (parseFloat(d.amount || "0") || 0), 0)
      || shopCustomers.reduce((sum, c) => sum + (parseFloat(c.debtBalance || "0") || 0), 0);
    const debtorsCount = shopDebts.filter((d) => (parseFloat(d.amount || "0") || 0) > 0).length
      || shopCustomers.filter((c) => (parseFloat(c.debtBalance || "0") || 0) > 0).length;

    const breakdown = { cash: 0, bank: 0, telebirr: 0 };
    shopSales.forEach((s) => {
      const method = (s.paymentMethod || "").toUpperCase();
      const paid = s.amountPaid != null ? parseFloat(String(s.amountPaid)) : (s.splitDetails?.cashAmount ?? parseFloat(s.totalAmount || "0"));
      if (method === "BANK" || method === "BANK_TRANSFER") breakdown.bank += paid;
      else if (method === "TELEBIRR" || method === "MOBILE") breakdown.telebirr += paid;
      else breakdown.cash += paid;
    });

    const lowStockList = shopProducts.filter((p) => p.stockQuantity <= (p.lowStockThreshold || 5));

    const recentSales = shopSales.slice(0, 4).map((s) => {
      const cust = shopCustomers.find((c) => c.id === s.customerId);
      const method = (s.paymentMethod || "CASH").toUpperCase();
      const methodLabel = method === "BANK" || method === "BANK_TRANSFER" ? "Bank" : method === "TELEBIRR" || method === "MOBILE" ? "Telebirr" : "Cash";

      return {
        id: s.id.slice(0, 8),
        customerName: cust?.name || s.customer?.name || "Walk-in Customer",
        totalAmount: parseFloat(s.totalAmount || "0"),
        paymentMethod: methodLabel,
        date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: s.status,
      };
    });

    const topSellingStock = shopProducts.slice(0, 3).map((p, idx) => ({
      name: p.name,
      soldQuantity: shopSales.length > 0 ? Math.max(1, 20 - idx * 5) : 0,
      remainingQuantity: p.stockQuantity,
      price: `${parseFloat(p.price || "0").toLocaleString()} Birr`,
    }));

    const lowQuantityStock = lowStockList.map((p) => ({
      id: p.id,
      name: p.name,
      remainingQuantity: p.stockQuantity,
      unit: p.unit || "pcs",
    }));

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const salesAndPurchase = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map((m, idx) => ({
      month: m,
      sales: totalSalesRev > 0 ? Math.round((totalSalesRev / 6) * (0.7 + idx * 0.1)) : 0,
      purchase: totalCogs > 0 ? Math.round((totalCogs / 6) * (0.6 + idx * 0.12)) : 0,
    }));

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const costRatio = totalSalesRev > 0 ? totalCogs / totalSalesRev : 0;
    const trendWeekly = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const factor = 0.6 + i * 0.08;
      const daySales = totalSalesRev > 0 ? Math.round((totalSalesRev / 14) * factor) : 0;
      return {
        month: `${dayNames[d.getDay()]} ${d.getDate()}`,
        sales: daySales,
        purchase: Math.round(daySales * costRatio),
      };
    });

    return {
      salesOverview: {
        sales: shopSales.length,
        revenue: totalSalesRev,
        profit: Math.round(grossProfit),
        cost: Math.round(totalCogs),
      },
      netProfit: Math.round(netProfit),
      grossProfit: Math.round(grossProfit),
      totalExpenses: Math.round(totalPaidExpenses),
      cogs: Math.round(totalCogs),
      outstandingDebt: Math.round(totalOutstandingDebt),
      debtorsCount,
      todaySalesCount: Math.min(shopSales.length, 5),
      todayRevenue: Math.round(totalSalesRev > 0 ? totalSalesRev * 0.25 : 0),
      paymentBreakdown: {
        cash: Math.round(breakdown.cash),
        bank: Math.round(breakdown.bank),
        telebirr: Math.round(breakdown.telebirr),
      },
      salesAndPurchase: salesAndPurchase.length > 0 ? salesAndPurchase : [
        { month: "Current", sales: totalSalesRev, purchase: totalCogs },
      ],
      trendWeekly,
      topSellingStock,
      lowQuantityStock,
      recentSales,
    };
  };

  if (isMockApiEnabled()) {
    return computeMockDashboardMetrics(shopId);
  }

  // Fast path: the backend computes every total with database sums, so the
  // dashboard needs two small requests instead of downloading every sale.
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [dash, lowStock] = await Promise.all([
      apiRequest<BackendDashboardMetrics>(`${API_ENDPOINTS.shops.dashboard(shopId)}?tz=${encodeURIComponent(tz)}`),
      apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId)).catch(() => [] as Product[]),
    ]);
    if (dash?.overview) {
      return metricsFromOverview(dash, dash.overview, Array.isArray(lowStock) ? lowStock : []);
    }
  } catch (err) {
    console.warn("Dashboard overview unavailable, using the slower fallback:", err);
  }

  // Fallback for backends without the overview block.
  try {
    const [backendMetrics, products, lowStock, liveSales, liveExpenses, liveDebts, liveAnalytics] = await Promise.allSettled([
      apiRequest<BackendDashboardMetrics>(API_ENDPOINTS.shops.dashboard(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.products(shopId)),
      apiRequest<Product[]>(API_ENDPOINTS.shops.lowStockProducts(shopId)),
      apiRequest<Sale[]>(API_ENDPOINTS.shops.sales(shopId)),
      apiRequest<any>(API_ENDPOINTS.shops.expenses(shopId)),
      apiRequest<Debt[]>(API_ENDPOINTS.shops.debts(shopId)),
      apiRequest<any>(`${API_ENDPOINTS.shops.analytics(shopId)}?period=monthly`),
    ]);

    const isAllCoreRejected =
      backendMetrics.status === "rejected" &&
      products.status === "rejected" &&
      liveSales.status === "rejected";

    if (isAllCoreRejected) {
      // No demo-data fallback: the dashboard shows the error and a retry.
      throw backendMetrics.reason;
    }

    const bMetrics = backendMetrics.status === "fulfilled" ? backendMetrics.value : null;
    const analyticsData = liveAnalytics.status === "fulfilled" ? liveAnalytics.value : null;
    const prods = products.status === "fulfilled" && Array.isArray(products.value) ? products.value : [];
    const lowStockLive = lowStock.status === "fulfilled" && Array.isArray(lowStock.value) ? lowStock.value : [];
    const salesList = liveSales.status === "fulfilled" && Array.isArray(liveSales.value) ? liveSales.value : [];
    const validSales = salesList.filter((s) => {
      const st = (s.status || "COMPLETED").toUpperCase();
      return st !== "CANCELLED" && st !== "VOIDED" && st !== "REFUNDED" && st !== "RETURNED";
    });

    const rawExp = liveExpenses.status === "fulfilled" && Array.isArray(liveExpenses.value)
      ? liveExpenses.value
      : (liveExpenses.status === "fulfilled" && Array.isArray(liveExpenses.value?.expenses) ? liveExpenses.value.expenses : []);
    const totalLiveExpenses = rawExp.reduce(
      (sum: number, e: any) => sum + (typeof e.amount === "number" ? e.amount : parseFloat(String(e.amount || "0").replace(/,/g, "")) || 0),
      0,
    );

    const debtsList = liveDebts.status === "fulfilled" && Array.isArray(liveDebts.value) ? liveDebts.value : [];
    const openDebts = debtsList.filter((d) => d.status !== "PAID" && (parseFloat(String(d.amount || "0")) || 0) > 0);
    const debtsSum = openDebts.reduce((sum, d) => sum + (parseFloat(String(d.amount || "0")) || 0), 0);
    const totalLiveDebt = bMetrics?.outstandingDebts?.totalAmount !== undefined
      ? bMetrics.outstandingDebts.totalAmount
      : (analyticsData?.debts?.totalOutstandingDebtAmount ?? debtsSum);
    const debtorsCount = bMetrics?.outstandingDebts?.count !== undefined
      ? bMetrics.outstandingDebts.count
      : (analyticsData?.debts?.outstandingDebtsCount ?? openDebts.length);

    // 1. All-time historical sales revenue
    const totalHistoricalSalesRev = validSales.reduce(
      (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
      0,
    );

    // 2. Today's sales (from backend ticker or calculated by today's date)
    const todayDateStr = new Date().toDateString();
    const todaySales = validSales.filter((s) => new Date(s.createdAt).toDateString() === todayDateStr);
    const calculatedTodayRev = todaySales.reduce(
      (sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0),
      0,
    );
    const calculatedTodayCount = todaySales.length;

    const todayRevenue = bMetrics?.todaysSales?.totalAmount !== undefined
      ? bMetrics.todaysSales.totalAmount
      : calculatedTodayRev;

    const todaySalesCount = bMetrics?.todaysSales?.count !== undefined
      ? bMetrics.todaysSales.count
      : calculatedTodayCount;

    // 3. Total Revenue is all-time historical sales
    const totalRevenue = totalHistoricalSalesRev > 0
      ? totalHistoricalSalesRev
      : (analyticsData?.sales?.totalRevenue ?? todayRevenue);

    const totalSalesCount = validSales.length > 0
      ? validSales.length
      : (analyticsData?.sales?.totalSalesCount ?? todaySalesCount);

    // 4. Payment breakdown (across historical sales or analytics)
    const breakdown = { cash: 0, bank: 0, telebirr: 0 };
    validSales.forEach((s) => {
      const method = (s.paymentMethod || "").toUpperCase();
      const paid = s.amountPaid != null
        ? parseFloat(String(s.amountPaid))
        : (s.splitDetails?.cashAmount ?? (parseFloat(String(s.totalAmount || "0")) || 0));
      if (method === "BANK" || method === "BANK_TRANSFER" || method === "CARD") breakdown.bank += paid;
      else if (method === "TELEBIRR" || method === "MOBILE") breakdown.telebirr += paid;
      else breakdown.cash += paid;
    });

    if (validSales.length === 0 && analyticsData?.sales?.paymentMethodBreakdown) {
      const pmb = analyticsData.sales.paymentMethodBreakdown;
      breakdown.cash = pmb.CASH?.totalAmount ?? 0;
      breakdown.bank = (pmb.CARD?.totalAmount ?? 0) + (pmb.BANK?.totalAmount ?? 0);
      breakdown.telebirr = (pmb.MOBILE?.totalAmount ?? 0) + (pmb.TELEBIRR?.totalAmount ?? 0);
    }

    // 5. Cost of goods sold & Profit
    let totalCogs = 0;
    validSales.forEach((s) => {
      totalCogs += computeSaleCogs(s, prods);
    });

    totalCogs = Math.round(totalCogs);
    const grossProfit = Math.round(totalRevenue - totalCogs);
    const netProfit = Math.round(grossProfit - totalLiveExpenses);

    // 6. Recent sales list
    const recent = validSales.slice(0, 4).map((s) => {
      const method = (s.paymentMethod || "CASH").toUpperCase();
      const methodLabel = method === "BANK" || method === "BANK_TRANSFER" || method === "CARD" ? "Bank" : method === "TELEBIRR" || method === "MOBILE" ? "Telebirr" : "Cash";

      return {
        id: s.id.slice(0, 8),
        customerName: s.customer?.name || "Walk-in Customer",
        totalAmount: parseFloat(String(s.totalAmount || "0")),
        paymentMethod: methodLabel,
        date: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        status: s.status,
      };
    });

    // 7. Top selling stock (calculated from sales items or analytics)
    const productSoldMap: Record<string, number> = {};
    validSales.forEach((s) => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((it: any) => {
          const pid = it.productId || it.product?.id;
          if (pid) {
            productSoldMap[pid] = (productSoldMap[pid] || 0) + (it.quantity || 1);
          }
        });
      }
    });

    let liveTopSelling = prods
      .map((p) => ({
        name: p.name,
        soldQuantity: productSoldMap[p.id] ?? (validSales.length > 0 ? 1 : 0),
        remainingQuantity: p.stockQuantity,
        price: `${parseFloat(String(p.price || "0")).toLocaleString()} Birr`,
      }))
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 4);

    if (
      liveTopSelling.length === 0 &&
      analyticsData?.products?.topSellingProducts &&
      Array.isArray(analyticsData.products.topSellingProducts)
    ) {
      liveTopSelling = analyticsData.products.topSellingProducts.map((p: any) => ({
        name: p.name,
        soldQuantity: p.totalQuantitySold ?? 0,
        remainingQuantity: 0,
        price: `${parseFloat(String(p.totalRevenue || "0")).toLocaleString()} Birr`,
      }));
    }

    const liveLowStock = lowStockLive.map((p) => ({
      id: p.id,
      name: p.name,
      remainingQuantity: p.stockQuantity,
      unit: p.unit || "pcs",
    }));

    // 8. Trends: Monthly & Weekly
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    type MonthBucket = {
      monthIndex: number;
      year: number;
      month: string;
      sales: number;
      purchase: number;
    };
    const last6Months: MonthBucket[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        month: monthNames[d.getMonth()],
        sales: 0,
        purchase: 0,
      });
    }

    validSales.forEach((s) => {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime())) {
        const m = last6Months.find((item) => item.monthIndex === d.getMonth() && item.year === d.getFullYear());
        if (m) {
          m.sales += parseFloat(String(s.totalAmount || "0")) || 0;
          m.purchase += computeSaleCogs(s, prods);
        }
      }
    });

    const salesAndPurchase = last6Months.map((m) => ({
      month: m.month,
      sales: Math.round(m.sales),
      purchase: Math.round(m.purchase),
    }));

    // Weekly trend (last 7 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    type DayBucket = {
      dateKey: string;
      month: string;
      sales: number;
      purchase: number;
    };
    const last7Days: DayBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toDateString();
      last7Days.push({
        dateKey,
        month: `${dayNames[d.getDay()]} ${d.getDate()}`,
        sales: 0,
        purchase: 0,
      });
    }

    validSales.forEach((s) => {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime())) {
        const dayItem = last7Days.find((item) => item.dateKey === d.toDateString());
        if (dayItem) {
          dayItem.sales += parseFloat(String(s.totalAmount || "0")) || 0;
          dayItem.purchase += computeSaleCogs(s, prods);
        }
      }
    });

    const trendWeekly = last7Days.map((d) => ({
      month: d.month,
      sales: Math.round(d.sales),
      purchase: Math.round(d.purchase),
    }));

    return {
      salesOverview: {
        sales: totalSalesCount,
        revenue: totalRevenue,
        profit: grossProfit,
        cost: totalCogs,
      },
      netProfit,
      grossProfit,
      totalExpenses: Math.round(totalLiveExpenses),
      cogs: totalCogs,
      outstandingDebt: Math.round(totalLiveDebt),
      debtorsCount,
      todaySalesCount,
      todayRevenue: Math.round(todayRevenue),
      paymentBreakdown: {
        cash: Math.round(breakdown.cash),
        bank: Math.round(breakdown.bank),
        telebirr: Math.round(breakdown.telebirr),
      },
      salesAndPurchase: salesAndPurchase.length > 0 ? salesAndPurchase : [
        { month: "Current", sales: totalRevenue, purchase: totalCogs },
      ],
      trendWeekly,
      topSellingStock: liveTopSelling,
      lowQuantityStock: liveLowStock,
      recentSales: recent,
    };
  } catch (err) {
    console.warn("Could not load dashboard metrics:", err);
    throw err;
  }
}

/**
 * KPI totals for one period plus the period it is compared with. Returns null
 * for "all time" or when the backend doesn't support periods yet.
 */
export async function getDashboardPeriod(
  shopId: string,
  range: { from: Date; to: Date; prevFrom?: Date; prevTo?: Date },
): Promise<DashboardPeriod | null> {
  if (isMockApiEnabled()) return null;
  const query = new URLSearchParams({
    periodOnly: "true",
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });
  if (range.prevFrom && range.prevTo) {
    query.set("prevFrom", range.prevFrom.toISOString());
    query.set("prevTo", range.prevTo.toISOString());
  }
  const res = await apiRequest<{ period?: DashboardPeriod | null }>(
    `${API_ENDPOINTS.shops.dashboard(shopId)}?${query.toString()}`,
  );
  return res?.period ?? null;
}
