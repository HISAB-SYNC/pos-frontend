import Link from "next/link";

import { AndalusLogo } from "@/components/shared/andalus-mark";

type AuthShellProps = {
  children: React.ReactNode;
  backHref?: string;
  showMobileLogo?: boolean;
  showFormLogo?: boolean;
};

export function AuthShell({
  children,
  backHref,
  showMobileLogo = true,
  showFormLogo = false,
}: AuthShellProps) {
  return (
    <div className="min-h-screen w-full bg-white px-6 py-10 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <section className="hidden items-center justify-center lg:flex">
          <AndalusLogo variant="icon" className="h-[420px] w-[420px] max-w-none" />
        </section>

        <section className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[360px] pt-2 text-[#121212]">
            {showFormLogo && (
              <div className="mb-8 flex justify-center lg:justify-start">
                <AndalusLogo variant="icon" className="h-16 w-16" />
              </div>
            )}

            {showMobileLogo && !showFormLogo && (
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
  "h-11 w-full rounded-xl border border-[#444444] bg-white px-4 text-[15px] outline-none transition focus:border-[#111111] focus:ring-2 focus:ring-[#111111]/10 disabled:opacity-60";

export const authButtonClassName =
  "mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0f172a] text-[16px] font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition hover:bg-[#111c35] disabled:cursor-not-allowed disabled:opacity-70";

export const authLabelClassName = "mb-2 block text-sm font-medium text-[#333333]";

export const authTitleClassName =
  "text-[30px] font-extrabold leading-none tracking-[-0.03em] text-[#111111]";

export const authSubtitleClassName = "mt-2 text-[16px] leading-6 text-[#8a8a8a]";

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
