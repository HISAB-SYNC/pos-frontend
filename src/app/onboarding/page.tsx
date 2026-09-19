"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Building2,
  Coins,
  Languages,
  Loader2,
  MapPin,
  Percent,
  Sparkles,
  Store,
} from "lucide-react";

import { createShop } from "@/lib/api/shops";
import type { ApiError } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

const BUSINESS_TYPES = [
  "Retail & Boutique",
  "Supermarket & Grocery",
  "Electronics & Gadgets",
  "Pharmacy & Health",
  "Cafe & Restaurant",
  "Hardware & Tools",
  "Wholesale & Distribution",
  "Other",
];

const CURRENCIES = [
  { code: "ETB", label: "Ethiopian Birr (ETB)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "am", label: "Amharic (አማርኛ)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setActiveShop = useShopStore((state) => state.setActiveShop);

  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [address, setAddress] = useState("");
  const [taxRate, setTaxRate] = useState("15");
  const [currency, setCurrency] = useState("ETB");
  const [language, setLanguage] = useState("en");

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please provide a store name.");
      setStatus("error");
      return;
    }

    if (!address.trim()) {
      setErrorMessage("Please provide a store address or location.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const parsedTaxRate = parseFloat(taxRate) || 0;
      const createdShop = await createShop({
        name: name.trim(),
        businessType,
        address: address.trim(),
        taxRate: parsedTaxRate,
        currency,
        language,
      });

      // Update active shop in store
      setActiveShop({
        id: createdShop.id,
        name: createdShop.name,
      });

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? "Failed to initialize store. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-xl shadow-black/10">
            <Store className="size-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="size-3.5" />
            <span>Store Setup Wizard</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0f172a]">
            Welcome{user?.name ? `, ${user.name}` : ""}! Let&apos;s setup your store
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Fill in your business details to configure your POS terminal, taxes, and catalog.
          </p>
        </div>

        {/* Wizard Card */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Name */}
            <div>
              <label htmlFor="shopName" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
                <Store className="size-4 text-[#64748b]" />
                Store Name *
              </label>
              <input
                id="shopName"
                type="text"
                required
                placeholder="e.g. Addis Central Supermarket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "loading"}
                className="w-full rounded-xl border border-[#cbd5e1] px-4 py-2.5 text-sm font-medium text-[#0f172a] placeholder-[#94a3b8] transition-all focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 disabled:bg-[#f8fafc]"
              />
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
                <Building2 className="size-4 text-[#64748b]" />
                Business Type
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={status === "loading"}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-medium text-[#0f172a] transition-all focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 disabled:bg-[#f8fafc]"
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            {/* Store Address / Location */}
            <div>
              <label htmlFor="address" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
                <MapPin className="size-4 text-[#64748b]" />
                Store Address / Location *
              </label>
              <input
                id="address"
                type="text"
                required
                placeholder="e.g. Bole Medhanialem, Addis Ababa, Ethiopia"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={status === "loading"}
                className="w-full rounded-xl border border-[#cbd5e1] px-4 py-2.5 text-sm font-medium text-[#0f172a] placeholder-[#94a3b8] transition-all focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 disabled:bg-[#f8fafc]"
              />
            </div>

            {/* Tax Rate & Currency Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Currency */}
              <div>
                <label htmlFor="currency" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
                  <Coins className="size-4 text-[#64748b]" />
                  Operating Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-medium text-[#0f172a] transition-all focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 disabled:bg-[#f8fafc]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tax Rate */}
              <div>
                <label htmlFor="taxRate" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
                  <Percent className="size-4 text-[#64748b]" />
                  Standard Tax / VAT Rate (%)
                </label>
                <input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="15"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full rounded-xl border border-[#cbd5e1] px-4 py-2.5 text-sm font-medium text-[#0f172a] placeholder-[#94a3b8] transition-all focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 disabled:bg-[#f8fafc]"
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
                <Languages className="size-4 text-[#64748b]" />
                Primary Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={status === "loading"}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-medium text-[#0f172a] transition-all focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10 disabled:bg-[#f8fafc]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error banner */}
            {status === "error" && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-[#1e293b] active:scale-[0.99] disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Setting up your store...</span>
                  </>
                ) : (
                  <>
                    <Store className="size-4" />
                    <span>Launch Store & Enter POS</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-[#94a3b8]">
          You can update these store parameters anytime later from your Settings page.
        </p>
      </div>
    </div>
  );
}
