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
import type { ApiError } from "@/lib/api/types";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("Something went wrong. Please try again.");

  useEffect(() => {
    if (!email || !token) {
      router.replace("/forgot-password");
    }
  }, [email, token, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("Something went wrong. Please try again.");

    if (password.length < 8) {
      setStatus("error");
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      await resetPassword({ email, token, newPassword: password });
      setStatus("success");
      router.push("/login");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <AuthShell backHref={`/verify-otp?email=${encodeURIComponent(email)}`}>
      <h1 className={authTitleClassName}>Set new password</h1>
      <p className={authSubtitleClassName}>Your new password should be different to previous one</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className={authLabelClassName}>
            new password*
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
            Confirm password*
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
            Password updated successfully.{" "}
            <Link href="/login" className="font-medium underline">
              Sign in
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={authButtonClassName}
        >
          {status === "loading" ? "Confirming..." : "Confirm password"}
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
