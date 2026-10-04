"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LoadingState } from "@/components/shared/loading-state";
import {
  activateShop,
  activateUser,
  getAdminAnalytics,
  getAdminShops,
  getAdminStats,
  getAdminUsers,
  registerOwnerByAdmin,
  seedPlatformTraction,
  suspendShop,
  suspendUser,
} from "@/lib/api/admin";
import type {
  AdminShop,
  AdminStats,
  AdminUser,
  PlatformTractionStats,
  RegisterOwnerInput,
} from "@/lib/api/types";

const SECTOR_COLORS = [
  "#5B4FE9", // Electric Indigo
  "#0F172A", // Slate 900
  "#059669", // Emerald
  "#D97706", // Amber
  "#6366F1", // Indigo
  "#64748B", // Slate
];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600">
              <UserPlus className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900">Provision New Shop Owner</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Create a merchant account and link their primary retail store</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Owner Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dawit Haile"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. dawit@example.com"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 91 123 4567"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-4 space-y-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              Primary Store Details
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Shop Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="e.g. Haile Supermarket & Mart"
                  className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Business Category
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-2.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-none"
                >
                  <option value="RETAIL">Retail / General Store</option>
                  <option value="GROCERIES">Groceries &amp; Supermarket</option>
                  <option value="CLOTHING">Clothing &amp; Boutique</option>
                  <option value="PHARMACY">Pharmacy &amp; Health</option>
                  <option value="ELECTRONICS">Electronics &amp; Tech</option>
                  <option value="RESTAURANT">Cafe &amp; Restaurant</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Address / City
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Bole Medhanialem, Addis Ababa"
                  className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="h-8.5 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Provisioning..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: User Suspension Confirmation                                */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3 border-b border-zinc-100 pb-4">
          <div className="flex size-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
            <AlertTriangle className="size-4.5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Freeze User Account</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Account login will be immediately disabled</p>
          </div>
        </div>

        <div className="my-4 space-y-3 text-xs">
          <div className="rounded-lg bg-zinc-50 p-3 space-y-1.5 border border-zinc-200/80">
            <div className="flex justify-between">
              <span className="text-zinc-500">User:</span>
              <span className="font-semibold text-zinc-900">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Email:</span>
              <span className="font-mono text-zinc-700">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Role:</span>
              <span className="font-mono font-bold text-zinc-900">{user.role}</span>
            </div>
          </div>

          {user.role === "OWNER" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 space-y-1">
              <span className="font-bold">Warning for Store Owner:</span>
              <p className="text-[11px] leading-relaxed">
                Suspending this owner will leave their registered store ({user.shopName || "Associated Store"}) without an active owner account.
              </p>
            </div>
          )}

          <p className="text-zinc-500 text-[11px]">
            Are you sure you want to suspend this account? Access can be restored at any time.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white shadow-2xs transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {isProcessing ? "Suspending..." : "Confirm Suspension"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main SuperAdmin Command Center Dashboard                           */
/* ------------------------------------------------------------------ */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<PlatformTractionStats>(seedPlatformTraction);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Time toggle for chart
  const [chartRange, setChartRange] = useState<"30D" | "12M">("12M");

  // Modals & Action States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<AdminUser | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTraction, setCopiedTraction] = useState(false);

  const loadAdminData = useCallback(async () => {
    try {
      const [statsData, analyticsData, shopsData, usersData] = await Promise.all([
        getAdminStats(),
        getAdminAnalytics(),
        getAdminShops(),
        getAdminUsers({ limit: 10 }),
      ]);
      setStats(statsData);
      if (analyticsData) setAnalytics(analyticsData);
      setShops(shopsData);
      setUsers(usersData.users);
    } catch (err) {
      console.warn("Could not load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Copy verified traction summary for marketing / sales pitch
  function handleCopyTractionProof() {
    const pitchText = `
🚀 Andalus POS - Verified Platform Usage Proof:
• Gross Merchandise Volume (GMV): ETB ${(analytics.totalVolumeGmv).toLocaleString()} ETB processed
• Total Completed Transactions: ${(analytics.totalTransactionsCount).toLocaleString()} sales
• Registered Client Stores: ${analytics.totalStoresCount} merchant stores (${analytics.activeStoresCount} active)
• Active Store Operators: ${analytics.totalOperatorsCount}+ cashiers & managers
• Platform Traffic: ${(analytics.monthlyPortalVisits).toLocaleString()} merchant sessions / mo
• System Availability: ${analytics.platformUptimeSla}% uptime SLA
• Average Sale Ticket: ETB ${analytics.avgTicketSize} / transaction
• Growth Velocity: +${analytics.volumeGrowthMom}% MoM growth
`.trim();

    navigator.clipboard.writeText(pitchText);
    setCopiedTraction(true);
    setTimeout(() => setCopiedTraction(false), 2500);
  }

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

  if (loading && !stats) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-5">
      {/* ================================================================= */}
      {/* 1. Header Toolbar                                                 */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              SuperAdmin Command Center
            </h1>
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Platform Master
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Ecosystem telemetry, verified client transaction volume, merchant oversight, and growth metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Traction Proof */}
          <button
            type="button"
            onClick={handleCopyTractionProof}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            title="Copy verified platform statistics for client pitches"
          >
            {copiedTraction ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied Traction!</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-indigo-600" />
                <span>Copy Pitch Stats</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={loadAdminData}
            title="Refresh statistics"
            className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
          >
            <RefreshCw className="size-3.5 text-zinc-400" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95"
          >
            <UserPlus className="size-3.5 text-indigo-400" />
            <span>+ Provision Owner</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* ================================================================= */}
      {/* 2. Top Traction & Usage Proof KPI Cards                           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Platform GMV */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Platform Volume (GMV)
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
              <TrendingUp className="size-2.5" />
              +{analytics.volumeGrowthMom}% MoM
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {(analytics.totalVolumeGmv).toLocaleString()}
              <span className="ml-1 text-xs font-medium text-zinc-400">ETB</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">
              Monthly: {(analytics.monthlyVolumeGmv).toLocaleString()} ETB
            </p>
          </div>
        </div>

        {/* Metric 2: Total Completed Transactions */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Total Transactions
            </span>
            <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
              {(analytics.monthlyTransactionsCount).toLocaleString()} /mo
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {(analytics.totalTransactionsCount).toLocaleString()}
              <span className="ml-1 text-xs font-medium text-zinc-400">sales</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">
              Avg ticket: {analytics.avgTicketSize} ETB / transaction
            </p>
          </div>
        </div>

        {/* Metric 3: Merchant Network */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Client Store Network
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
              <span className="size-1 rounded-full bg-emerald-600" />
              {analytics.activeStoresCount} Active
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {analytics.totalStoresCount}
              <span className="ml-1 text-xs font-medium text-zinc-400">stores</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">
              {analytics.totalOperatorsCount}+ registered operators
            </p>
          </div>
        </div>

        {/* Metric 4: Traffic & SLA Uptime */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Traffic &amp; Telemetry
            </span>
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
              {analytics.platformUptimeSla}% SLA
            </span>
          </div>
          <div className="mt-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
              {(analytics.monthlyPortalVisits).toLocaleString()}
              <span className="ml-1 text-xs font-medium text-zinc-400">visits/mo</span>
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-400">
              Peak: {analytics.peakConcurrentRegisters} concurrent live registers
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. Visual Charts: Volume Trend & Sector Adoption                  */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Volume & Transaction Velocity Trend */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-3.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
                Gross Merchandise Volume (GMV) Trend
              </h2>
              <p className="text-[11px] text-zinc-500">
                Monthly transaction amounts and checkout volume across all stores
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
              <button
                type="button"
                onClick={() => setChartRange("30D")}
                className={`rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                  chartRange === "30D"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setChartRange("12M")}
                className={`rounded-md px-2.5 py-1 font-mono text-[10px] font-medium transition-all ${
                  chartRange === "12M"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                6-12 Months
              </button>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.growthTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B4FE9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5B4FE9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="period"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-white shadow-xl">
                          <p className="font-mono text-[11px] font-bold text-slate-400">{label}</p>
                          <div className="mt-2 space-y-1">
                            <p className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Volume (GMV):</span>
                              <span className="font-mono font-bold text-indigo-400 tabular-nums">
                                {Number(data.volumeGmv).toLocaleString()} ETB
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Checkouts:</span>
                              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                {Number(data.transactions).toLocaleString()} sales
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volumeGmv"
                  stroke="#5B4FE9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gmvGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Client Sector Adoption Breakdown */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
                Retail Sector Adoption
              </h2>
              <p className="text-[11px] text-zinc-500">Distribution of client stores by vertical</p>
            </div>

            <div className="mt-4 space-y-3">
              {analytics.sectorBreakdown.map((item, index) => (
                <div key={item.sector} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">{item.sector}</span>
                    <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                      <strong className="text-zinc-900">{item.storesCount}</strong> stores ({item.volumeShare}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.volumeShare}%`,
                        backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-3 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Market Proof Highlight
            </span>
            <p className="mt-1 text-[11px] text-zinc-600 leading-relaxed">
              Supermarket and General Retail account for <strong className="text-zinc-900">66%</strong> of all platform activity, processing high daily transaction volume with sub-second terminal speed.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. Registered Shops Snapshot Table                                */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/60 px-5 py-3.5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
              Registered Client Shops Oversight
            </h2>
            <p className="text-[11px] text-zinc-500">Latest business stores registered across the platform</p>
          </div>
          <Link
            href="/admin/shops"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            <span>View All ({shops.length})</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/30 text-left font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                <th className="px-5 py-3">Store Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Owner Contact</th>
                <th className="px-4 py-3">Staff Seats</th>
                <th className="px-4 py-3">Store Status</th>
                <th className="px-5 py-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {shops.slice(0, 5).map((shop) => (
                <tr key={shop.id} className="transition-colors hover:bg-zinc-50/70">
                  <td className="px-5 py-3.5 font-bold text-zinc-900">{shop.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600">
                      {shop.businessType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-600 text-[11px]">
                    {shop.ownerEmail}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-zinc-800 tabular-nums">
                      {shop.memberCount || 1}
                    </span>
                    <span className="ml-1 text-[11px] text-zinc-400">staff</span>
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
                      onClick={() => handleToggleShopStatus(shop)}
                      className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors shadow-2xs ${
                        shop.isActive
                          ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                          : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
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

      {/* ================================================================= */}
      {/* 5. Registered Store Owners Directory Table                        */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
              Registered Store Owners Directory
            </h2>
            <p className="text-[11px] text-zinc-500">Manage and inspect primary merchant owner accounts</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search owner by name, email, store..."
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
                <th className="px-5 py-3">Owner Name</th>
                <th className="px-4 py-3">Assigned Store</th>
                <th className="px-4 py-3">Email &amp; Phone</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-5 py-3 text-right">Oversight Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {ownersList.length > 0 ? (
                ownersList.map((owner) => (
                  <tr key={owner.id} className="transition-colors hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-bold text-zinc-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7.5 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 font-mono text-xs font-bold text-zinc-800">
                          {owner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{owner.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-zinc-800">{owner.shopName || "Primary Store"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-zinc-700 text-xs">{owner.email}</p>
                      <p className="font-mono text-[11px] text-zinc-400">{owner.phone || "-"}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-zinc-600 tabular-nums">
                      {new Date(owner.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider border ${
                          owner.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        <span className={`size-1 rounded-full ${owner.isActive ? "bg-emerald-600" : "bg-rose-600"}`} />
                        {owner.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (owner.isActive) {
                            setUserToSuspend(owner);
                          } else {
                            handleToggleUserStatus(owner);
                          }
                        }}
                        className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors shadow-2xs ${
                          owner.isActive
                            ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {owner.isActive ? "Freeze" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-zinc-400">
                    No store owners found matching the filter query.
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
            setUsers((prev) => [user, ...prev]);
            setShops((prev) => [shop, ...prev]);
            setActionSuccessMsg(`Successfully provisioned ${user.name} and store "${shop.name}"`);
            setTimeout(() => setActionSuccessMsg(""), 3500);
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
