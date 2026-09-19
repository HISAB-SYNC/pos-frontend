"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  AuthShell,
  authButtonClassName,
  authSubtitleClassName,
  authTitleClassName,
  maskEmail,
} from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/auth/otp-input";
import { requestPasswordReset, verifyPasswordResetOtp } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/types";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("Please enter the full verification code.");

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function handleVerify() {
    if (otp.length !== OTP_LENGTH) {
      setStatus("error");
      setErrorMessage("Please enter the full verification code.");
      return;
    }

    setStatus("loading");
    setErrorMessage("Something went wrong. Please try again.");

    try {
      const res = await verifyPasswordResetOtp({ email, otp });
      setStatus("idle");
      router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(res.resetToken)}`);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? "Invalid verification code. Please try again.");
      setStatus("error");
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || !email) {
      return;
    }

    setStatus("loading");
    setErrorMessage("Something went wrong. Please try again.");

    try {
      await requestPasswordReset(email);
      setOtp("");
      setSecondsLeft(RESEND_SECONDS);
      setStatus("idle");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  const minutes = String(Math.floor(secondsLeft / 60));
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <AuthShell backHref="/forgot-password">
      <h1 className={authTitleClassName}>Enter OTP</h1>
      <p className={authSubtitleClassName}>
        We have shared a code of your {maskEmail(email)} email address.
      </p>

      <div className="mt-8 space-y-6">
        <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} disabled={status === "loading"} />

        <button
          type="button"
          onClick={handleVerify}
          disabled={status === "loading"}
          className={authButtonClassName}
        >
          verify
        </button>

        {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

        <p className="text-sm text-[#8a8a8a]">
          {secondsLeft > 0 ? (
            <>
              Resend code in {minutes}:{seconds}
            </>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={status === "loading"}
              className="font-medium text-[#222222] underline-offset-2 hover:underline disabled:opacity-60"
            >
              Resend code
            </button>
          )}
        </p>
      </div>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
