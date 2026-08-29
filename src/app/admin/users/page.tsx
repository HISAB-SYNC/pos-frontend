"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Crown,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
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
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Users className="size-4" />
            </span>
            <h1 className="text-xl font-bold text-[#111827]">Platform Users Oversight</h1>
          </div>
          <p className="text-xs text-[#6b7280]">
            Manage, filter, and audit user accounts across all platform roles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            title="Refresh list"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            <RefreshCw className="size-3.5 text-[#6b7280]" />
            Refresh
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {warningMsg && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span><strong>Safety Warning:</strong> {warningMsg}</span>
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

      {/* Table Card */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "All Users" },
              { id: "OWNER", label: "Store Owners" },
              { id: "ADMIN", label: "Shop Admins" },
              { id: "SALES", label: "Sales Staff" },
              { id: "SUPER_ADMIN", label: "SuperAdmin" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  roleFilter === tab.id
                    ? "bg-[#111827] text-white shadow-sm"
                    : "border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name, email, shop..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
              <tr>
                <th className="pb-3">User Profile</th>
                <th className="pb-3">Platform Role</th>
                <th className="pb-3">Assigned Shop</th>
                <th className="pb-3">Joined Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isOwner = u.role === "OWNER";
                  const isSuper = u.role === "SUPER_ADMIN";

                  return (
                    <tr key={u.id} className="hover:bg-[#f9fafb]">
                      <td className="py-3 font-bold text-[#111827]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7.5 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 text-xs">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span>{u.name}</span>
                            <span className="block font-normal text-[11px] text-[#6b7280]">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-amber-100 text-amber-800"
                              : u.role === "OWNER"
                              ? "bg-blue-100 text-blue-800"
                              : u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        {u.shopName ? (
                          <div className="flex items-center gap-1 text-[#374151]">
                            <Building2 className="size-3 text-[#6b7280]" />
                            <span className="font-medium">{u.shopName}</span>
                          </div>
                        ) : (
                          <span className="text-[#9ca3af]">Platform Level</span>
                        )}
                      </td>
                      <td className="py-3 text-[#6b7280]">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!isSuper && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                              u.isActive
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
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
                  <td colSpan={6} className="py-8 text-center text-xs text-[#9ca3af]">
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
