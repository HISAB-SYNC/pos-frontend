"use client";

import { Check, Edit2, User as UserIcon, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const activeShopId = useShopStore((state) => state.activeShopId);


  const [username, setUsername] = useState(user?.name || "Salim Ahmed");
  const [phone, setPhone] = useState("+44 (158) 008-9987");
  const [countryCode, setCountryCode] = useState("+44");

  // Notifications State
  const [lowStockAlert, setLowStockAlert] = useState(false);
  const [stockThreshold, setStockThreshold] = useState("10");

  const [debtDueAlert, setDebtDueAlert] = useState(true);
  const [debtAlertDays, setDebtAlertDays] = useState("3");

  const [productExpireAlert, setProductExpireAlert] = useState(false);
  const [expireAlertDays, setExpireAlertDays] = useState("7");

  const [isSaved, setIsSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Toolbar                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#111827]">Settings</h1>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-4 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
        >
          <Edit2 className="size-3.5 text-[#6b7280]" />
          Edit
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Main Profile & Notifications Card                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#111827]">Your Profile</h2>
          <p className="mt-1 text-xs text-[#9ca3af]">Please update your profile settings here</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8 text-xs">
          {/* Profile Picture */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <span className="font-medium text-[#374151]">Profile Picture</span>
            <div className="flex items-center gap-4">
              <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-[#111827] text-white">
                <span className="text-sm font-bold">
                  {username ? username.charAt(0).toUpperCase() : "A"}
                </span>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <label className="font-medium text-[#374151]">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="h-10 max-w-xl w-full rounded-xl border border-[#e5e7eb] px-4 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Phone Number */}
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <label className="font-medium text-[#374151]">Phone Number</label>
            <div className="flex max-w-xl w-full items-center rounded-xl border border-[#e5e7eb] focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb]">
              <div className="flex items-center gap-1.5 border-r border-[#e5e7eb] px-3.5 py-2">
                <span className="text-sm">🇬🇧</span>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent text-xs text-[#374151] focus:outline-none"
                >
                  <option value="+44">+44</option>
                  <option value="+251">+251</option>
                  <option value="+1">+1</option>
                </select>
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 (158) 008-9987"
                className="h-10 flex-1 bg-transparent px-4 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
              />
            </div>
          </div>

          {/* Notifications Section */}
          <div className="grid grid-cols-[160px_1fr] items-start gap-4 border-t border-[#f3f4f6] pt-8">
            <span className="pt-1 font-medium text-[#374151]">Notifications</span>
            <div className="space-y-6">
              {/* 1. Low Stock Alert */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={lowStockAlert}
                    onChange={(e) => setLowStockAlert(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-[#d1d5db] text-[#111827] focus:ring-[#111827]"
                  />
                  <div>
                    <p className="font-medium text-[#111827]">Low Stock Alert</p>
                    <p className="text-[11px] text-[#9ca3af]">
                      Get notified when product stock falls below threshold
                    </p>
                  </div>
                </label>

                <div className="ml-7 flex items-center gap-3">
                  <span className="text-[11px] text-[#6b7280]">Stock threshold</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={stockThreshold}
                      onChange={(e) => setStockThreshold(e.target.value)}
                      className="h-7 w-16 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 text-center text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#9ca3af]">Units</span>
                  </div>
                </div>
              </div>

              {/* 2. Debt due Alerts */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={debtDueAlert}
                    onChange={(e) => setDebtDueAlert(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-[#d1d5db] text-[#111827] focus:ring-[#111827]"
                  />
                  <div>
                    <p className="font-medium text-[#111827]">Debt due Alerts</p>
                    <p className="text-[11px] text-[#9ca3af]">
                      Get notified about upcoming debt due dates
                    </p>
                  </div>
                </label>

                <div className="ml-7 flex items-center gap-3">
                  <span className="text-[11px] text-[#6b7280]">Alert Days before due</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={debtAlertDays}
                      onChange={(e) => setDebtAlertDays(e.target.value)}
                      className="h-7 w-16 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 text-center text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#9ca3af]">Days</span>
                  </div>
                </div>
              </div>

              {/* 3. Product expire Alert */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={productExpireAlert}
                    onChange={(e) => setProductExpireAlert(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-[#d1d5db] text-[#111827] focus:ring-[#111827]"
                  />
                  <div>
                    <p className="font-medium text-[#111827]">Product expire Alert</p>
                    <p className="text-[11px] text-[#9ca3af]">
                      Get notified about products approaching expiration
                    </p>
                  </div>
                </label>

                <div className="ml-7 flex items-center gap-3">
                  <span className="text-[11px] text-[#6b7280]">Alert Days before expiration</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={expireAlertDays}
                      onChange={(e) => setExpireAlertDays(e.target.value)}
                      className="h-7 w-16 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 text-center text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none"
                    />
                    <span className="text-[11px] text-[#9ca3af]">Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-[#f3f4f6] pt-6">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-5 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-slate-50"
            >
              Cancel
              <X className="size-3.5 text-[#6b7280]" />
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-[#111827] px-6 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              {isSaved ? "Saved!" : "Save"}
              <Check className="size-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
