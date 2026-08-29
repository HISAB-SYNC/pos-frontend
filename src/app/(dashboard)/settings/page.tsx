"use client";

import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Edit2,
  KeyRound,
  Mail,
  ShieldCheck,
  Store,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getUserProfile, updateUserProfile } from "@/lib/api/app-data";
import type { UserProfile } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

export default function SettingsPage() {
  const authUser = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeShopName = useShopStore((state) => state.activeShopName);


  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState(authUser?.name || "");
  const [email, setEmail] = useState(authUser?.email || "");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Status & Notification
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Notification preferences
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [stockThreshold, setStockThreshold] = useState("10");
  const [debtDueAlert, setDebtDueAlert] = useState(true);
  const [debtAlertDays, setDebtAlertDays] = useState("3");

  const loadProfile = useCallback(async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      if (data.name) setName(data.name);
      if (data.email) setEmail(data.email);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: { name?: string; email?: string; currentPassword?: string; newPassword?: string } = {
        name,
        email,
      };

      if (currentPassword || newPassword) {
        if (!currentPassword || !newPassword) {
          setErrorMsg("Both current password and new password are required to change your password.");
          setIsSaving(false);
          return;
        }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const updated = await updateUserProfile(payload);
      setProfile(updated);
      setCurrentPassword("");
      setNewPassword("");
      setSuccessMsg("Profile updated successfully!");

      if (accessToken && authUser) {
        setSession(
          {
            ...authUser,
            name: updated.name || authUser.name,
            email: updated.email || authUser.email,
          },
          accessToken,
        );
      }


      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update profile settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Toolbar                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Account &amp; Store Settings</h1>
          <p className="text-xs text-[#6b7280]">
            Manage your personal profile, credentials, and shop notification preferences
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg("")} className="text-red-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. Main Profile & Credentials Form                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-[#f3f4f6] pb-4">
          <h2 className="text-sm font-bold text-[#111827]">Personal Profile Information</h2>
          <p className="text-xs text-[#6b7280]">Update your display name, contact email, and security password</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
          {/* Avatar & Role Badge */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-bold text-lg shadow-sm border border-blue-100">
              {name ? name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div>
              <p className="font-bold text-[#111827] text-sm">{name || "User Name"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-[10px] text-blue-700">
                  {profile?.role || authUser?.role || "OWNER"}
                </span>
                <span className="text-[#6b7280] text-[11px]">
                  Store: {activeShopName || profile?.ownedShops?.[0]?.name || "Primary Store"}
                </span>

              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Full Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Owner"
                className="h-10 w-full rounded-xl border border-[#e5e7eb] px-3.5 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-[#374151]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@example.com"
                className="h-10 w-full rounded-xl border border-[#e5e7eb] px-3.5 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
              <KeyRound className="size-4 text-[#6b7280]" />
              <span>Change Password (Optional)</span>
            </div>
            <p className="text-[11px] text-[#6b7280]">
              Leave these fields blank if you do not wish to update your password.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-[#374151]">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs focus:border-[#2563eb] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-[#374151]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-xs focus:border-[#2563eb] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notifications Preferences */}
          <div className="border-t border-[#f3f4f6] pt-5 space-y-4">
            <h3 className="text-xs font-bold text-[#111827]">Notification Alerts &amp; Thresholds</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] p-3.5 cursor-pointer hover:bg-[#f9fafb]">
                <input
                  type="checkbox"
                  checked={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-[#d1d5db] text-[#2563eb]"
                />
                <div>
                  <p className="font-semibold text-[#111827]">Low Stock Notification</p>
                  <p className="text-[11px] text-[#6b7280]">Alert when inventory reaches threshold ({stockThreshold} units)</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] p-3.5 cursor-pointer hover:bg-[#f9fafb]">
                <input
                  type="checkbox"
                  checked={debtDueAlert}
                  onChange={(e) => setDebtDueAlert(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-[#d1d5db] text-[#2563eb]"
                />
                <div>
                  <p className="font-semibold text-[#111827]">Customer Debt Due Alerts</p>
                  <p className="text-[11px] text-[#6b7280]">Notify {debtAlertDays} days before debtor repayment date</p>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-[#f3f4f6] pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {isSaving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
