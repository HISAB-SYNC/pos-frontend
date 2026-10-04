"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Crown,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { activateUser, getAdminUsers, suspendUser } from "@/lib/api/admin";
import type { AdminUser } from "@/lib/api/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAdminUsers({ role: roleFilter, limit: 50 });
      setUsers(data.users);
    } catch (err) {
      console.warn("Could not load admin users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.shopName?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  async function handleToggleStatus(user: AdminUser) {
    try {
      if (user.isActive) {
        const res = await suspendUser(user.id);
        if (res.warning) {
          setWarningMsg(res.warning);
        }
        setActionSuccessMsg(`User '${user.name}' has been suspended.`);
      } else {
        await activateUser(user.id);
        setWarningMsg("");
        setActionSuccessMsg(`User '${user.name}' has been reactivated.`);
      }
      await loadUsers();
      setTimeout(() => setActionSuccessMsg(""), 3500);
    } catch {
      // Fallback
    }
  }

  if (loading && users.length === 0) {
    return <LoadingState />;
  }

  const ownerCount = users.filter((u) => u.role === "OWNER").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const salesCount = users.filter((u) => u.role === "SALES").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Platform Users Directory
            </h1>
            <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              {users.length} Users
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Audit, inspect, and manage system accounts across all platform roles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            title="Refresh list"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <RefreshCw className="size-3.5 text-zinc-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {warningMsg && (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span><strong>Safety Notice:</strong> {warningMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningMsg("")}
            className="text-amber-700 hover:text-amber-900"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

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

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Users
            </span>
            <Users className="size-4 text-zinc-400" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {users.length}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Total accounts on platform</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Store Owners
            </span>
            <Crown className="size-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {ownerCount}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Primary shop administrators</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Shop Admins
            </span>
            <ShieldCheck className="size-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-indigo-700 tabular-nums">
              {adminCount}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">Inventory &amp; staff supervision</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Sales Staff
            </span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {salesCount}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">POS checkout operators</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Role Filter Tabs */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
            {[
              { id: "ALL", label: "All Users" },
              { id: "OWNER", label: "Owners" },
              { id: "ADMIN", label: "Admins" },
              { id: "SALES", label: "Sales" },
              { id: "SUPER_ADMIN", label: "SuperAdmin" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  roleFilter === tab.id
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name, email, store..."
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
                <th className="px-5 py-3">User Profile</th>
                <th className="px-4 py-3">Platform Role</th>
                <th className="px-4 py-3">Assigned Store</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isSuper = u.role === "SUPER_ADMIN";
                  const isOwner = u.role === "OWNER";
                  const isAdmin = u.role === "ADMIN";

                  return (
                    <tr key={u.id} className="transition-colors hover:bg-zinc-50/70">
                      <td className="px-5 py-3.5 font-bold text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7.5 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 font-mono text-xs font-bold text-zinc-800">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900">{u.name}</span>
                            <span className="block font-mono text-[11px] text-zinc-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                            isSuper
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : isOwner
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                              : isAdmin
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.shopName ? (
                          <div className="flex items-center gap-1.5 text-zinc-800">
                            <Building2 className="size-3 text-zinc-400" />
                            <span className="font-medium">{u.shopName}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-zinc-400">Platform Level</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-600 tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider border ${
                            u.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span className={`size-1 rounded-full ${u.isActive ? "bg-emerald-600" : "bg-rose-600"}`} />
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!isSuper && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors shadow-2xs ${
                              u.isActive
                                ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {u.isActive ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-zinc-400">
                    No users found matching query.
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
