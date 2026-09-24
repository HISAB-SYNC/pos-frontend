"use client";

import { CheckCircle2 } from "lucide-react";
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
import { registerOwner } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/types";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setStatus("error");
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
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
      setErrorMessage(apiError.message ?? "Failed to create store owner account.");
      setStatus("error");
    }
  }

  return (
    <AuthShell backHref="/login" showMobileLogo={false} showFormLogo>
      <h1 className={authTitleClassName}>Create Owner Account</h1>
      <p className={authSubtitleClassName}>
        Sign up as a business owner to start managing your shops, inventory, and POS terminals.
      </p>

      {status === "success" ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-center text-emerald-950 space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-emerald-950">Registration Submitted!</h3>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              Your store owner profile has been submitted for platform activation. A SuperAdmin will review and activate your account shortly.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition-colors"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div>
            <label htmlFor="name" className={authLabelClassName}>
              Full Name*
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Alex Owner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={status === "loading"}
              className={authInputClassName}
            />
          </div>

          <div>
            <label htmlFor="email" className={authLabelClassName}>
              Business Email*
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
              Password*
            </label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={status === "loading"}
              className={authInputClassName}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={authLabelClassName}>
              Confirm Password*
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
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
            {status === "loading" ? "Creating Account..." : "Register as Store Owner"}
          </button>

          <p className="pt-2 text-center text-xs text-[#6b7280]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#111827] hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
