"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Percent,
  Shield,
  ShieldCheck,
  Store,
  User as UserIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getUserProfile, updateUserProfile } from "@/lib/api/app-data";
import { updateShop } from "@/lib/api/shops";
import type { UserProfile } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

const BUSINESS_TYPES = [
  { value: "retail", label: "General Retail" },
  { value: "supermarket", label: "Supermarket & Grocery" },
  { value: "boutique", label: "Boutique & Apparel" },
  { value: "electronics", label: "Electronics & Tech" },
  { value: "pharmacy", label: "Pharmacy & Healthcare" },
  { value: "cafe", label: "Cafe & Restaurant" },
  { value: "wholesale", label: "Wholesale Distribution" },
  { value: "other", label: "Other Business" },
];

export default function SettingsPage() {
  const authUser = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeShopId = useShopStore((state) => state.activeShopId);
  const activeShopName = useShopStore((state) => state.activeShopName);
  const setActiveShop = useShopStore((state) => state.setActiveShop);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile fields
  const [name, setName] = useState(authUser?.name || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Shop configuration fields
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [shopName, setShopName] = useState("");
  const [shopBusinessType, setShopBusinessType] = useState("retail");
  const [shopAddress, setShopAddress] = useState("");
  const [taxRate, setTaxRate] = useState("15.0");
  const [currency, setCurrency] = useState("ETB");
  const [language, setLanguage] = useState("en");
  const [isSavingShop, setIsSavingShop] = useState(false);

  // Feedback states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  const populateShopFields = useCallback(
    (shop: {
      name?: string;
      businessType?: string;
      address?: string;
      taxRate?: string;
      currency?: string;
      language?: string;
    }) => {
      setShopName(shop.name || "");
      setShopBusinessType(shop.businessType || "retail");
      setShopAddress(shop.address || "");
      setTaxRate(shop.taxRate !== undefined ? String(shop.taxRate) : "15.0");
      setCurrency(shop.currency || "ETB");
      setLanguage(shop.language || "en");
    },
    [],
  );

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const data = await getUserProfile();
      setProfile(data);
      setName(data.name || authUser?.name || "");
      setEmail(data.email || authUser?.email || "");

      const shops = data.ownedShops || [];
      const initialShop =
        shops.find((s) => s.id === activeShopId) ||
        shops[0] ||
        (data.shop ? { ...data.shop, taxRate: "15.0" } : null);

      if (initialShop) {
        setSelectedShopId(initialShop.id);
        populateShopFields(initialShop);
      }
    } catch {
      if (authUser?.name) setName(authUser.name);
      if (authUser?.email) setEmail(authUser.email);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [activeShopId, authUser?.email, authUser?.name, populateShopFields]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleSelectShopToEdit(shopId: string) {
    setSelectedShopId(shopId);
    const target = profile?.ownedShops?.find((s) => s.id === shopId);
    if (target) {
      populateShopFields(target);
    }
  }

  function handleCopyAccountId() {
    if (!profile?.id && !authUser?.id) return;
    const idToCopy = profile?.id || authUser?.id || "";
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  // 1. Profile update (PATCH /auth/profile)
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updated = await updateUserProfile({
        name: name.trim(),
        email: email.trim(),
      });

      setProfile(updated);
      setSuccessMsg("Personal profile saved successfully.");

      if (accessToken && authUser) {
        setSession(
          {
            ...authUser,
            name: updated.name || name.trim(),
            email: updated.email || email.trim(),
          },
          accessToken,
        );
      }

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update profile settings.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  // 2. Password change (PATCH /auth/profile)
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword) {
      setErrorMsg("Current password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Confirmation password does not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserProfile({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg("Security credentials updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update password. Check your current password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  // 3. Shop update (PATCH /shops/:id)
  async function handleSaveShop(e: React.FormEvent) {
    e.preventDefault();
    const targetShopId = selectedShopId || activeShopId || profile?.ownedShops?.[0]?.id;
    if (!targetShopId) {
      setErrorMsg("No active shop selected.");
      return;
    }

    setIsSavingShop(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const parsedTax = parseFloat(taxRate);
      const updated = await updateShop(targetShopId, {
        name: shopName.trim(),
        businessType: shopBusinessType,
        address: shopAddress.trim(),
        taxRate: isNaN(parsedTax) ? 0 : parsedTax,
        currency: currency.trim().toUpperCase() || "ETB",
        language,
      });

      if (targetShopId === activeShopId || (!activeShopId && profile?.ownedShops?.[0]?.id === targetShopId)) {
        setActiveShop({ id: targetShopId, name: updated.name || shopName.trim() });
      }

      if (profile?.ownedShops) {
        setProfile({
          ...profile,
          ownedShops: profile.ownedShops.map((s) =>
            s.id === targetShopId
              ? {
                  ...s,
                  name: updated.name || shopName.trim(),
                  businessType: shopBusinessType,
                  address: shopAddress.trim(),
                  taxRate: String(isNaN(parsedTax) ? 0 : parsedTax),
                  currency: currency.trim().toUpperCase() || "ETB",
                }
              : s,
          ),
        });
      }

      setSuccessMsg(`Store "${shopName.trim()}" settings saved successfully.`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update store settings.");
    } finally {
      setIsSavingShop(false);
    }
  }

  const isOwner = profile?.role === "OWNER" || authUser?.role === "OWNER";
  const ownedShops = profile?.ownedShops || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* Header Section                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Settings &amp; Configuration
            </h1>
            <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
              {profile?.role || authUser?.role || "USER"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Manage your personal profile, authentication credentials, and active store parameters
          </p>
        </div>

        {/* Account Identity Meta */}
        <div className="flex items-center gap-2 self-start text-xs sm:self-auto">
          <div className="flex items-center gap-2 rounded-md border border-zinc-200/80 bg-white px-3 py-1.5 text-zinc-600 shadow-2xs">
            <span className="font-mono text-[10px] font-bold uppercase text-zinc-400">Account ID:</span>
            <span className="font-mono text-xs font-semibold text-zinc-800 tabular-nums">
              {(profile?.id || authUser?.id || "u-profile").slice(0, 10)}…
            </span>
            <button
              type="button"
              onClick={handleCopyAccountId}
              className="ml-1 text-zinc-400 transition-colors hover:text-zinc-700"
              title="Copy Account ID"
            >
              {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Global Status Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-700 hover:text-emerald-900"
            aria-label="Dismiss alert"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-rose-700 hover:text-rose-900"
            aria-label="Dismiss error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Settings Overview KPI Strip                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Identity Status
            </span>
            <UserIcon className="size-3.5 text-zinc-400" />
          </div>
          <p className="mt-2.5 text-sm font-bold text-zinc-900 truncate">{name || "Administrator"}</p>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-400 truncate">{email || "active"}</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Active Store
            </span>
            <Store className="size-3.5 text-zinc-400" />
          </div>
          <p className="mt-2.5 text-sm font-bold text-zinc-900 truncate">{activeShopName || "Default Shop"}</p>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-400 truncate">
            {currency} • {ownedShops.length} stores linked
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              VAT / Tax Policy
            </span>
            <Percent className="size-3.5 text-zinc-400" />
          </div>
          <p className="mt-2.5 font-mono text-xl font-bold tracking-tight text-zinc-900 tabular-nums">
            {taxRate}% <span className="text-xs font-normal text-zinc-400">standard</span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">Applied at POS checkout</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Alert Rules
            </span>
            <Bell className="size-3.5 text-indigo-500" />
          </div>
          <p className="mt-2.5 font-mono text-xl font-bold tracking-tight text-emerald-700 tabular-nums">
            3 Active <span className="text-xs font-normal text-zinc-400">rules</span>
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-400">Stock, debts &amp; expiry</p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Personal Profile Panel                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-zinc-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
              Personal Profile
            </h2>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">
            {profile?.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString()}` : "Active"}
          </span>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="user-name" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Full Display Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Owner"
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="user-email" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Account Email Address
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@example.com"
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-zinc-200/80 bg-zinc-50/50 px-4 py-2.5 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-zinc-400" />
                <span>Assigned Store: <strong className="font-medium text-zinc-800">{activeShopName || "Default Shop"}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">
                Role: <strong className="text-zinc-800">{profile?.role || authUser?.role || "OWNER"}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-zinc-200/80 bg-zinc-50/30 px-5 py-3">
            <button
              type="submit"
              disabled={isSavingProfile || isLoadingProfile}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              <Check className="size-3.5 text-indigo-400" />
              <span>{isSavingProfile ? "Saving Profile..." : "Save Profile Details"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Security & Credentials Panel                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-zinc-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
              Security &amp; Password
            </h2>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">Min 6 characters</span>
        </div>

        <form onSubmit={handleUpdatePassword}>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="current-pw" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="current-pw"
                    type={showCurrentPw ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white pl-3 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-pw" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-pw"
                    type={showNewPw ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white pl-3 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-pw" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Confirm Password
                </label>
                <input
                  id="confirm-pw"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/30 px-5 py-3">
            <span className="font-mono text-[11px] text-zinc-400">
              Authenticated directly against the secure authentication service
            </span>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
            >
              <Lock className="size-3.5 text-indigo-400" />
              <span>{isUpdatingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Shop & Store Configuration Panel (For Shop Owners)              */}
      {/* ------------------------------------------------------------------ */}
      {(isOwner || ownedShops.length > 0) && (
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-zinc-200/80 bg-zinc-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Store className="size-4 text-zinc-500" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
                  Store &amp; Fiscal Configuration
                </h2>
                <p className="text-[11px] text-zinc-500">Tax policies, trading name, and receipt parameters</p>
              </div>
            </div>

            {/* Multi-Shop Segmented Selector */}
            {ownedShops.length > 1 && (
              <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
                {ownedShops.map((shop) => {
                  const isSelected = (selectedShopId || activeShopId) === shop.id;
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handleSelectShopToEdit(shop.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      {shop.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSaveShop}>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="shop-name-input" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Store Legal / Trading Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="shop-name-input"
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Apex Supermarket & Electronics"
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="shop-industry-select" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Business Industry / Category
                  </label>
                  <select
                    id="shop-industry-select"
                    value={shopBusinessType}
                    onChange={(e) => setShopBusinessType(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="shop-tax-rate" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Default Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      id="shop-tax-rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="15.0"
                      className="h-9 w-full rounded-md border border-zinc-200/80 bg-white pl-3 pr-8 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="shop-currency" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Operating Currency
                  </label>
                  <input
                    id="shop-currency"
                    type="text"
                    maxLength={5}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="ETB"
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="shop-language" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Receipt &amp; Interface Language
                  </label>
                  <select
                    id="shop-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="en">English (Default)</option>
                    <option value="am">Amharic (አማርኛ)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="shop-address-input" className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                    Physical Store Address
                  </label>
                  <input
                    id="shop-address-input"
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="e.g. Bole Road, Addis Ababa"
                    className="h-9 w-full rounded-md border border-zinc-200/80 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/30 px-5 py-3">
              <span className="font-mono text-[11px] text-zinc-400">
                Updating this shop updates checkout VAT and header store details
              </span>
              <button
                type="submit"
                disabled={isSavingShop}
                className="inline-flex h-8.5 items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
              >
                <Check className="size-3.5 text-indigo-400" />
                <span>{isSavingShop ? "Saving Store..." : "Update Store Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Automated Alert Rules Ledger                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-zinc-500" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">
                Automated Business Alert Rules
              </h2>
              <p className="text-[11px] text-zinc-500">Live operational rules evaluated continuously across the shop</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            <span>Notifications Inbox</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        <div className="divide-y divide-zinc-100 text-xs">
          <div className="flex flex-col justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50/70 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">Low Stock Alert</span>
                <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  stockQuantity ≤ threshold
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Triggered automatically when an item&apos;s inventory drops to or below its product-specific minimum quantity.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <span>Set on products</span>
              <ArrowUpRight className="size-3 text-zinc-400" />
            </Link>
          </div>

          <div className="flex flex-col justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50/70 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">Overdue Debt Settlement</span>
                <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  today &gt; dueDate
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Flagged daily whenever an active customer credit balance remains outstanding past its maturity due date.
              </p>
            </div>
            <Link
              href="/debts"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <span>Inspect debts</span>
              <ArrowUpRight className="size-3 text-zinc-400" />
            </Link>
          </div>

          <div className="flex flex-col justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50/70 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">Perishable Goods Expiry</span>
                <span className="rounded-md border border-zinc-200/80 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  expiryDate ≤ 7 days
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Monitors product expiration schedules and issues advance warnings 7 days before goods expire.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200/80 bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <span>Inspect catalog</span>
              <ArrowUpRight className="size-3 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
