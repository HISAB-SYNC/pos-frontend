"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  AuthShell,
  authButtonClassName,
  authInputClassName,
  authLabelClassName,
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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("Invalid email or password.");

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

      router.push("/dashboard");

    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? "Invalid email or password.");
      setStatus("error");
    }
  }

  return (
    <AuthShell showMobileLogo={false} showFormLogo>
      <h1 className={authTitleClassName}>Welcome Back!</h1>
      <p className="mt-2 text-[16px] leading-6 text-[#3d3d3d]">For Manager</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            Email*
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className={authInputClassName}
          />
        </div>

        <div>
          <label htmlFor="password" className={authLabelClassName}>
            Password*
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={status === "loading"}
            className={authInputClassName}
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#222222] transition-colors hover:text-[#000000] hover:underline"
            >
              Forgot Password
            </Link>
          </div>
        </div>

        {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button type="submit" disabled={status === "loading"} className={authButtonClassName}>
          {status === "loading" ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}
