"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  Crown,
  Eye,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { LoadingState } from "@/components/shared/loading-state";
import {
  activateShop,
  activateUser,
  getAdminShops,
  getAdminStats,
  getAdminUsers,
  registerOwnerByAdmin,
  suspendShop,
  suspendUser,
} from "@/lib/api/admin";
import type {
  AdminShop,
  AdminStats,
  AdminUser,
  RegisterOwnerInput,
} from "@/lib/api/types";

const ROLE_COLORS: Record<string, string> = {
  OWNER: "#2563eb",
  ADMIN: "#8b5cf6",
  SALES: "#10b981",
  SUPER_ADMIN: "#f59e0b",
};

/* ------------------------------------------------------------------ */
/* Modal: Register Owner & Primary Shop                               */
/* ------------------------------------------------------------------ */
function RegisterOwnerModal({
  onClose,
  onRegistered,
}: {
  onClose: () => void;
  onRegistered: (user: AdminUser, shop: AdminShop) => void;
}) {
  const [formData, setFormData] = useState<RegisterOwnerInput>({
    name: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
    businessType: "RETAIL",
    address: "Addis Ababa",
    currency: "ETB",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.shopName || !formData.password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await registerOwnerByAdmin(formData);
      onRegistered(res.user, res.shop);
      onClose();
    } catch {
      setErrorMsg("Failed to register owner. Please check the information.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Register New Shop Owner</h2>
              <p className="text-xs text-[#6b7280]">Provision a new store owner account and initial shop</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Owner Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dawit Haile"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. dawit@example.com"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 91 123 4567"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Initial Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5 space-y-3">
            <h3 className="text-xs font-bold text-[#111827]">Primary Shop Details</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-[#374151]">Shop / Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="e.g. Haile Supermarket & Mart"
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#374151]">Business Category</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 focus:border-[#2563eb] focus:outline-none"
                >
                  <option value="RETAIL">Retail / General Store</option>
                  <option value="GROCERIES">Groceries & Supermarket</option>
                  <option value="CLOTHING">Clothing & Boutique</option>
                  <option value="PHARMACY">Pharmacy & Health</option>
                  <option value="ELECTRONICS">Electronics & Tech</option>
                  <option value="RESTAURANT">Cafe & Restaurant</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#374151]">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Bole Medhanialem, Addis Ababa"
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#374151]">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 focus:border-[#2563eb] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#f3f4f6] pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-5 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: User Suspension Confirmation / Warning                      */
/* ------------------------------------------------------------------ */
function SuspendConfirmModal({
  user,
  onClose,
  onConfirm,
  isProcessing,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-[#f3f4f6] pb-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111827]">Suspend User Account</h2>
            <p className="text-xs text-[#6b7280]">Account login will be immediately disabled</p>
          </div>
        </div>

        <div className="my-4 space-y-3 text-xs">
          <div className="rounded-xl bg-[#f9fafb] p-3 space-y-1.5 border border-[#e5e7eb]">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">User:</span>
              <span className="font-semibold text-[#111827]">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Email:</span>
              <span className="text-[#111827]">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Role:</span>
              <span className="font-semibold text-[#2563eb]">{user.role}</span>
            </div>
          </div>

          {user.role === "OWNER" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 space-y-1">
              <span className="font-bold">⚠️ Warning for Shop Owner:</span>
              <p className="text-[11px] leading-relaxed">
                Suspending this owner will leave their registered store ({user.shopName || "Associated Shop"}) without an active owner.
              </p>
            </div>
          )}

          <p className="text-[#6b7280]">
            Are you sure you want to suspend this account? You can reactivate it at any time.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#f3f4f6] pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="rounded-xl bg-[#dc2626] px-5 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isProcessing ? "Suspending..." : "Confirm Suspension"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main SuperAdmin Dashboard Page                                     */
/* ------------------------------------------------------------------ */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<AdminUser | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadAdminData = useCallback(async () => {
    try {
      const [statsData, shopsData, usersData] = await Promise.all([
        getAdminStats(),
        getAdminShops(),
        getAdminUsers({ limit: 10 }),
      ]);
      setStats(statsData);
      setShops(shopsData);
      setUsers(usersData.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Chart data: Role Breakdown
  const roleChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Shop Owners", value: stats.totalUsersByRole.OWNER, color: ROLE_COLORS.OWNER },
      { name: "Shop Admins", value: stats.totalUsersByRole.ADMIN, color: ROLE_COLORS.ADMIN },
      { name: "Sales Staff", value: stats.totalUsersByRole.SALES, color: ROLE_COLORS.SALES },
      { name: "SuperAdmin", value: stats.totalUsersByRole.SUPER_ADMIN, color: ROLE_COLORS.SUPER_ADMIN },
    ];
  }, [stats]);

  // Filtered Shop Owners list
  const ownersList = useMemo(() => {
    const owners = users.filter((u) => u.role === "OWNER");
    if (!searchQuery.trim()) return owners;
    const q = searchQuery.toLowerCase();
    return owners.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.shopName?.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  async function handleToggleUserStatus(user: AdminUser) {
    setIsProcessingAction(true);
    try {
      if (user.isActive) {
        const res = await suspendUser(user.id);
        if (res.warning) {
          setActionSuccessMsg(`User suspended. Warning: ${res.warning}`);
        } else {
          setActionSuccessMsg(`User ${user.name} suspended.`);
        }
      } else {
        await activateUser(user.id);
        setActionSuccessMsg(`User ${user.name} reactivated.`);
      }
      await loadAdminData();
      setUserToSuspend(null);
    } finally {
      setIsProcessingAction(false);
    }
  }

  async function handleToggleShopStatus(shop: AdminShop) {
    try {
      if (shop.isActive) {
        await suspendShop(shop.id);
        setActionSuccessMsg(`Shop ${shop.name} suspended.`);
      } else {
        await activateShop(shop.id);
        setActionSuccessMsg(`Shop ${shop.name} activated.`);
      }
      await loadAdminData();
    } catch {
      // Fallback
    }
  }

  if (loading || !stats) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. Header Toolbar                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <ShieldCheck className="size-4" />
            </span>
            <h1 className="text-xl font-bold text-[#111827]">SuperAdmin Oversight Dashboard</h1>
          </div>
          <p className="text-xs text-[#6b7280]">
            System-wide analytics, shop approvals, and owner registration management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAdminData}
            title="Refresh statistics"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            <RefreshCw className="size-3.5 text-[#6b7280]" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            <UserPlus className="size-4" />
            + Register New Owner
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* ================================================================= */}
      {/* 2. Top System Statistics Cards                                    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Registered Shops */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Total Registered Shops</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111827]">{stats.totalShops}</span>
            <span className="text-xs text-[#16a34a] font-medium">{stats.totalActiveShops} Active</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6b7280]">
            <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
            <span>{stats.suspendedShops} suspended shops</span>
          </div>
        </div>

        {/* Registered Shop Owners */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Registered Store Owners</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Crown className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111827]">{stats.totalUsersByRole.OWNER}</span>
            <span className="text-xs text-[#6b7280]">Primary Accounts</span>
          </div>
          <div className="mt-2 text-[11px] text-[#6b7280]">
            Full store operational authority
          </div>
        </div>

        {/* Platform Users Breakdown */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Total Platform Users</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111827]">
              {stats.totalUsersByRole.OWNER +
                stats.totalUsersByRole.ADMIN +
                stats.totalUsersByRole.SALES +
                stats.totalUsersByRole.SUPER_ADMIN}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Platform Wide</span>
          </div>
          <div className="mt-2 text-[11px] text-[#6b7280]">
            {stats.totalUsersByRole.ADMIN} Admins · {stats.totalUsersByRole.SALES} Sales Staff
          </div>
        </div>

        {/* Suspended Accounts Alert */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b7280]">Suspended Accounts</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#dc2626]">{stats.totalSuspendedAccounts}</span>
            <span className="text-xs text-red-600 font-medium">Frozen</span>
          </div>
          <div className="mt-2 text-[11px] text-[#6b7280]">
            {stats.suspendedShops} Shops · {stats.suspendedUsers} Users suspended
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. Visual Charts: Role Distribution & Shop Status                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: User Distribution Chart */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-bold text-[#111827]">Platform Roles Breakdown</h2>
          <p className="text-xs text-[#6b7280]">User distribution across platform roles</p>

          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value ?? 0} Users`, String(name ?? "")]}
                  contentStyle={{
                    backgroundColor: "#111827",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Registered Shops Snapshot Table */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Registered Shops Oversight</h2>
              <p className="text-xs text-[#6b7280]">Latest businesses registered on the system</p>
            </div>
            <a
              href="/admin/shops"
              className="flex items-center gap-1 text-xs font-semibold text-[#2563eb] hover:underline"
            >
              View All ({shops.length})
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
                <tr>
                  <th className="pb-2.5">Shop Name</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Owner Contact</th>
                  <th className="pb-2.5">Members</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {shops.slice(0, 4).map((shop) => (
                  <tr key={shop.id} className="hover:bg-[#f9fafb]">
                    <td className="py-2.5 font-bold text-[#111827]">{shop.name}</td>
                    <td className="py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {shop.businessType}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#6b7280]">{shop.ownerEmail}</td>
                    <td className="py-2.5 font-semibold text-[#374151]">{shop.memberCount || 1} Staff</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleShopStatus(shop)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          shop.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {shop.isActive ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. Store Owners Management Table                                  */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Registered Store Owners Directory</h2>
            <p className="text-xs text-[#6b7280]">Manage, inspect, and approve primary shop owner accounts</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search owner by name, email, shop..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
              <tr>
                <th className="pb-3">Owner Name</th>
                <th className="pb-3">Assigned Shop</th>
                <th className="pb-3">Email & Phone</th>
                <th className="pb-3">Registration Date</th>
                <th className="pb-3">Account Status</th>
                <th className="pb-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {ownersList.length > 0 ? (
                ownersList.map((owner) => (
                  <tr key={owner.id} className="hover:bg-[#f9fafb]">
                    <td className="py-3 font-bold text-[#111827]">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {owner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{owner.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-[#374151]">{owner.shopName || "Primary Shop"}</span>
                    </td>
                    <td className="py-3">
                      <p className="text-[#111827]">{owner.email}</p>
                      <p className="text-[11px] text-[#9ca3af]">{owner.phone || "-"}</p>
                    </td>
                    <td className="py-3 text-[#6b7280]">
                      {new Date(owner.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          owner.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            owner.isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {owner.isActive ? "Active Account" : "Suspended"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {owner.isActive ? (
                        <button
                          type="button"
                          onClick={() => setUserToSuspend(owner)}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Suspend Owner
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(owner)}
                          className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#9ca3af]">
                    No shop owners found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Modals Container                                                  */}
      {/* ================================================================= */}
      {isRegisterModalOpen && (
        <RegisterOwnerModal
          onClose={() => setIsRegisterModalOpen(false)}
          onRegistered={(user, shop) => {
            setActionSuccessMsg(`Successfully registered owner ${user.name} and shop ${shop.name}!`);
            loadAdminData();
          }}
        />
      )}

      {userToSuspend && (
        <SuspendConfirmModal
          user={userToSuspend}
          onClose={() => setUserToSuspend(null)}
          onConfirm={() => handleToggleUserStatus(userToSuspend)}
          isProcessing={isProcessingAction}
        />
      )}
    </div>
  );
}
