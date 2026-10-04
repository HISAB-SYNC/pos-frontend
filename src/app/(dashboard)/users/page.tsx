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
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
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
/* Modal: Add / Provision Team Member                                 */
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
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch {
      setErrorMsg("Failed to provision account. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Provision Team Member</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Create staff credentials and assign system operational roles</p>
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
          {/* Identity Fields */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dawit Haile"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Email / Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. dawit@store.com"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Role Selection Box */}
          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-4 space-y-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              Assign System Role
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {allowedRoles.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <label
                    key={r.role}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors shadow-2xs ${
                      isSelected
                        ? "border-zinc-900 bg-white text-zinc-900 ring-1 ring-zinc-900"
                        : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={isSelected}
                      onChange={() => handleRoleChange(r.role)}
                      className="mt-0.5 size-4 text-zinc-900 focus:ring-zinc-900"
                    />
                    <div>
                      <p className="font-semibold text-zinc-900">{r.label}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {r.role === "ADMIN"
                          ? "Shop operations, inventory adjustments, and seller oversight"
                          : "Point of sale checkout, receipts, and customer sales"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {currentUserRole === "ADMIN" && (
              <p className="font-mono text-[10px] text-zinc-500 italic">
                Note: As a Shop Administrator, your authority allows provisioning Sellers and Cashiers.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Provisioning..." : "Provision Member"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
              <KeyRound className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900">Reset Password</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Account: <span className="font-semibold text-zinc-800">{member.name}</span>
              </p>
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

        <form onSubmit={handleSubmit} className="my-4 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95"
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
  currentUserRole,
}: {
  member: TeamMember | null;
  onClose: () => void;
  onUpdated: (log: AuditLogRecord, updatedMember?: TeamMember) => void;
  shopId: string;
  currentUserRole: Role;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("SALES");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedRoles = useMemo(
    () => getAllowedRolesToCreate(currentUserRole),
    [currentUserRole]
  );

  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setEmail(member.email || "");
      setPhone(member.phone || "");
      const normalizedRole: Role =
        member.role === "Shop Sale" || member.role === "SALES"
          ? "SALES"
          : member.role === "Shop Admin" || member.role === "ADMIN"
          ? "ADMIN"
          : (member.role as Role) || "SALES";
      setRole(normalizedRole);
    }
  }, [member]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await updateTeamMember(shopId, member.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
      });

      const auditLog: AuditLogRecord = {
        id: `aud-${Date.now()}`,
        userId: "current-user",
        userName: "You",
        userRole: currentUserRole,
        action: "ROLE_CHANGED",
        resource: `TeamMember: ${name}`,
        timestamp: new Date().toISOString(),
        details: `Updated details for ${name} (${role})`,
        previousValue: member.role,
        newValue: role,
      };

      onUpdated(auditLog, updated);
      onClose();
    } catch {
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Edit Member Profile</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Update staff contact particulars and role permissions</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-semibold text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
              Assigned System Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-semibold text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              {allowedRoles.length > 0 ? (
                allowedRoles.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label} ({r.role})
                  </option>
                ))
              ) : (
                <>
                  <option value="SALES">Seller / Cashier (SALES)</option>
                  <option value="ADMIN">Shop Admin (ADMIN)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200/80 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3.5 flex size-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
          <Trash2 className="size-4.5" />
        </div>
        <h3 className="text-base font-bold tracking-tight text-zinc-900">Revoke Store Access</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Are you sure you want to remove <span className="font-semibold text-zinc-900">{member.name}</span> ({member.role})? Their POS and dashboard permissions will be permanently revoked.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200/80 bg-white px-3.5 py-2 font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-md bg-rose-600 px-3.5 py-2 font-semibold text-white shadow-2xs hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? "Removing..." : "Remove Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Role Badge Helper                                                  */
/* ------------------------------------------------------------------ */
function TeamRoleBadge({ role }: { role: string }) {
  const isOwner = role === "Owner" || role === "OWNER";
  const isAdmin = role === "Shop Admin" || role === "ADMIN";

  if (isOwner) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-700">
        <Shield className="size-2.5" />
        Owner
      </span>
    );
  }

  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-700">
        <ShieldCheck className="size-2.5" />
        Admin
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
      <UserCheck className="size-2.5" />
      Sales / Cashier
    </span>
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

  const activeStaffCount = members.filter(
    (m) => m.status !== "Suspended" && m.status !== "Inactive"
  ).length;

  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <div className="space-y-5">
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
          currentUserRole={(authUser?.role as Role) || "OWNER"}
          onUpdated={(log, updated) => {
            if (updated) {
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === updated.id
                    ? {
                        ...m,
                        ...updated,
                        role: updated.role || m.role,
                      }
                    : m
                )
              );
            } else if (memberToEditDetails) {
              setMembers((prev) =>
                prev.map((m) =>
                  m.id === memberToEditDetails.id
                    ? {
                        ...m,
                        role:
                          log.newValue === "ADMIN"
                            ? "Shop Admin"
                            : log.newValue === "SALES"
                            ? "Shop Sale"
                            : log.newValue || m.role,
                      }
                    : m
                )
              );
            }
            loadData();
            setAuditLogs((prev) => [log, ...prev]);
            setActionSuccessMsg(`Updated profile details for staff member`);
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
            setActionSuccessMsg(`Employee account removed from store`);
            setTimeout(() => setActionSuccessMsg(""), 3500);
          }}
          shopId={activeShopId}
        />

        {/* ================================================================= */}
        {/* 1. Header Toolbar & Action Trigger                                */}
        {/* ================================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Team &amp; Access Control
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Manage store employees, configure RBAC role permissions, and review security audit logs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={activeTab === "DIRECTORY" ? handleExportDirectory : handleExportAuditLogs}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <Download className="size-3.5 text-zinc-400" />
              <span>{activeTab === "DIRECTORY" ? "Export Directory" : "Export Logs"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95"
            >
              <UserPlus className="size-3.5 text-indigo-400" />
              <span>Provision Member</span>
            </button>
          </div>
        </div>

        {/* Success Notification */}
        {actionSuccessMsg && (
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
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

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Total Team
              </span>
              <Users className="size-4 text-zinc-400" />
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {members.length}
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">Staff assigned to this store</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Store Admins
              </span>
              <ShieldCheck className="size-4 text-indigo-500" />
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-bold tracking-tight text-indigo-700 tabular-nums">
                {members.filter((m) => m.role === "Shop Admin" || m.role === "ADMIN").length}
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">Inventory &amp; staff supervision</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Sellers &amp; Cashiers
              </span>
              <UserCheck className="size-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {members.filter((m) => m.role === "Shop Sale" || m.role === "SALES").length}
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">POS checkout &amp; orders</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                Active Staff
              </span>
              <Activity className="size-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 tabular-nums">
                {activeStaffCount}
              </div>
              <p className="mt-1 font-mono text-[11px] text-zinc-400">Authorized active accounts</p>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. Main Workspace (Directory vs Audit Logs)                        */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Top Segmented Bar & Search */}
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Navigation Tabs */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("DIRECTORY")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "DIRECTORY"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Users className="size-3.5" />
                <span>Team Directory</span>
                <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  {members.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("AUDIT_LOGS")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "AUDIT_LOGS"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <History className="size-3.5" />
                <span>Activity &amp; Audit Logs</span>
                <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  {auditLogs.length}
                </span>
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, email, or role..."
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

          {/* Tab 1: Team Directory Table */}
          {activeTab === "DIRECTORY" && (
            <div>
              {/* Role Sub-filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/40 px-5 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Role Filter:
                  </span>
                  {[
                    { id: "ALL", label: "All Roles" },
                    { id: "ADMIN", label: "Shop Admins" },
                    { id: "SALES", label: "Sellers / Cashiers" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRoleFilter(tab.id)}
                      className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                        roleFilter === tab.id
                          ? "bg-zinc-900 text-white font-semibold shadow-2xs"
                          : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="font-mono text-xs text-zinc-500">
                  Showing <span className="font-bold text-zinc-900">{filteredMembers.length}</span>{" "}
                  {filteredMembers.length === 1 ? "staff member" : "staff members"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Role Capabilities</th>
                      <th className="px-4 py-3">Joined Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
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
                          <tr key={m.id} className="transition-colors hover:bg-zinc-50/70">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-100 font-mono text-xs font-bold text-zinc-800">
                                  {m.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-zinc-900">{m.name}</span>
                                  <span className="block font-mono text-[11px] text-zinc-500">
                                    {m.email} {m.phone ? `• ${m.phone}` : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <TeamRoleBadge role={m.role} />
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
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
                            <td className="px-4 py-3.5 font-mono text-xs text-zinc-600 tabular-nums">
                              {m.joinedDate}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider border ${
                                  isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                              >
                                <span
                                  className={`size-1 rounded-full ${
                                    isActive ? "bg-emerald-600" : "bg-rose-600"
                                  }`}
                                />
                                {isActive ? "Active" : "Suspended"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {canModify ? (
                                <div className="flex items-center justify-end gap-1.5 text-zinc-500">
                                  <button
                                    type="button"
                                    onClick={() => setMemberToEditDetails(m)}
                                    title="Edit employee details"
                                    className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMemberToResetPassword(m)}
                                    title="Reset password"
                                    className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                                  >
                                    <KeyRound className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(m)}
                                    className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors shadow-2xs ${
                                      isActive
                                        ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                  >
                                    {isActive ? "Suspend" : "Activate"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMemberToDelete(m)}
                                    title="Revoke access"
                                    className="flex size-7 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                                  Owner Account
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-zinc-400">
                          No team members found matching the filter criteria.
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
              <table className="w-full min-w-[760px] text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-left font-mono text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target Resource</th>
                    <th className="px-5 py-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-zinc-50/70">
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-600 tabular-nums">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900">{log.userName}</span>
                          <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-zinc-700">
                            {log.userRole}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                            log.action.includes("CREATED")
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : log.action.includes("DEACTIVATED")
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : log.action.includes("PRICE") || log.action.includes("STOCK")
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-indigo-200 bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-700">{log.resource}</td>
                      <td className="px-5 py-3.5 text-zinc-600">
                        <p>{log.details}</p>
                        {log.previousValue && log.newValue && (
                          <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                            <span className="line-through">{log.previousValue}</span> →{" "}
                            <span className="font-semibold text-emerald-600">{log.newValue}</span>
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
      </div>
    </RouteGuard>
  );
}
