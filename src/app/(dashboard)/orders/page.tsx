"use client";

import {
  Banknote,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Landmark,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { getSales } from "@/lib/api/app-data";
import type { Sale } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Modal: Digital Sale Receipt                                         */
/* ------------------------------------------------------------------ */
function SaleReceiptModal({
  sale,
  shopName,
  onClose,
}: {
  sale: Sale | null;
  shopName: string;
  onClose: () => void;
}) {
  if (!sale) return null;

  const totalNum = parseFloat(String(sale.totalAmount || "0"));
  const subtotalNum = sale.subtotal ? parseFloat(String(sale.subtotal)) : Math.round(totalNum / 1.15 * 100) / 100;
  const taxNum = sale.taxAmount ? parseFloat(String(sale.taxAmount)) : Math.round((totalNum - subtotalNum) * 100) / 100;
  const discountNum = sale.discountAmount ? parseFloat(String(sale.discountAmount)) : 0;

  const method = (sale.paymentMethod || "CASH").toUpperCase();
  const paymentMethodLabel =
    method === "BANK" || method === "CARD" || method === "BANK_TRANSFER"
      ? "Bank Transfer / Card"
      : method === "TELEBIRR" || method === "MOBILE"
      ? "Telebirr / Mobile Money"
      : "Cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Receipt className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Sale Receipt</h3>
              <p className="font-mono text-[10px] text-zinc-400">
                #RCP-{sale.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="my-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 text-xs space-y-3">
          <div className="text-center pb-2 border-b border-dashed border-zinc-200">
            <h4 className="font-bold text-sm text-zinc-900">{shopName}</h4>
            <p className="text-[11px] text-zinc-500">Official Checkout Register</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-400">
              {new Date(sale.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex justify-between text-[11px]">
            <span className="text-zinc-500">Customer:</span>
            <span className="font-semibold text-zinc-800">
              {sale.customer?.name || "Walk-in Customer"}
            </span>
          </div>

          {/* Items List */}
          <div className="border-t border-b border-zinc-200/80 py-2 space-y-1.5">
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-center text-[11px]">
                  <div>
                    <p className="font-medium text-zinc-800">
                      {item.product?.name || `Item #${idx + 1}`}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-400">
                      {item.quantity} × {parseFloat(String(item.unitPrice || "0")).toFixed(2)} ETB
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-zinc-900">
                    {(item.quantity * (parseFloat(String(item.unitPrice || "0")) || 0)).toFixed(2)} ETB
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-600">General POS Checkout Sale</span>
                <span className="font-mono font-semibold text-zinc-900">
                  {totalNum.toFixed(2)} ETB
                </span>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-mono">{subtotalNum.toFixed(2)} ETB</span>
            </div>
            {taxNum > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>VAT / Tax (15%):</span>
                <span className="font-mono">{taxNum.toFixed(2)} ETB</span>
              </div>
            )}
            {discountNum > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">-{discountNum.toFixed(2)} ETB</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-xs font-bold text-zinc-900">
              <span>Total Paid:</span>
              <span className="font-mono text-sm">{totalNum.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-zinc-200 flex justify-between text-[11px]">
            <span className="text-zinc-500">Payment Channel:</span>
            <span className="font-semibold text-zinc-800">{paymentMethodLabel}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition-colors"
          >
            <Printer className="size-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component: Sales History & Receipts Ledger                    */
/* ------------------------------------------------------------------ */
export default function SalesHistoryPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const activeShopName = useShopStore((state) => state.activeShopName) || "Shop";
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSales(shopId);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load sales history:", err);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const idMatch = s.id.toLowerCase().includes(search.toLowerCase());
      const custMatch = s.customer?.name?.toLowerCase().includes(search.toLowerCase());
      const phoneMatch = s.customer?.phone?.includes(search);
      const matchesSearch = !search.trim() || idMatch || custMatch || phoneMatch;

      const methodUpper = (s.paymentMethod || "").toUpperCase();
      let matchesMethod = selectedMethod === "ALL";
      if (selectedMethod === "CASH") matchesMethod = methodUpper === "CASH";
      else if (selectedMethod === "BANK") matchesMethod = methodUpper === "BANK" || methodUpper === "CARD" || methodUpper === "BANK_TRANSFER";
      else if (selectedMethod === "TELEBIRR") matchesMethod = methodUpper === "TELEBIRR" || methodUpper === "MOBILE";

      const matchesStatus =
        selectedStatus === "ALL" || (s.status || "COMPLETED").toUpperCase() === selectedStatus;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [sales, search, selectedMethod, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const currentSales = useMemo(
    () => filteredSales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredSales, page],
  );

  // Summary Metrics calculations
  const totalRevenue = useMemo(
    () => sales.filter((s) => s.status !== "CANCELLED").reduce((sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0), 0),
    [sales],
  );

  const todayDateStr = new Date().toDateString();
  const todaySalesList = useMemo(
    () => sales.filter((s) => new Date(s.createdAt).toDateString() === todayDateStr && s.status !== "CANCELLED"),
    [sales, todayDateStr],
  );
  const todayRevenue = useMemo(
    () => todaySalesList.reduce((sum, s) => sum + (parseFloat(String(s.totalAmount || "0")) || 0), 0),
    [todaySalesList],
  );

  const completedCount = useMemo(
    () => sales.filter((s) => s.status !== "CANCELLED").length,
    [sales],
  );

  const avgTicket = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  function handleDownload() {
    exportToCsv("sales-history-ledger", filteredSales, [
      { header: "Receipt ID", formatter: (s) => `#RCP-${s.id.slice(0, 8).toUpperCase()}` },
      { header: "Date & Time", formatter: (s) => new Date(s.createdAt).toLocaleString() },
      { header: "Customer", formatter: (s) => s.customer?.name || "Walk-in Customer" },
      { header: "Payment Channel", key: "paymentMethod" },
      { header: "Amount (ETB)", formatter: (s) => (parseFloat(String(s.totalAmount || "0"))).toFixed(2) },
      { header: "Status", formatter: (s) => s.status || "COMPLETED" },
    ]);
  }

  return (
    <>
      <SaleReceiptModal
        sale={activeReceipt}
        shopName={activeShopName}
        onClose={() => setActiveReceipt(null)}
      />

      <div className="space-y-4">
        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Sales Revenue</p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              {Math.round(totalRevenue).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">{completedCount} completed sales</p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Today&apos;s Revenue</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {Math.round(todayRevenue).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">{todaySalesList.length} sales today</p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Completed Transactions</p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              {completedCount}
            </p>
            <p className="mt-1 text-xs text-zinc-500">All registered checkout tickets</p>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Average Ticket (AOV)</p>
            <p className="mt-2 font-mono text-2xl font-bold text-zinc-900 tabular-nums">
              {avgTicket.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-zinc-500">ETB</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">Per checkout transaction</p>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
          {/* Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-zinc-900 tracking-tight">Sales History</h1>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
                {filteredSales.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search receipt #, customer..."
                  className="h-8 w-56 rounded-lg border border-zinc-200 bg-zinc-50/70 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                    selectedMethod !== "ALL" || selectedStatus !== "ALL"
                      ? "border-[#c0e763] bg-[#c0e763]/20 text-zinc-950 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <Filter className="size-3.5" />
                  <span>Filters</span>
                  {(selectedMethod !== "ALL" || selectedStatus !== "ALL") && (
                    <span className="size-1.5 rounded-full bg-[#82a823]" />
                  )}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-10 z-30 w-64 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xl text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="font-bold text-zinc-900">Filter Transactions</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod("ALL");
                          setSelectedStatus("ALL");
                          setShowFilterDropdown(false);
                        }}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900"
                      >
                        <RotateCcw className="size-3" />
                        Reset
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-zinc-600">Payment Channel</label>
                      <select
                        value={selectedMethod}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="h-8 w-full rounded-md border border-zinc-200 px-2 text-zinc-900"
                      >
                        <option value="ALL">All Channels</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank Transfer / Card</option>
                        <option value="TELEBIRR">Telebirr / Mobile</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block font-medium text-zinc-600">Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="h-8 w-full rounded-md border border-zinc-200 px-2 text-zinc-900"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Voided / Cancelled</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Download CSV */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Download className="size-3.5" />
                <span>Export</span>
              </button>

              {/* Link to POS */}
              <Link
                href="/pos"
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#c0e763] px-3 text-xs font-bold text-zinc-950 shadow-xs transition-all hover:bg-[#b0d952] active:scale-95"
              >
                <ShoppingCart className="size-3.5" />
                <span>New Sale (POS)</span>
              </Link>
            </div>
          </div>

          {/* Sales History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="border-b border-zinc-200/80 bg-zinc-50/60 font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Receipt #</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Payment Channel</th>
                  <th className="px-5 py-3 font-semibold">Total (ETB)</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                        <Receipt className="size-6" />
                      </div>
                      <p className="mt-3 text-xs font-bold text-zinc-800">No sales transactions found</p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Process checkout sales on the POS screen to build your transaction ledger.
                      </p>
                      <Link
                        href="/pos"
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Plus className="size-3.5" />
                        <span>Go to POS Register</span>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  currentSales.map((sale) => {
                    const method = (sale.paymentMethod || "").toUpperCase();
                    const isCash = method === "CASH";
                    const isBank = method === "BANK" || method === "CARD" || method === "BANK_TRANSFER";
                    const isTelebirr = method === "TELEBIRR" || method === "MOBILE";
                    const totalVal = parseFloat(String(sale.totalAmount || "0"));

                    return (
                      <tr key={sale.id} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-900">
                          #RCP-{sale.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-500 font-mono text-[11px]">
                          {new Date(sale.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900">
                          {sale.customer?.name || "Walk-in Customer"}
                        </td>
                        <td className="px-5 py-3.5">
                          {isCash && (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              <Banknote className="size-3 text-emerald-600" />
                              Cash
                            </span>
                          )}
                          {isBank && (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                              <Landmark className="size-3 text-blue-600" />
                              Bank / Card
                            </span>
                          )}
                          {isTelebirr && (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              <Smartphone className="size-3 text-amber-600" />
                              Telebirr
                            </span>
                          )}
                          {!isCash && !isBank && !isTelebirr && (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                              {sale.paymentMethod || "Other"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 tabular-nums">
                          {totalVal.toLocaleString()} ETB
                        </td>
                        <td className="px-5 py-3.5">
                          {sale.status === "CANCELLED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              <span className="size-1.5 rounded-full bg-red-600" />
                              Voided
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <span className="size-1.5 rounded-full bg-emerald-600" />
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(sale)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <Eye className="size-3.5 text-zinc-500" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
              <div>
                Showing <span className="font-semibold text-zinc-900 font-mono">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                <span className="font-semibold text-zinc-900 font-mono">
                  {Math.min(page * PAGE_SIZE, filteredSales.length)}
                </span>{" "}
                of <span className="font-semibold text-zinc-900 font-mono">{filteredSales.length}</span> receipts
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-zinc-200 px-2.5 py-1 font-medium hover:bg-zinc-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-xs">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-zinc-200 px-2.5 py-1 font-medium hover:bg-zinc-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
