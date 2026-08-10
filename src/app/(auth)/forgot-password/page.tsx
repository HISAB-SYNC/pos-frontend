"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { AndalusMark } from "../../../components/shared/andalus-mark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      // TODO: replace with the reset-password API call.
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen w-full bg-white px-6 py-10 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <section className="hidden items-center justify-center lg:flex">
          <div className="flex flex-col items-center text-gray-700">
            <AndalusMark className="h-[420px] w-[420px] max-w-none text-[#5f5f5f]" />
            <div className="-mt-1 text-[64px] leading-none tracking-[0.28em] text-[#555555]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              ANDALUS
            </div>
          </div>
        </section>

        <section className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[360px] pt-2 text-[#121212]">
            <div className="mb-8 flex justify-center lg:justify-start">
              <AndalusMark className="h-16 w-16 text-[#777777]" />
            </div>

            <Link href="/login" className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-[#222222] transition-colors hover:text-[#000000]">
              <span aria-hidden="true">‹</span>
              Back
            </Link>

            <h1 className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.03em] text-[#111111]">Forgot Password</h1>
            <p className="mt-2 max-w-sm text-[16px] leading-6 text-[#8a8a8a]">
              Enter your registered email address, we’ll send you a code to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#333333]">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-[#444444] bg-white px-4 text-[15px] outline-none transition focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10"
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0f172a] text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition hover:bg-[#111c35]"
              >
                Reset password
              </button>

              {status === "sent" && (
                <p className="text-sm text-emerald-600">If an account exists for that email, we sent a reset code.</p>
              )}
              {status === "error" && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
