import Link from "next/link";

import { AndalusLogo } from "@/components/shared/andalus-mark";

type AuthShellProps = {
  children: React.ReactNode;
  backHref?: string;
  showMobileLogo?: boolean;
  showFormLogo?: boolean;
  hideAllLogos?: boolean;
  layout?: "split" | "centered";
};

export function AuthShell({
  children,
  backHref,
  showMobileLogo = true,
  showFormLogo = false,
  hideAllLogos = false,
  layout = "split",
}: AuthShellProps) {
  const isCentered = layout === "centered" || hideAllLogos;

  if (isCentered) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-[#fafbfc] px-4 py-12 text-zinc-900">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-radial from-[#c0e763]/10 to-transparent blur-3xl" />
        </div>

        <div className="relative w-full max-w-[420px]">
          {backHref && (
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              <span aria-hidden="true" className="text-sm leading-none">‹</span>
              Back
            </Link>
          )}

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:p-9">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white px-6 py-10 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <section className="hidden items-center justify-center lg:flex">
          {!hideAllLogos && (
            <AndalusLogo variant="icon" className="h-[420px] w-[420px] max-w-none" />
          )}
        </section>

        <section className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[360px] pt-2 text-[#121212]">
            {!hideAllLogos && showFormLogo && (
              <div className="mb-8 flex justify-center lg:justify-start">
                <AndalusLogo variant="icon" className="h-16 w-16" />
              </div>
            )}

            {!hideAllLogos && showMobileLogo && !showFormLogo && (
              <div className="mb-8 flex justify-center lg:hidden">
                <AndalusLogo variant="icon" className="h-16 w-16" />
              </div>
            )}

            {backHref && (
              <Link
                href={backHref}
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-[#222222] transition-colors hover:text-[#000000]"
              >
                <span aria-hidden="true">‹</span>
                Back
              </Link>
            )}

            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

export const authInputClassName =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none transition duration-150 focus:border-[#7ea521] focus:ring-2 focus:ring-[#c0e763]/25 disabled:cursor-not-allowed disabled:opacity-60";

export const authButtonClassName =
  "mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0c1017] text-[14px] font-semibold text-white shadow-xs transition duration-150 hover:bg-[#1a2436] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const authLabelClassName = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600";

export const authTitleClassName =
  "text-2xl font-bold tracking-tight text-zinc-950 sm:text-[28px]";

export const authSubtitleClassName = "mt-1.5 text-sm leading-relaxed text-zinc-500";

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return email;
  }

  if (local.length <= 2) {
    return `${local[0] ?? ""}****@${domain}`;
  }

  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local.at(-1)}@${domain}`;
}
