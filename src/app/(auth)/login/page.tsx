"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { AlertCircle, Clock, Eye, EyeOff, Loader2 } from "lucide-react";

import {
  AuthShell,
  authButtonClassName,
  authInputClassName,
  authLabelClassName,
  authSubtitleClassName,
  authTitleClassName,
} from "@/components/auth/auth-shell";
import { login } from "@/lib/api/auth";
import { getOwnerShops } from "@/lib/api/shops";
import type { ApiError } from "@/lib/api/types";
import { isBackendRole } from "@/lib/permissions/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useShopStore } from "@/stores/shop-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveShop = useShopStore((state) => state.setActiveShop);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("Invalid email or password.");
  const [isPendingActivation, setIsPendingActivation] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("Invalid email or password.");

    try {
      const { user, token } = await login(email, password);

      if (!isBackendRole(user.role) && user.role !== "SYSTEM_ADMIN") {
        throw new Error("Unsupported user role.");
      }

      setSession(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shopId,
        },
        token,
      );

      if (user.role === "SUPER_ADMIN" || user.role === "SYSTEM_ADMIN") {
        setActiveShop(null);
        router.push("/admin/dashboard");
        return;
      }

      if (user.role === "OWNER") {
        const shops = await getOwnerShops();

        if (shops.length === 0) {
          router.push("/onboarding");
          return;
        }

        setActiveShop({ id: shops[0].id, name: shops[0].name });
        router.push("/dashboard");
        return;
      }

      if (user.shopId) {
        setActiveShop({ id: user.shopId, name: "Shop" });
      }

      if (user.role === "SALES") {
        router.push("/pos");
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      const rawMsg = apiError.message ?? "Invalid email or password.";
      const rawCode = (apiError as any)?.code || (error as any)?.code;
      if (
        rawCode === "ACCOUNT_PENDING_APPROVAL" ||
        rawMsg.toLowerCase().includes("pending") ||
        rawMsg.toLowerCase().includes("activate") ||
        rawMsg.toLowerCase().includes("activation") ||
        rawMsg.toLowerCase().includes("approval")
      ) {
        setIsPendingActivation(true);
        setErrorMessage(
          "Your store owner account is awaiting SuperAdmin review and activation. You will be able to access your shops as soon as platform administrators approve your registration.",
        );
      } else {
        setIsPendingActivation(false);
        setErrorMessage(rawMsg);
      }
      setStatus("error");
    }
  }

  return (
    <AuthShell hideAllLogos layout="centered" backHref="/landing-page">
      <div>
        <h1 className={authTitleClassName}>Welcome Back</h1>
        <p className={authSubtitleClassName}>
          Sign in to access your shop terminal and management dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="owner@yourshop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className={authInputClassName}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={authLabelClassName}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={status === "loading"}
              className={`${authInputClassName} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {status === "error" && (
          isPendingActivation ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs leading-relaxed text-amber-900">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-amber-950 mb-0.5">Account Pending Activation</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs leading-relaxed text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )
        )}

        <button type="submit" disabled={status === "loading"} className={authButtonClassName}>
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin text-[#c0e763]" />
              <span>Signing in...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <div className="pt-3 text-center">
          <p className="text-xs text-zinc-500">
            New store owner?{" "}
            <Link
              href="/register"
              className="font-semibold text-zinc-900 transition-colors hover:text-[#5c7f12] hover:underline"
            >
              Create an Account
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}


