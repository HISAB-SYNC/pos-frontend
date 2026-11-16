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
  authSubtitleClassName,
  authTitleClassName,
} from "@/components/auth/auth-shell";
import { requestPasswordReset } from "@/lib/api/auth";
import { useT } from "@/lib/i18n/use-t";
import type { ApiError } from "@/lib/api/types";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(t("shared.somethingWrong"));

    try {
      await requestPasswordReset(email);
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? t("shared.somethingWrong"));
      setStatus("error");
    }
  }

  return (
    <AuthShell backHref="/login">
      <h1 className={authTitleClassName}>{t("auth.forgotTitle")}</h1>
      <p className={authSubtitleClassName}>
        {t("auth.forgotSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            {t("auth.emailRequired")}
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

        {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button type="submit" disabled={status === "loading"} className={authButtonClassName}>
          {status === "loading" ? t("auth.sending") : t("auth.resetPassword")}
        </button>

        <p className="text-center text-sm text-[#6b7280]">
          {t("auth.rememberPassword")}{" "}
          <Link href="/login" className="font-medium text-[#111111] hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
