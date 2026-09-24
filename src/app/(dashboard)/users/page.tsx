"use client";

import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit2,
  History,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AccessDenied } from "@/components/shared/access-denied";
import { RouteGuard } from "@/components/shared/route-guard";
import { LoadingState } from "@/components/shared/loading-state";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  getTeamSummary,
  updateTeamMember,
} from "@/lib/api/app-data";
import type { AuditLogRecord, TeamMember, TeamSummary } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";

import {
  type AppPermission,
  DEFAULT_ROLE_PERMISSIONS,
  getAllowedPermissionsToAssign,
  getAllowedRolesToCreate,
  canManageRole,
} from "@/lib/permissions/rbac";
import type { Role } from "@/lib/permissions/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Seed Audit Logs Data                                               */
/* ------------------------------------------------------------------ */
const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: "aud-1",
    userId: "u-1",
    userName: "Alex Owner",
    userRole: "OWNER",
    action: "PERMISSION_UPDATED",
    resource: "TeamMember: Sara Admin",
    timestamp: "2026-08-29T13:45:00Z",
    details: "Granted 'reports.view_sales' and 'inventory.adjust'",
    previousValue: "Basic Admin Rights",
    newValue: "Custom Extended Permissions",
  },
  {
    id: "aud-2",
    userId: "u-2",
    userName: "Sara Admin",
    userRole: "ADMIN",
    action: "USER_CREATED",
    resource: "TeamMember: Dawit Seller",
    timestamp: "2026-08-29T11:20:00Z",
    details: "Created Seller account with POS & Customer checkout permissions",
    newValue: "Role: SALES (Active)",
  },
  {
    id: "aud-3",
    userId: "u-1",
    userName: "Alex Owner",
    userRole: "OWNER",
    action: "PRICE_CHANGED",
    resource: "Product: Whole Milk 1L",
    timestamp: "2026-08-28T16:10:00Z",
    details: "Modified retail selling price",
    previousValue: "ETB 85.00",
    newValue: "ETB 90.00",
  },
  {
    id: "aud-4",
    userId: "u-3",
    userName: "Dawit Seller",
    userRole: "SALES",
    action: "SALE_COMPLETED",
    resource: "Sale #1084",
    timestamp: "2026-08-28T14:30:00Z",
    details: "Completed checkout with Debt/Credit (ETB 1,200.00)",
    newValue: "Customer: Ahmed Ali",
  },
  {
    id: "aud-5",
    userId: "u-1",
    userName: "Alex Owner",
    userRole: "OWNER",
    action: "STOCK_ADJUSTED",
    resource: "Product: Fresh White Bread",
    timestamp: "2026-08-27T09:15:00Z",
    details: "Manual inventory write-off for damaged batch",
    previousValue: "50 pcs",
    newValue: "42 pcs (-8 pcs)",
  },
];

/* ------------------------------------------------------------------ */
/* Modal: Add / Provision Team Member with Permission Assignment      */
/* ------------------------------------------------------------------ */
function AddTeamMemberModal({
  open,
  onClose,
  onCreated,
  shopId,
  currentUserRole,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (member: TeamMember, log: AuditLogRecord) => void;
  shopId: string;
  currentUserRole: Role;
}) {
  const allowedRoles = useMemo(() => getAllowedRolesToCreate(currentUserRole), [currentUserRole]);
  const defaultRole = allowedRoles[0]?.role || "SALES";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>(defaultRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleRoleChange(newRole: Role) {
    setSelectedRole(newRole);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const newMember: TeamMember = {
        id: `usr-${Date.now()}`,
        shopId,
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
        phone,
        role: selectedRole,
        status: "Active",
        joinedDate: new Date().toISOString().split("T")[0],
        lastLogin: "Never",
        permissions: DEFAULT_ROLE_PERMISSIONS[selectedRole] || [],
      };

      const auditLog: AuditLogRecord = {
        id: `aud-${Date.now()}`,
        userId: "current-user",
        userName: "You",
        userRole: currentUserRole,
        action: "USER_CREATED",
        resource: `TeamMember: ${name.trim()}`,
        timestamp: new Date().toISOString(),
        details: `Provisioned account with role ${selectedRole}`,
        newValue: `Role: ${selectedRole} (Active)`,
      };

      await createTeamMember(shopId, {
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        role: newMember.role,
        password,
      });

      onCreated(newMember, auditLog);
      onClose();
    } catch {
      setErrorMsg("Failed to provision account. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Add Team Member</h2>
              <p className="text-xs text-[#6b7280]">Create a new staff member and assign their role</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
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
          {/* Identity Fields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dawit Haile"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Email / Username *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. dawit@store.com"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 123 4567"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Initial Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection Box */}
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5 space-y-2">
            <label className="block font-bold text-[#111827]">Assign Employee Role</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {allowedRoles.map((r) => (
                <label
                  key={r.role}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                    selectedRole === r.role
                      ? "border-[#2563eb] bg-blue-50/50 text-[#1e40af]"
                      : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === r.role}
                    onChange={() => handleRoleChange(r.role)}
                    className="size-4 text-[#2563eb]"
                  />
                  <div>
                    <p className="font-bold">{r.label}</p>
                    <p className="text-[11px] text-[#6b7280]">
                      {r.role === "ADMIN"
                        ? "Shop oversight, product catalog & seller management"
                        : "Sales checkout, POS operations & customer orders"}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {currentUserRole === "ADMIN" && (
              <p className="text-[11px] text-[#6b7280] italic">
                ℹ️ As a Shop Admin, you have authority to create and manage Sellers/Cashiers.
              </p>
            )}
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
              className="flex items-center gap-1.5 rounded-xl bg-[#c0e763] px-5 py-2 font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Adding Member..." : "Add Team Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Password Reset                                              */
/* ------------------------------------------------------------------ */
function ResetPasswordModal({
  member,
  onClose,
  onReset,
}: {
  member: TeamMember;
  onClose: () => void;
  onReset: (log: AuditLogRecord) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return;

    setIsSaving(true);
    const auditLog: AuditLogRecord = {
      id: `aud-${Date.now()}`,
      userId: "current-user",
      userName: "You",
      userRole: "OWNER",
      action: "PASSWORD_RESET",
      resource: `TeamMember: ${member.name}`,
      timestamp: new Date().toISOString(),
      details: "Administrator forced password reset for employee account",
      newValue: "Credentials Updated",
    };

    onReset(auditLog);
    setIsSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-2.5 border-b border-[#f3f4f6] pb-3.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <KeyRound className="size-4.5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111827]">Reset Employee Password</h2>
            <p className="text-xs text-[#6b7280]">Account: {member.name} ({member.email})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-[#374151]">New Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 focus:border-[#2563eb] focus:outline-none"
            />
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
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#c0e763] px-5 py-2 font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Staff Member Details                                   */
/* ------------------------------------------------------------------ */
function EditMemberDetailsModal({
  member,
  onClose,
  onUpdated,
  shopId,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onUpdated: (log: AuditLogRecord) => void;
  shopId: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Shop Sale");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
      setRole(member.role || "Shop Sale");
    }
  }, [member]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateTeamMember(shopId, member.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
      });


      const auditLog: AuditLogRecord = {
        id: `aud-${Date.now()}`,
        userId: "current-user",
        userName: "You",
        userRole: "ADMIN",
        action: "ROLE_CHANGED",
        resource: `TeamMember: ${name}`,
        timestamp: new Date().toISOString(),
        details: `Updated details for ${name} (${role})`,
        previousValue: member.role,
        newValue: role,
      };

      onUpdated(auditLog);
      onClose();
    } catch {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!member) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3.5">
          <h2 className="text-base font-bold text-[#111827]">Edit Employee Profile</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-[#374151]">Full Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 font-semibold text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[#374151]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[#374151]">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[#374151]">Assigned System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#e5e7eb] px-3 text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              <option value="Shop Sale">Shop Sale (POS & Checkout)</option>
              <option value="Shop Admin">Shop Admin (Management)</option>
            </select>
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
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#c0e763] px-5 py-2 font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Delete Staff Confirmation Dialog                            */
/* ------------------------------------------------------------------ */
function DeleteStaffDialog({
  member,
  onClose,
  onDeleted,
  shopId,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onDeleted: (log: AuditLogRecord) => void;
  shopId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (!member) return;
    setIsDeleting(true);
    try {
      await deleteTeamMember(shopId, member.id);
      const auditLog: AuditLogRecord = {
        id: `aud-${Date.now()}`,
        userId: "current-user",
        userName: "You",
        userRole: "ADMIN",
        action: "USER_DEACTIVATED",
        resource: `TeamMember: ${member.name}`,
        timestamp: new Date().toISOString(),
        details: `Employee account ${member.name} (${member.email}) was removed`,
        previousValue: "Active",
        newValue: "Deleted",
      };
      onDeleted(auditLog);
      onClose();
    } catch {
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  if (!member) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">Remove Employee</h3>
        <p className="mt-1 text-xs text-[#6b7280]">
          Are you sure you want to remove <span className="font-semibold text-[#111827]">{member.name}</span> ({member.role})? Their store access will be permanently revoked.
        </p>

        <div className="mt-5 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Removing..." : "Remove Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Main User Management & RBAC Page                                   */
/* ------------------------------------------------------------------ */
export default function UsersPage() {
  const authUser = useAuthStore((state) => state.user);
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "AUDIT_LOGS">("DIRECTORY");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToEditDetails, setMemberToEditDetails] = useState<TeamMember | null>(null);
  const [memberToResetPassword, setMemberToResetPassword] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  function handleExportDirectory() {
    exportToCsv("staff-directory", filteredMembers, [
      { header: "Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Phone", key: "phone" },
      { header: "Role", key: "role" },
      { header: "Status", key: "status" },
      { header: "Joined Date", key: "joinedDate" },
      { header: "Last Login", key: "lastLogin" },
    ]);
  }

  function handleExportAuditLogs() {
    exportToCsv("rbac-audit-logs", auditLogs, [
      { header: "Timestamp", key: "timestamp" },
      { header: "Actor", key: "userName" },
      { header: "Action", key: "action" },
      { header: "Resource", key: "resource" },
      { header: "Details", key: "details" },
      { header: "Previous Value", key: "previousValue" },
      { header: "New Value", key: "newValue" },
    ]);
  }


  const loadData = useCallback(async () => {
    try {
      const [membersData, summaryData] = await Promise.all([
        getTeamMembers(activeShopId),
        getTeamSummary(activeShopId),
      ]);
      setMembers(membersData);
      setSummary(summaryData);
    } catch (err) {
      console.warn("Could not load user data:", err);
      setMembers([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Hierarchical Access Check: If user is SALES, block access with 403 screen!
  if (authUser?.role === "SALES") {
    return (
      <AccessDenied
        requiredRole="OWNER or ADMIN"
        requiredPermission="user.view, seller.manage"
        description="Cashiers / Sales personnel are not authorized to access employee accounts or role configuration."
      />
    );
  }

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Role filter
      if (roleFilter !== "ALL") {
        const isMatch =
          (roleFilter === "ADMIN" && (m.role === "Shop Admin" || m.role === "ADMIN")) ||
          (roleFilter === "SALES" && (m.role === "Shop Sale" || m.role === "SALES")) ||
          (roleFilter === "OWNER" && (m.role === "Owner" || m.role === "OWNER"));
        if (!isMatch) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, roleFilter, searchQuery]);

  function handleToggleStatus(member: TeamMember) {
    const isCurrentlyActive = member.status !== "Suspended" && member.status !== "Inactive";
    const newStatus = isCurrentlyActive ? "Suspended" : "Active";

    const updated = members.map((m) =>
      m.id === member.id ? { ...m, status: newStatus as "Active" | "Suspended" } : m,
    );
    setMembers(updated);

    const log: AuditLogRecord = {
      id: `aud-${Date.now()}`,
      userId: "current-user",
      userName: "You",
      userRole: authUser?.role || "ADMIN",
      action: isCurrentlyActive ? "USER_DEACTIVATED" : "USER_ACTIVATED",
      resource: `TeamMember: ${member.name}`,
      timestamp: new Date().toISOString(),
      details: `Account status updated to ${newStatus}`,
      previousValue: member.status || "Active",
      newValue: newStatus,
    };
    setAuditLogs((prev) => [log, ...prev]);
    setActionSuccessMsg(`Updated account status for ${member.name} to ${newStatus}`);
    setTimeout(() => setActionSuccessMsg(""), 3500);
  }

  if (loading && members.length === 0) {
    return <LoadingState />;
  }

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="space-y-6">
      {/* Modals */}
      <AddTeamMemberModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currentUserRole={(authUser?.role as Role) || "ADMIN"}
        onCreated={(newM, log) => {
          setMembers((prev) => [newM, ...prev]);
          setAuditLogs((prev) => [log, ...prev]);
          setActionSuccessMsg(`Created employee account for ${newM.name}`);
          setTimeout(() => setActionSuccessMsg(""), 3500);
        }}
        shopId={activeShopId}
      />

      <EditMemberDetailsModal
        member={memberToEditDetails}
        onClose={() => setMemberToEditDetails(null)}
        onUpdated={(log) => {
          loadData();
          setAuditLogs((prev) => [log, ...prev]);
          setActionSuccessMsg(`Updated profile details`);
          setTimeout(() => setActionSuccessMsg(""), 3500);
        }}
        shopId={activeShopId}
      />

      {memberToResetPassword && (
        <ResetPasswordModal
          member={memberToResetPassword}
          onClose={() => setMemberToResetPassword(null)}
          onReset={(log) => {
            setAuditLogs((prev) => [log, ...prev]);
            setActionSuccessMsg(`Reset password for ${memberToResetPassword.name}`);
            setTimeout(() => setActionSuccessMsg(""), 3500);
          }}
        />
      )}

      <DeleteStaffDialog
        member={memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onDeleted={(log) => {
          loadData();
          setAuditLogs((prev) => [log, ...prev]);
          setActionSuccessMsg(`Employee was removed`);
          setTimeout(() => setActionSuccessMsg(""), 3500);
        }}
        shopId={activeShopId}
      />

      {/* ================================================================= */}
      {/* 1. Header Toolbar & Action Trigger                                */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-950 text-[#c0e763] shadow-sm">
              <UserCog className="size-4 text-[#c0e763]" />
            </span>
            <h1 className="text-xl font-bold text-[#111827]">Employee RBAC &amp; Access Control</h1>
          </div>
          <p className="text-xs text-[#6b7280]">
            Manage store team members, configure granular permissions, and track operational audit logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={activeTab === "DIRECTORY" ? handleExportDirectory : handleExportAuditLogs}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-3.5 text-xs font-semibold text-[#374151] shadow-sm hover:bg-[#f9fafb]"
          >
            <Download className="size-3.5 text-[#6b7280]" />
            {activeTab === "DIRECTORY" ? "Export Directory" : "Export Logs"}
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#c0e763] px-4 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95"
          >
            <UserPlus className="size-4 text-zinc-950" />
            + Provision Team Member
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
          <button type="button" onClick={() => setActionSuccessMsg("")} className="text-blue-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
          <span className="text-xs font-semibold text-[#6b7280]">Total Team Members</span>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{members.length}</div>
          <span className="text-[11px] text-[#6b7280]">Staff assigned to this store</span>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
          <span className="text-xs font-semibold text-[#6b7280]">Store Administrators</span>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
            {members.filter((m) => m.role === "Shop Admin" || m.role === "ADMIN").length}
          </div>
          <span className="text-[11px] text-[#6b7280]">Operations &amp; Seller Management</span>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300">
          <span className="text-xs font-semibold text-[#6b7280]">Sellers &amp; Cashiers</span>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
            {members.filter((m) => m.role === "Shop Sale" || m.role === "SALES").length}
          </div>
          <span className="text-[11px] text-[#6b7280]">POS &amp; Sales Checkout Only</span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. Main Workspace (Directory vs Audit Logs)                        */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#f3f4f6] pb-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("DIRECTORY")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "DIRECTORY"
                  ? "bg-zinc-950 text-[#c0e763] shadow-sm"
                  : "bg-white text-[#4b5563] hover:bg-[#f9fafb] border border-[#e5e7eb]"
              }`}
            >
              <Users className="size-3.5" />
              Team Directory ({members.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("AUDIT_LOGS")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "AUDIT_LOGS"
                  ? "bg-zinc-950 text-[#c0e763] shadow-sm"
                  : "bg-white text-[#4b5563] hover:bg-[#f9fafb] border border-[#e5e7eb]"
              }`}
            >
              <History className="size-3.5" />
              Activity &amp; Audit Logs ({auditLogs.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team member or action..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        {/* Tab 1: Team Directory Table */}
        {activeTab === "DIRECTORY" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All Roles" },
                { id: "ADMIN", label: "Shop Admins" },
                { id: "SALES", label: "Sellers / Cashiers" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    roleFilter === tab.id
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-[#6b7280] hover:bg-[#f9fafb]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
                  <tr>
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Role Capabilities</th>
                    <th className="pb-3">Joined Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions &amp; Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => {
                      const isOwner = m.role === "Owner" || m.role === "OWNER";
                      const isAdmin = m.role === "Shop Admin" || m.role === "ADMIN";
                      const isSales = m.role === "Shop Sale" || m.role === "SALES";
                      const isActive = m.status !== "Suspended" && m.status !== "Inactive";

                      // Hierarchy check: Admin cannot edit other Admin or Owner!
                      const canModify =
                        authUser?.role === "OWNER" ||
                        (authUser?.role === "ADMIN" && isSales);

                      return (
                        <tr key={m.id} className="hover:bg-[#f9fafb]">
                          <td className="py-3 font-bold text-[#111827]">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7.5 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 text-xs">
                                {m.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span>{m.name}</span>
                                <span className="block font-normal text-[11px] text-[#6b7280]">{m.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isOwner
                                  ? "bg-amber-100 text-amber-800"
                                  : isAdmin
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/90 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
                              <ShieldCheck className="size-3 text-emerald-600" />
                              <span>
                                {isOwner
                                  ? "Full Shop & Staff Ownership"
                                  : isAdmin
                                  ? "Shop Operations & Inventory"
                                  : "POS Sales & Customer Checkout"}
                              </span>
                            </span>
                          </td>
                          <td className="py-3 text-[#6b7280]">{m.joinedDate}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isActive ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              />
                              {isActive ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {canModify ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setMemberToEditDetails(m)}
                                  title="Edit profile"
                                  className="rounded-lg border border-[#e5e7eb] p-1 text-[#6b7280] hover:bg-slate-100 hover:text-[#111827]"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMemberToResetPassword(m)}
                                  title="Reset password"
                                  className="rounded-lg border border-[#e5e7eb] p-1 text-[#6b7280] hover:bg-slate-100 hover:text-[#111827]"
                                >
                                  <KeyRound className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(m)}
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                    isActive
                                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                >
                                  {isActive ? "Suspend" : "Activate"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMemberToDelete(m)}
                                  title="Delete employee"
                                  className="rounded-lg border border-red-200 p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#9ca3af] italic">
                                Higher / Equal Authority
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#9ca3af]">
                        No employees found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Activity & Audit Logs Table */}

        {activeTab === "AUDIT_LOGS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#f3f4f6] text-[11px] font-semibold text-[#6b7280]">
                <tr>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Actor / User</th>
                  <th className="pb-3">Operation Action</th>
                  <th className="pb-3">Target Resource</th>
                  <th className="pb-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f9fafb]">
                    <td className="py-3 text-[#6b7280] font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-bold text-[#111827]">
                      <div className="flex items-center gap-1.5">
                        <span>{log.userName}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                          {log.userRole}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          log.action.includes("CREATED")
                            ? "bg-emerald-50 text-emerald-700"
                            : log.action.includes("DEACTIVATED")
                            ? "bg-red-50 text-red-700"
                            : log.action.includes("PRICE") || log.action.includes("STOCK")
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-[#374151]">{log.resource}</td>
                    <td className="py-3 text-[#6b7280]">
                      <p>{log.details}</p>
                      {log.previousValue && log.newValue && (
                        <p className="text-[10px] text-[#9ca3af]">
                          <span className="line-through">{log.previousValue}</span> → <span className="text-emerald-600 font-bold">{log.newValue}</span>
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* Modals Container                                                  */}
      {/* ================================================================= */}
      {isAddModalOpen && (
        <AddTeamMemberModal
          open={isAddModalOpen}
          shopId={activeShopId}
          currentUserRole={authUser?.role || "OWNER"}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={(newMember, log) => {
            setMembers((prev) => [newMember, ...prev]);
            setAuditLogs((prev) => [log, ...prev]);
            setActionSuccessMsg(`Successfully provisioned account for ${newMember.name}!`);
            setTimeout(() => setActionSuccessMsg(""), 3500);
          }}
        />
      )}

      {memberToResetPassword && (
        <ResetPasswordModal
          member={memberToResetPassword}
          onClose={() => setMemberToResetPassword(null)}
          onReset={(log) => {
            setAuditLogs((prev) => [log, ...prev]);
            setActionSuccessMsg("Password reset successfully.");
            setTimeout(() => setActionSuccessMsg(""), 3500);
          }}
        />
      )}
      </div>
    </RouteGuard>
  );
}
