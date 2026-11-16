"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  AuthShell,
  authButtonClassName,
  authInputClassName,
  authLabelClassName,
  authSubtitleClassName,
  authTitleClassName,
} from "@/components/auth/auth-shell";
import { LoadingState } from "@/components/shared/loading-state";
import { registerOwner } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";
import { useAuthStore } from "@/stores/auth-store";

const emptySubscribe = () => () => {};

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // If already logged in, redirect directly to user's destination
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated && accessToken && user) {
      if (user.role === "SUPER_ADMIN" || user.role === "SYSTEM_ADMIN") {
        router.replace("/admin/dashboard");
      } else if (user.role === "SALES") {
        router.replace("/pos");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [hydrated, isAuthenticated, accessToken, user, router]);

  if (hydrated && isAuthenticated && accessToken && user) {
    return <LoadingState />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setStatus("error");
      setErrorMessage(t("auth.passwordTooShort6"));
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage(t("auth.passwordsMismatch"));
      return;
    }

    setStatus("loading");

    try {
      await registerOwner({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setStatus("success");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? t("auth.registerFailed"));
      setStatus("error");
    }
  }

  return (
    <AuthShell backHref="/login" showMobileLogo={false} showFormLogo>
      <h1 className={authTitleClassName}>{t("auth.createOwnerTitle")}</h1>
      <p className={authSubtitleClassName}>
        {t("auth.registerSubtitle")}
      </p>

      {status === "success" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-center text-emerald-950 space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-emerald-950">{t("auth.registrationSubmitted")}</h3>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              {t("auth.registrationBody")}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition-colors"
            >
              {t("auth.proceedSignIn")}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div>
            <label htmlFor="name" className={authLabelClassName}>
              {t("auth.fullName")}
            </label>
            <input
              id="name"
              type="text"
              placeholder={t("auth.fullNamePh")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={status === "loading"}
              className={authInputClassName}
            />
          </div>

          <div>
            <label htmlFor="email" className={authLabelClassName}>
              {t("auth.businessEmail")}
            </label>
            <input
              id="email"
              type="email"
              placeholder="owner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
              className={authInputClassName}
            />
          </div>

          <div>
            <label htmlFor="password" className={authLabelClassName}>
              {t("auth.passwordRequired")}
            </label>
            <input
              id="password"
              type="password"
              placeholder={t("auth.passwordMin6Ph")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={status === "loading"}
              className={authInputClassName}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={authLabelClassName}>
              {t("auth.confirmPasswordRequired")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t("auth.confirmPasswordPh")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={status === "loading"}
              className={authInputClassName}
            />
          </div>

          {status === "error" && (
            <p className="text-xs font-medium text-red-600">{errorMessage}</p>
          )}

          <button type="submit" disabled={status === "loading"} className={authButtonClassName}>
            {status === "loading" ? t("auth.creatingAccount") : t("auth.registerButton")}
          </button>

          <p className="pt-2 text-center text-xs text-[#6b7280]">
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-[#111827] hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
