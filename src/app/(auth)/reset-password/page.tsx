"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useEffect, useState } from "react";

import {
  AuthShell,
  authButtonClassName,
  authInputClassName,
  authLabelClassName,
  authSubtitleClassName,
  authTitleClassName,
} from "@/components/auth/auth-shell";
import { resetPassword } from "@/lib/api/auth";
import { useT } from "@/lib/i18n/use-t";
import type { ApiError } from "@/lib/api/types";

function ResetPasswordContent() {
  const router = useRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!email || !token) {
      router.replace("/forgot-password");
    }
  }, [email, token, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(t("shared.somethingWrong"));

    if (password.length < 8) {
      setStatus("error");
      setErrorMessage(t("auth.passwordMin8"));
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage(t("auth.passwordsMismatch"));
      return;
    }

    setStatus("loading");

    try {
      await resetPassword({ email, token, newPassword: password });
      setStatus("success");
      router.push("/login");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? t("shared.somethingWrong"));
      setStatus("error");
    }
  }

  return (
    <AuthShell backHref={`/verify-otp?email=${encodeURIComponent(email)}`}>
      <h1 className={authTitleClassName}>{t("auth.setNewPassword")}</h1>
      <p className={authSubtitleClassName}>{t("auth.setNewPasswordSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className={authLabelClassName}>
            {t("auth.newPassword")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={status === "loading" || status === "success"}
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
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={status === "loading" || status === "success"}
            className={authInputClassName}
          />
        </div>

        {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
        {status === "success" && (
          <p className="text-sm text-emerald-600">
            {t("auth.passwordUpdated")}{" "}
            <Link href="/login" className="font-medium underline">
              {t("auth.signIn")}
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={authButtonClassName}
        >
          {status === "loading" ? t("auth.confirming") : t("auth.confirmPasswordButton")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
