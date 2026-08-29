"use client";

import { AlertOctagon, ArrowLeft, Lock, LogIn, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/auth-store";

interface AccessDeniedProps {
  requiredPermission?: string;
  requiredRole?: string;
  title?: string;
  description?: string;
}

export function AccessDenied({
  requiredPermission,
  requiredRole,
  title = "403 — Access Denied",
  description = "You do not have permission to view or manage this section.",
}: AccessDeniedProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const homeHref =
    user?.role === "SUPER_ADMIN"
      ? "/admin/dashboard"
      : user?.role === "SALES"
      ? "/pos"
      : "/dashboard";

  return (
    <div className="flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm border border-red-200">
        <ShieldAlert className="size-8" />
      </div>

      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        <Lock className="size-3" />
        {title}
      </span>

      <h2 className="mt-3 text-lg font-bold text-[#111827]">
        Unauthorized Area
      </h2>
      <p className="mt-1 max-w-md text-xs text-[#6b7280]">
        {description}
      </p>

      {/* Role & Permission Context Box */}
      <div className="my-5 w-full max-w-sm rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3 text-left text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-[#6b7280]">Your Current Role:</span>
          <span className="font-bold text-[#111827]">{user?.role || "GUEST"}</span>
        </div>
        {requiredRole && (
          <div className="flex justify-between">
            <span className="text-[#6b7280]">Required Role:</span>
            <span className="font-semibold text-blue-600">{requiredRole}</span>
          </div>
        )}
        {requiredPermission && (
          <div className="flex justify-between">
            <span className="text-[#6b7280]">Required Permission:</span>
            <span className="font-mono text-[11px] text-purple-600">{requiredPermission}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 text-xs font-semibold text-[#374151] hover:bg-[#f9fafb]"
        >
          <ArrowLeft className="size-3.5" />
          Go Back
        </button>

        <Link
          href={homeHref}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-[#111827] px-4 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
