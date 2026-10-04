"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
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
      setTimeout(() => setActionSuccessMsg(""), 3500);
    } catch {
      // Fallback
    }
  }

  if (loading && shops.length === 0) {
    return <LoadingState />;
  }

  const activeCount = shops.filter((s) => s.isActive).length;
  const suspendedCount = shops.filter((s) => !s.isActive).length;
  const totalMembers = shops.reduce((acc, s) => acc + (s.memberCount || 1), 0);
  const avgMembers = shops.length > 0 ? (totalMembers / shops.length).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Registered Stores Oversight
            </h1>
            <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              {shops.length} Stores
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Monitor store business categories, active licensing status, and allocated staff seats platform-wide
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadShops}
            title="Refresh list"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <RefreshCw className="size-3.5 text-zinc-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg("")}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Metrics overview */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Stores
            </span>
            <Building2 className="size-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {shops.length}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Total client stores onboarded</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Active Operating
            </span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {activeCount}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Processing checkout sales</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700">
              Suspended / Frozen
            </span>
            <ShieldAlert className="size-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-rose-600 tabular-nums">
              {suspendedCount}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Frozen store operations</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Operator Seats
            </span>
            <Users className="size-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {totalMembers}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Avg {avgMembers} staff / store</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
            {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  statusFilter === tab
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab === "ALL" ? `All (${shops.length})` : tab === "ACTIVE" ? `Active (${activeCount})` : `Suspended (${suspendedCount})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by store name, owner, type..."
              className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <th className="px-5 py-3">Store Name</th>
                <th className="px-4 py-3">Business Category</th>
                <th className="px-4 py-3">Owner Contact</th>
                <th className="px-4 py-3">Staff Seats</th>
                <th className="px-4 py-3">Onboarded Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredShops.length > 0 ? (
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-bold text-zinc-900">{shop.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-700">
                        {shop.businessType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-zinc-900">{shop.ownerName || "Store Owner"}</p>
                      <p className="font-mono text-[11px] text-zinc-400">{shop.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-zinc-800 tabular-nums">
                        {shop.memberCount || 1}
                      </span>
                      <span className="ml-1 text-[11px] text-zinc-400">seats</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-zinc-600 tabular-nums">
                      {new Date(shop.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider border ${
                          shop.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span className={`size-1 rounded-full ${shop.isActive ? "bg-emerald-600" : "bg-rose-600"}`} />
                        {shop.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(shop)}
                        className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors shadow-2xs ${
                          shop.isActive
                            ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {shop.isActive ? "Suspend Store" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-zinc-400">
                    No shops found matching filter criteria.
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
