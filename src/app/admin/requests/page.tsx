"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Crown,
  Eye,
  Mail,
  Phone,
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

import { LoadingState } from "@/components/shared/loading-state";
import {
  activateUser,
  getAdminShops,
  getAdminUsers,
  registerOwnerByAdmin,
  suspendUser,
} from "@/lib/api/admin";
import type {
  AdminShop,
  AdminUser,
  RegisterOwnerInput,
} from "@/lib/api/types";

/* ------------------------------------------------------------------ */
/* Modal: Register New Owner                                          */
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
/* Modal: View Owner Details & Assigned Shops                          */
/* ------------------------------------------------------------------ */
function ViewOwnerModal({
  owner,
  shops,
  onClose,
}: {
  owner: AdminUser;
  shops: AdminShop[];
  onClose: () => void;
}) {
  const ownedShops = shops.filter((s) => s.ownerId === owner.id || s.ownerEmail === owner.email);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold">
              <Crown className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Shop Owner Profile</h2>
              <p className="text-xs text-[#6b7280]">Account details and registered businesses</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs">
          {/* Owner Info Box */}
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Full Name:</span>
              <span className="font-bold text-[#111827]">{owner.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Email:</span>
              <span className="font-mono text-[#111827]">{owner.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Phone:</span>
              <span className="text-[#111827]">{owner.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Role:</span>
              <span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700">{owner.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Account Status:</span>
              <span className={`font-bold ${owner.isActive ? "text-emerald-600" : "text-red-600"}`}>
                {owner.isActive ? "Active Account" : "Suspended"}
              </span>
            </div>
          </div>

          {/* Owned Shops List */}
          <div>
            <h3 className="text-xs font-bold text-[#111827] mb-2">Registered Businesses ({ownedShops.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ownedShops.length > 0 ? (
                ownedShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between rounded-xl border border-[#e5e7eb] p-3 bg-white hover:bg-[#f9fafb]"
                  >
                    <div>
                      <h4 className="font-bold text-[#111827]">{shop.name}</h4>
                      <p className="text-[11px] text-[#6b7280]">{shop.businessType} · {shop.memberCount || 1} Staff members</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        shop.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {shop.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#e5e7eb] p-4 text-center text-xs text-[#9ca3af]">
                  No shops registered under this owner.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#f3f4f6] pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#111827] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Owner Registrations & Requests Page Component                  */
/* ------------------------------------------------------------------ */
export default function AdminRequestsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewingOwner, setViewingOwner] = useState<AdminUser | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [usersRes, shopsRes] = await Promise.all([
        getAdminUsers({ role: "OWNER", limit: 50 }),
        getAdminShops(),
      ]);
      setUsers(usersRes.users);
      setShops(shopsRes);
    } catch (err) {
      console.warn("Could not load owner requests:", err);
      setUsers([]);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered list of Owners
  const filteredOwners = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== "OWNER") return false;
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "SUSPENDED" && u.isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesShop = u.shopName?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesShop) return false;
      }
      return true;
    });
  }, [users, statusFilter, searchQuery]);

  async function handleToggleStatus(owner: AdminUser) {
    try {
      if (owner.isActive) {
        const res = await suspendUser(owner.id);
        if (res.warning) {
          setActionSuccessMsg(`Owner suspended. Warning: ${res.warning}`);
        } else {
          setActionSuccessMsg(`Owner ${owner.name} suspended.`);
        }
      } else {
        await activateUser(owner.id);
        setActionSuccessMsg(`Owner ${owner.name} reactivated.`);
      }
      await loadData();
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
              <UserPlus className="size-4" />
            </span>
            <h1 className="text-xl font-bold text-[#111827]">Shop Owner Registrations & Provisioning</h1>
          </div>
          <p className="text-xs text-[#6b7280]">
            Review, provision, and oversee primary shop owner accounts across the platform
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh list"
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

      {/* Success Notification Toast */}
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

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#6b7280]">Total Registered Owners</span>
          <div className="mt-2 text-2xl font-bold text-[#111827]">{users.length}</div>
          <span className="text-[11px] text-[#6b7280]">Store owners registered platform-wide</span>
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#6b7280]">Active Store Owners</span>
          <div className="mt-2 text-2xl font-bold text-[#16a34a]">
            {users.filter((u) => u.isActive).length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Authorized for shop operation</span>
        </div>
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-[#6b7280]">Suspended Store Owners</span>
          <div className="mt-2 text-2xl font-bold text-[#dc2626]">
            {users.filter((u) => !u.isActive).length}
          </div>
          <span className="text-[11px] text-red-600 font-medium">Frozen owner accounts</span>
        </div>
      </div>

      {/* Toolbar & Filters */}
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
                    ? "bg-[#111827] text-white shadow-sm"
                    : "border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
                }`}
              >
                {tab === "ALL" ? "All Owners" : tab === "ACTIVE" ? "Active Owners" : "Suspended"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by owner name, email, shop..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        {/* Owners Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
              <tr>
                <th className="pb-3">Owner Profile</th>
                <th className="pb-3">Primary Store</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Joined Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filteredOwners.length > 0 ? (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-[#f9fafb]">
                    <td className="py-3 font-bold text-[#111827]">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {owner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{owner.name}</span>
                          <span className="block font-normal text-[11px] text-[#6b7280]">{owner.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-[#6b7280]" />
                        <span className="font-semibold text-[#374151]">{owner.shopName || "Primary Shop"}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[#6b7280]">
                      {owner.phone || "-"}
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingOwner(owner)}
                          title="View Owner Details"
                          className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 py-1 text-[11px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                        >
                          <Eye className="size-3.5 text-[#6b7280]" />
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(owner)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            owner.isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {owner.isActive ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#9ca3af]">
                    No shop owners found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Container */}
      {isRegisterModalOpen && (
        <RegisterOwnerModal
          onClose={() => setIsRegisterModalOpen(false)}
          onRegistered={(user, shop) => {
            setActionSuccessMsg(`Successfully registered owner ${user.name} and shop ${shop.name}!`);
            loadData();
          }}
        />
      )}

      {viewingOwner && (
        <ViewOwnerModal
          owner={viewingOwner}
          shops={shops}
          onClose={() => setViewingOwner(null)}
        />
      )}
    </div>
  );
}
