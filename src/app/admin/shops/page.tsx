"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { activateShop, getAdminShops, suspendShop } from "@/lib/api/admin";
import type { AdminShop } from "@/lib/api/types";

export default function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const loadShops = useCallback(async () => {
    try {
      const data = await getAdminShops();
      setShops(data);
    } catch (err) {
      console.warn("Could not load admin shops:", err);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (statusFilter === "ACTIVE" && !s.isActive) return false;
      if (statusFilter === "SUSPENDED" && s.isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesOwner = s.ownerEmail?.toLowerCase().includes(q) || s.ownerName?.toLowerCase().includes(q);
        const matchesType = s.businessType?.toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesType) return false;
      }
      return true;
    });
  }, [shops, statusFilter, searchQuery]);

  async function handleToggleStatus(shop: AdminShop) {
    try {
      if (shop.isActive) {
        await suspendShop(shop.id);
        setActionSuccessMsg(`Shop '${shop.name}' has been suspended.`);
      } else {
        await activateShop(shop.id);
        setActionSuccessMsg(`Shop '${shop.name}' has been reactivated.`);
      }
      await loadShops();
    } catch {
      // Fallback
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-950 text-[#c0e763] shadow-sm">
              <Building2 className="size-4 text-[#c0e763]" />
            </span>
            <h1 className="text-xl font-bold text-[#111827]">Registered Shops Oversight</h1>
          </div>
          <p className="text-xs text-[#6b7280]">
            Monitor all registered stores, active status, and store members platform-wide
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadShops}
            title="Refresh list"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            <RefreshCw className="size-3.5 text-[#6b7280]" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg("")}
            className="text-blue-600 hover:text-blue-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Metrics overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
          <span className="text-xs font-semibold text-[#6b7280]">Total Registered Shops</span>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{shops.length}</div>
          <span className="text-[11px] text-[#6b7280]">Stores onboarded to platform</span>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
          <span className="text-xs font-semibold text-[#6b7280]">Active Operating Shops</span>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
            {shops.filter((s) => s.isActive).length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Accepting sales & inventory</span>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
          <span className="text-xs font-semibold text-[#6b7280]">Suspended / Inactive</span>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-[#dc2626] tabular-nums">
            {shops.filter((s) => !s.isActive).length}
          </div>
          <span className="text-[11px] text-red-600 font-medium">Frozen shop operations</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? "bg-zinc-950 text-[#c0e763] shadow-sm"
                    : "border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                {tab === "ALL" ? "All Shops" : tab === "ACTIVE" ? "Active Shops" : "Suspended"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by shop name, owner, type..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
              <tr>
                <th className="pb-3">Shop Name</th>
                <th className="pb-3">Business Category</th>
                <th className="pb-3">Owner Contact</th>
                <th className="pb-3">Staff Members</th>
                <th className="pb-3">Created Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filteredShops.length > 0 ? (
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-[#f9fafb]">
                    <td className="py-3 font-bold text-[#111827]">{shop.name}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {shop.businessType}
                      </span>
                    </td>
                    <td className="py-3">
                      <p className="text-[#111827]">{shop.ownerName || "Shop Owner"}</p>
                      <p className="text-[11px] text-[#6b7280]">{shop.ownerEmail}</p>
                    </td>
                    <td className="py-3 font-semibold text-[#374151]">{shop.memberCount || 1} Members</td>
                    <td className="py-3 text-[#6b7280]">
                      {new Date(shop.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          shop.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            shop.isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {shop.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(shop)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                          shop.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {shop.isActive ? "Suspend Shop" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#9ca3af]">
                    No shops found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
