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
  Shield,
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
    <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-2">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 border-b border-neutral-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              Settings &amp; Configuration
            </h1>
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              {profile?.role || authUser?.role || "USER"}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Manage your account identity, security credentials, and active store parameters.
          </p>
        </div>

        {/* Account Identity Meta */}
        <div className="flex items-center gap-2 self-start text-xs sm:self-auto">
          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white px-2.5 py-1 text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] text-neutral-400">ID:</span>
            <span className="font-mono text-[11px] text-neutral-700">
              {(profile?.id || authUser?.id || "u-profile").slice(0, 8)}…
            </span>
            <button
              type="button"
              onClick={handleCopyAccountId}
              className="ml-1 text-neutral-400 transition-colors hover:text-neutral-700"
              title="Copy Account ID"
            >
              {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Global Status Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-700/70 hover:text-emerald-900"
            aria-label="Dismiss alert"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/70 px-4 py-3 text-xs text-red-900 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-red-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-red-700/70 hover:text-red-900"
            aria-label="Dismiss error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. Personal Profile Panel                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UserIcon className="size-4 text-[#5B4FE9]" />
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Personal Profile</h2>
          </div>
          <span className="text-[11px] text-neutral-400">
            {profile?.createdAt ? `Joined ${new Date(profile.createdAt).toLocaleDateString()}` : "Active"}
          </span>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="user-name" className="mb-1.5 block text-xs font-medium text-neutral-800">
                  Full Display Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Owner"
                  className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                />
              </div>

              <div>
                <label htmlFor="user-email" className="mb-1.5 block text-xs font-medium text-neutral-800">
                  Account Email Address
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@example.com"
                  className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/50 px-4 py-2.5 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-neutral-400" />
                <span>Assigned Store: <strong className="font-medium text-neutral-800">{activeShopName || "Default Shop"}</strong></span>
              </div>
              <span className="font-mono text-[11px] text-neutral-400">Role: {profile?.role || authUser?.role || "OWNER"}</span>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-neutral-100 bg-neutral-50/30 px-6 py-3.5">
            <button
              type="submit"
              disabled={isSavingProfile || isLoadingProfile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5B4FE9] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#4d42c7] active:scale-[0.99] disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {isSavingProfile ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Security & Credentials Panel                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="size-4 text-[#5B4FE9]" />
            <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Security &amp; Password</h2>
          </div>
          <span className="text-[11px] text-neutral-400">Min 6 characters</span>
        </div>

        <form onSubmit={handleUpdatePassword}>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="current-pw" className="mb-1.5 block text-xs font-medium text-neutral-800">
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
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white pl-3.5 pr-9 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-pw" className="mb-1.5 block text-xs font-medium text-neutral-800">
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
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white pl-3.5 pr-9 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-pw" className="mb-1.5 block text-xs font-medium text-neutral-800">
                  Confirm Password
                </label>
                <input
                  id="confirm-pw"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/30 px-6 py-3.5">
            <span className="text-[11px] text-neutral-400">
              Both fields are authenticated directly against the profile API.
            </span>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50"
            >
              <Lock className="size-3.5" />
              {isUpdatingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Shop & Store Configuration Panel (For Shop Owners)              */}
      {/* ------------------------------------------------------------------ */}
      {(isOwner || ownedShops.length > 0) && (
        <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col gap-3 border-b border-neutral-100 bg-neutral-50/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <Store className="size-4 text-[#5B4FE9]" />
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Store Configuration</h2>
                <p className="text-[11px] text-neutral-500">Tax policies, trading name, and receipt parameters</p>
              </div>
            </div>

            {/* Multi-Shop Segmented Selector */}
            {ownedShops.length > 1 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white p-1">
                {ownedShops.map((shop) => {
                  const isSelected = (selectedShopId || activeShopId) === shop.id;
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handleSelectShopToEdit(shop.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-neutral-900 text-white shadow-sm"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
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
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="shop-name-input" className="mb-1.5 block text-xs font-medium text-neutral-800">
                    Store Legal / Trading Name
                  </label>
                  <input
                    id="shop-name-input"
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Apex Supermarket & Electronics"
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  />
                </div>

                <div>
                  <label htmlFor="shop-industry-select" className="mb-1.5 block text-xs font-medium text-neutral-800">
                    Business Industry / Category
                  </label>
                  <select
                    id="shop-industry-select"
                    value={shopBusinessType}
                    onChange={(e) => setShopBusinessType(e.target.value)}
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="shop-tax-rate" className="mb-1.5 block text-xs font-medium text-neutral-800">
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
                      className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white pl-3.5 pr-8 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="shop-currency" className="mb-1.5 block text-xs font-medium text-neutral-800">
                    Operating Currency
                  </label>
                  <input
                    id="shop-currency"
                    type="text"
                    maxLength={5}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="ETB"
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  />
                </div>

                <div>
                  <label htmlFor="shop-language" className="mb-1.5 block text-xs font-medium text-neutral-800">
                    Receipt &amp; Interface Language
                  </label>
                  <select
                    id="shop-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  >
                    <option value="en">English (Default)</option>
                    <option value="am">Amharic (አማርኛ)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="shop-address-input" className="mb-1.5 block text-xs font-medium text-neutral-800">
                    Physical Store Address
                  </label>
                  <input
                    id="shop-address-input"
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="e.g. Bole Road, Addis Ababa"
                    className="h-9.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 text-xs text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-[#5B4FE9] focus:outline-none focus:ring-2 focus:ring-[#5B4FE9]/10"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/30 px-6 py-3.5">
              <span className="text-[11px] text-neutral-400">
                Updating this shop updates checkout VAT and header store details.
              </span>
              <button
                type="submit"
                disabled={isSavingShop}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#5B4FE9] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#4d42c7] active:scale-[0.99] disabled:opacity-50"
              >
                <Check className="size-3.5" />
                {isSavingShop ? "Saving Store..." : "Update Store Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Automated Alert Rules Ledger                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Bell className="size-4 text-[#5B4FE9]" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Automated Alert Rules</h2>
              <p className="text-[11px] text-neutral-500">Live operational rules evaluated by the shop monitor</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#5B4FE9] transition-colors hover:text-[#4d42c7]"
          >
            Notifications Inbox <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          <div className="flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-neutral-50/50 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">Low Stock Alert</span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
                  stockQuantity ≤ threshold
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Triggered automatically when an item&apos;s inventory drops to or below its product-specific minimum quantity.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-neutral-50"
            >
              Set on products <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-neutral-50/50 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">Overdue Debt Settlement</span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
                  today &gt; dueDate
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Flagged daily whenever an active customer credit balance remains outstanding past its maturity due date.
              </p>
            </div>
            <Link
              href="/debts"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-neutral-50"
            >
              Inspect debts <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="flex flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-neutral-50/50 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-900">Perishable Goods Expiry</span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600">
                  expiryDate ≤ 7 days
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Monitors product expiration schedules and issues advance warnings 7 days before goods expire.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-neutral-50"
            >
              Inspect catalog <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
