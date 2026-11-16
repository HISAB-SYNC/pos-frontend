"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Barcode,
  Check,
  Clock,
  Coins,
  Menu,
  MonitorCheck,
  Package,
  Printer,
  Receipt,
  WifiOff,
  X,
  Zap,
} from "lucide-react";

import { BackgroundCubesGrid } from "@/components/landing/background-cubes-grid";
import { BlurText } from "@/components/landing/bits/blur-text";
import { CountUp } from "@/components/landing/bits/count-up";
import { InfiniteMovingCards } from "@/components/landing/bits/infinite-moving-cards";
import { Reveal } from "@/components/landing/bits/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "@/components/landing/social-icons";
import { AndalusLogo } from "@/components/shared/andalus-mark";
import { LanguageSwitch } from "@/components/layout/language-switch";
import type { MessageKey } from "@/lib/i18n/messages";
import { useT } from "@/lib/i18n/use-t";
import { useAuthStore } from "@/stores/auth-store";

const emptySubscribe = () => () => {};

const navLinks: Array<{ labelKey: MessageKey; href: string }> = [
  { labelKey: "landing.navFeatures", href: "#features" },
  { labelKey: "landing.navOperations", href: "#realities" },
  { labelKey: "landing.navDebt", href: "#debt-ledger" },
  { labelKey: "landing.navHardware", href: "#hardware" },
  { labelKey: "landing.navFaq", href: "#faq" },
];

const heroCapabilities: Array<{ icon: typeof WifiOff; labelKey: MessageKey }> = [
  { icon: WifiOff, labelKey: "landing.capOffline" },
  { icon: Coins, labelKey: "landing.capPayments" },
  { icon: Receipt, labelKey: "landing.capCredit" },
  { icon: Barcode, labelKey: "landing.capScanner" },
];

const heroMetrics: Array<{
  value: number;
  labelKey: MessageKey;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  currencyPrefix?: boolean;
}> = [
  { value: 200, labelKey: "landing.metricScan", prefix: "< ", suffix: "ms" },
  { value: 99.98, labelKey: "landing.metricUptime", suffix: "%", decimals: 2 },
  { value: 45, labelKey: "landing.metricVolume", currencyPrefix: true, suffix: "M+" },
  { value: 500, labelKey: "landing.metricStores", suffix: "+" },
];

// Names and neighbourhoods are real people and places, so they are not translated.
const TESTIMONIALS: Array<{ name: string; roleKey: MessageKey; area: string; quoteKey: MessageKey }> = [
  { name: "Yonas T.", roleKey: "landing.roleStoreOwner", area: "Bole Medhanealem", quoteKey: "landing.q1" },
  { name: "Selamawit A.", roleKey: "landing.roleManager", area: "Kazanchis", quoteKey: "landing.q2" },
  { name: "Abel K.", roleKey: "landing.roleManagingPartner", area: "Sarbet", quoteKey: "landing.q3" },
  { name: "Hanna G.", roleKey: "landing.roleOwner", area: "Piassa", quoteKey: "landing.q4" },
  { name: "Mekdes B.", roleKey: "landing.roleCashierLead", area: "CMC", quoteKey: "landing.q5" },
];

const FAQS: Array<{ qKey: MessageKey; aKey: MessageKey }> = [
  { qKey: "landing.faq1q", aKey: "landing.faq1a" },
  { qKey: "landing.faq2q", aKey: "landing.faq2a" },
  { qKey: "landing.faq3q", aKey: "landing.faq3a" },
  { qKey: "landing.faq4q", aKey: "landing.faq4a" },
  { qKey: "landing.faq5q", aKey: "landing.faq5a" },
];

export default function LandingPage() {
  const t = useT();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Debt Voucher Demo State
  const [simulatedPaid, setSimulatedPaid] = useState<number>(0);
  const [voucherSettled, setVoucherSettled] = useState(false);

  const initialDebt = 3400;
  const currentSimulatedDebt = Math.max(0, initialDebt - simulatedPaid);

  const handlePayBirr = (amount: number) => {
    setSimulatedPaid((prev) => {
      const next = Math.min(initialDebt, prev + amount);
      if (next >= initialDebt) setVoucherSettled(true);
      return next;
    });
  };

  const handleResetVoucher = () => {
    setSimulatedPaid(0);
    setVoucherSettled(false);
  };

  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const isLoggedIn = hydrated && Boolean(isAuthenticated && accessToken && user);

  const destination = useMemo(() => {
    if (!user) return "/dashboard";
    if (user.role === "SUPER_ADMIN" || user.role === "SYSTEM_ADMIN") return "/admin/dashboard";
    if (user.role === "SALES") return "/pos";
    return "/dashboard";
  }, [user]);

  const destinationLabel = useMemo(() => {
    if (!user) return t("nav.dashboard");
    if (user.role === "SUPER_ADMIN" || user.role === "SYSTEM_ADMIN") return t("landing.destAdmin");
    if (user.role === "SALES") return t("header.posRegister");
    return t("nav.dashboard");
  }, [user, t]);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-neutral-900 selection:bg-[#5B4FE9]/15 selection:text-[#5B4FE9]">
      {/* 1. Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/landing-page" aria-label={t("landing.homeLabel")} className="flex items-center gap-2 transition hover:opacity-90">
            <AndalusLogo variant="compact" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.labelKey}
                href={link.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-950"
              >
                {t(link.labelKey)}
              </a>
            ))}
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden items-center gap-3 sm:flex">
            <LanguageSwitch />
            {isLoggedIn ? (
              <Link
                href={destination}
                className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4D40D9] active:bg-[#3E32C4]"
              >
                <span>{t("landing.goTo", { destination: destinationLabel })}</span>
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                  {t("landing.signIn")}
                </Link>
                <Link
                  href="/register"
                  className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4D40D9] active:bg-[#3E32C4]"
                >
                  <span>{t("landing.launchStore")}</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 lg:hidden"
            aria-label={t("landing.toggleNav")}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-neutral-200 bg-white px-5 py-4 lg:hidden">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.labelKey}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-medium text-neutral-700 hover:text-neutral-950"
                >
                  {t(link.labelKey)}
                </a>
              ))}
              <LanguageSwitch className="self-start" />
              <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                {isLoggedIn ? (
                  <Link
                    href={destination}
                    className="flex h-9.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5B4FE9] text-xs font-semibold text-white shadow-sm"
                  >
                    <span>{t("landing.goTo", { destination: destinationLabel })}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex h-9.5 w-full items-center justify-center rounded-lg border border-neutral-200 text-xs font-medium text-neutral-900"
                    >
                      {t("landing.signInTerminal")}
                    </Link>
                    <Link
                      href="/register"
                      className="flex h-9.5 w-full items-center justify-center rounded-lg bg-[#5B4FE9] text-xs font-semibold text-white shadow-sm"
                    >
                      {t("landing.launchStoreFree")}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        {/* Cube floor sits top-right and dissolves before it reaches the copy */}
        <BackgroundCubesGrid className="h-[640px] [mask-image:radial-gradient(ellipse_70%_72%_at_95%_0%,#000_25%,transparent_70%)] max-lg:[mask-image:linear-gradient(to_bottom,#000,transparent_55%)] max-lg:opacity-60" />

        <div className="relative mx-auto max-w-7xl px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="lg:col-span-8">
              <Reveal>
                <div className="inline-flex items-center gap-2.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-mono text-xs text-zinc-600">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5B4FE9] opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[#5B4FE9]" />
                  </span>
                  {t("landing.badge")}
                </div>
              </Reveal>

              <h1 className="mt-6 text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl lg:text-[5.25rem]">
                <BlurText text={t("landing.heroLine1")} />
                <br />
                <BlurText text={t("landing.heroLine2")} delay={0.3} className="text-zinc-400" />
              </h1>

              <Reveal delay={0.6}>
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
                  {heroCapabilities.map(({ icon: Icon, labelKey }) => (
                    <li key={labelKey} className="flex items-center gap-2">
                      <Icon className="size-4 text-[#5B4FE9]" strokeWidth={1.75} />
                      {t(labelKey)}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={0.45} className="lg:col-span-4">
              <p className="max-w-md text-base leading-relaxed text-zinc-600">
                {t("landing.heroDesc")}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {isLoggedIn ? (
                  <Button asChild size="lg" className="group h-11 px-5">
                    <Link href={destination}>
                      {t("landing.open", { destination: destinationLabel })}
                      <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="group h-11 px-5">
                      <Link href="/register">
                        {t("landing.startFree")}
                        <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-11 border-zinc-300 bg-white px-5">
                      <Link href="/login">{t("landing.signInLower")}</Link>
                    </Button>
                  </>
                )}
              </div>

              <p className="mt-4 text-xs text-zinc-500">{t("landing.freeTier")}</p>
            </Reveal>
          </div>

          {/* Metrics */}
          <dl className="relative mt-16 grid grid-cols-2 border-y border-zinc-200 bg-white sm:grid-cols-4">
            {heroMetrics.map((metric, index) => (
              <div
                key={metric.labelKey}
                className={`py-5 sm:px-6 ${index > 0 ? "sm:border-l sm:border-zinc-200" : "sm:pl-0"} ${
                  index % 2 === 1 ? "border-l border-zinc-200 pl-5" : ""
                } ${index > 1 ? "border-t border-zinc-200 sm:border-t-0" : ""}`}
              >
                <dt className="text-xs text-zinc-500">{t(metric.labelKey)}</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                  <CountUp
                    to={metric.value}
                    decimals={metric.decimals}
                    prefix={metric.currencyPrefix ? `${t("shared.etb")} ` : metric.prefix}
                    suffix={metric.suffix}
                  />
                </dd>
              </div>
            ))}
          </dl>

          {/* Live counter simulator */}
          <Reveal className="mt-12">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-800">{t("landing.simulator")}</span>
              <span className="font-mono text-zinc-500">{t("landing.simulatorHint")}</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.12)]">
              <DashboardPreview />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. The 4 Realities Bento Grid with Spotlight Interaction */}
      <section id="realities" className="border-b border-neutral-200/90 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              {t("landing.coreArch")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {t("landing.realitiesTitle")}
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {t("landing.realitiesDesc")}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Reality 1 */}
            <SpotlightCard className="rounded-lg shadow-none hover:translate-y-0 hover:shadow-none lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">
                  01
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9]">
                  <Zap className="size-4" />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight text-neutral-950">
                {t("landing.r1Title")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {t("landing.r1Desc")}
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                {t("landing.r1Meta")} <span className="font-semibold text-neutral-900">{t("landing.r1Value")}</span>
              </div>
            </SpotlightCard>

            {/* Reality 2 */}
            <SpotlightCard className="rounded-lg shadow-none hover:translate-y-0 hover:shadow-none">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">
                  02
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Receipt className="size-4" />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight text-neutral-950">
                {t("landing.r2Title")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {t("landing.r2Desc")}
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                {t("landing.r2Meta")} <span className="font-semibold text-[#5B4FE9]">{t("landing.r2Value")}</span>
              </div>
            </SpotlightCard>

            {/* Reality 3 */}
            <SpotlightCard className="rounded-lg shadow-none hover:translate-y-0 hover:shadow-none">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">
                  03
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Package className="size-4" />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight text-neutral-950">
                {t("landing.r3Title")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {t("landing.r3Desc")}
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                {t("landing.r3Meta")} <span className="font-semibold text-neutral-900">{t("landing.r3Value")}</span>
              </div>
            </SpotlightCard>

            {/* Reality 4 */}
            <SpotlightCard className="rounded-lg shadow-none hover:translate-y-0 hover:shadow-none lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">
                  04
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Clock className="size-4" />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-semibold tracking-tight text-neutral-950">
                {t("landing.r4Title")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {t("landing.r4Desc")}
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                {t("landing.r4Meta")} <span className="font-semibold text-neutral-900">{t("landing.r4Value")}</span>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* 4. Notebook vs. Andalus OS (Structured Comparison) */}
      <section id="features" className="border-b border-neutral-200/90 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              {t("landing.systemComparison")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {t("landing.compTitle")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              {t("landing.compDesc")}
            </p>
          </Reveal>

          <div className="mt-10 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 divide-y divide-neutral-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Left Column: Old Way */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-neutral-700">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <span className="text-xs font-semibold tracking-tight uppercase">
                    {t("landing.oldWay")}
                  </span>
                </div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>{t("landing.old1")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>{t("landing.old2")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>{t("landing.old3")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>{t("landing.old4")}</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Andalus POS */}
              <div className="bg-neutral-50/70 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-[#5B4FE9]">
                  <Check className="size-4 text-[#5B4FE9]" />
                  <span className="text-xs font-semibold tracking-tight uppercase text-neutral-900">
                    {t("landing.newWay")}
                  </span>
                </div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-800">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>{t("landing.new1a")}</strong> {t("landing.new1b")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>{t("landing.new2a")}</strong> {t("landing.new2b")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>{t("landing.new3a")}</strong>: {t("landing.new3b")}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>{t("landing.new4a")}</strong>: {t("landing.new4b")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Debt Ledger Module Deep-Dive with Interactive Voucher Simulator */}
      <section id="debt-ledger" className="border-b border-neutral-200/90 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
                {t("landing.creditAccounting")}
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {t("landing.debtTitle")}
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600">
                {t("landing.debtDesc")}
              </p>

              <div className="mt-6 space-y-3 text-xs text-neutral-700">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 text-[#5B4FE9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">{t("landing.ceilingsLabel")}</strong> {t("landing.ceilingsText")}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check className="size-4 text-[#5B4FE9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">{t("landing.slipsLabel")}</strong> {t("landing.slipsText")}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check className="size-4 text-[#5B4FE9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">{t("landing.partialLabel")}</strong> {t("landing.partialText")}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visual Simulated Debt Slip */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0F172A] p-5 text-neutral-200 shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-[#5B4FE9]" />
                    <span className="font-mono text-xs font-semibold text-white">{t("landing.voucherTitle")}</span>
                  </div>
                  <span className="rounded bg-[#5B4FE9]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
                    {t("landing.demoBadge")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">{t("landing.customerName")}</span>
                    <div className="mt-0.5 font-semibold text-white">Dawit Kebede</div>
                    <div className="font-mono text-[10px] text-slate-400">+251 91 123 4567</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">{t("landing.creditLimit")}</span>
                    <div className="mt-0.5 font-mono font-semibold text-white">{t("landing.etbAmount", { amount: "5,000.00" })}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {t("landing.utilized", { percent: Math.round((currentSimulatedDebt / 5000) * 100) })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{t("landing.initialTab")}</span>
                    <span>{t("landing.etbAmount", { amount: "3,400.00" })}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-emerald-400">
                    <span>{t("landing.paymentReceived")}</span>
                    <span>- {t("landing.etbAmount", { amount: `${simulatedPaid.toLocaleString()}.00` })}</span>
                  </div>
                  <div className="my-2 border-t border-slate-800" />
                  <div className="flex justify-between font-bold text-white">
                    <span>{t("landing.remaining")}</span>
                    <span className={voucherSettled ? "text-emerald-400" : "text-[#786ef7]"}>
                      {voucherSettled ? t("landing.paidInFull") : t("landing.etbAmount", { amount: `${currentSimulatedDebt.toLocaleString()}.00` })}
                    </span>
                  </div>
                </div>

                {/* Quick Repayment Tender Chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-mono uppercase text-slate-400">{t("landing.simulateRepay")}</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handlePayBirr(500)}
                      disabled={voucherSettled}
                      className="cursor-pointer rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-40"
                    >
                      {t("landing.addAmount", { amount: "500" })}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayBirr(1000)}
                      disabled={voucherSettled}
                      className="cursor-pointer rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-40"
                    >
                      {t("landing.addAmount", { amount: "1,000" })}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayBirr(initialDebt)}
                      disabled={voucherSettled}
                      className="cursor-pointer rounded-md border border-[#5B4FE9]/40 bg-[#5B4FE9]/20 px-2.5 py-1 text-[11px] font-mono text-indigo-200 transition hover:bg-[#5B4FE9]/30 disabled:opacity-40"
                    >
                      {t("landing.payFull")}
                    </button>
                    {simulatedPaid > 0 && (
                      <button
                        type="button"
                        onClick={handleResetVoucher}
                        className="cursor-pointer rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-mono text-slate-400 transition hover:text-white"
                      >
                        {t("landing.resetDemo")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hardware Compatibility */}
      <section id="hardware" className="border-b border-neutral-200/90 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              {t("landing.compat")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {t("landing.hwTitle")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              {t("landing.hwDesc")}
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <Barcode className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">{t("landing.hw1Title")}</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                {t("landing.hw1Desc")}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <Printer className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">{t("landing.hw2Title")}</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                {t("landing.hw2Desc")}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <MonitorCheck className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">{t("landing.hw3Title")}</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                {t("landing.hw3Desc")}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <WifiOff className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">{t("landing.hw4Title")}</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                {t("landing.hw4Desc")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Verified Merchant Dispatches */}
      <section className="border-b border-neutral-200/90 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              {t("landing.dispatches")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {t("landing.dispatchesTitle")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              {t("landing.dispatchesDesc")}
            </p>
          </Reveal>
        </div>
        <InfiniteMovingCards
          className="mt-10"
          items={TESTIMONIALS}
          getKey={(item) => item.name}
          renderItem={(item) => (
            <figure className="flex h-full w-[340px] flex-col justify-between rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:w-[400px]">
              <blockquote className="text-sm leading-relaxed text-zinc-700">&ldquo;{t(item.quoteKey)}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-3 text-xs">
                <span className="font-medium text-zinc-900">
                  {item.name} <span className="font-normal text-zinc-500">· {t(item.roleKey)}</span>
                </span>
                <span className="font-mono text-[11px] text-[#5B4FE9]">{item.area}</span>
              </figcaption>
            </figure>
          )}
        />
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="border-b border-neutral-200/90 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div>
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              {t("landing.qa")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              {t("landing.faqTitle")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              {t("landing.faqDesc")}
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            defaultValue="faq-0"
            className="mt-8 rounded-lg border border-zinc-200 bg-white px-5"
          >
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.qKey} value={`faq-${index}`} className="border-zinc-200">
                <AccordionTrigger className="py-5 text-sm font-semibold text-zinc-900 hover:no-underline">
                  {t(faq.qKey)}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-600">{t(faq.aKey)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 9. Closing Action Block with Ambient Backlight Glow */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#0F172A] p-8 text-white sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_left,#000,transparent_70%)]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgb(51 65 85 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(51 65 85 / 0.5) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            <div className="relative max-w-2xl">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#786ef7]">
                {t("landing.counterReady")}
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {t("landing.ctaTitle")}
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t("landing.ctaDesc")}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#5B4FE9] px-5 text-sm font-medium text-white transition-colors hover:bg-[#4D40D9] active:bg-[#3E32C4]"
                >
                  <span>{t("landing.openStore")}</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <span>{t("landing.signInTerminal")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-neutral-200 bg-[#fafbfc] py-12 text-xs text-neutral-600">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-3">
              <AndalusLogo variant="compact" />
              <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
                {t("landing.footerDesc")}
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>{t("landing.opStatus")}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:text-neutral-950 hover:border-neutral-300">
                  <InstagramIcon />
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:text-neutral-950 hover:border-neutral-300">
                  <FacebookIcon />
                </span>
                <span className="flex size-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:text-neutral-950 hover:border-neutral-300">
                  <LinkedInIcon />
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">{t("landing.footerProduct")}</h4>
              <ul className="mt-3 space-y-2 text-neutral-600 text-xs">
                <li><a href="#features" className="hover:text-neutral-950 transition-colors">{t("landing.footerPos")}</a></li>
                <li><a href="#debt-ledger" className="hover:text-neutral-950 transition-colors">{t("landing.footerDebt")}</a></li>
                <li><a href="#realities" className="hover:text-neutral-950 transition-colors">{t("landing.footerInventory")}</a></li>
                <li><a href="#hardware" className="hover:text-neutral-950 transition-colors">{t("landing.footerHardware")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">{t("landing.footerAccess")}</h4>
              <ul className="mt-3 space-y-2 text-neutral-600 text-xs">
                <li><Link href="/login" className="hover:text-neutral-950 transition-colors">{t("landing.footerSignIn")}</Link></li>
                <li><Link href="/register" className="hover:text-neutral-950 transition-colors">{t("landing.footerCreate")}</Link></li>
                <li><Link href="/forgot-password" className="hover:text-neutral-950 transition-colors">{t("landing.footerRecover")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">{t("landing.footerOffice")}</h4>
              <ul className="mt-3 space-y-2 text-neutral-600 text-xs">
                <li>{t("landing.footerAddress")}</li>
                <li>support@andaluspos.com</li>
                <li>+251 91 100 0000</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-neutral-200 pt-6 text-neutral-500 sm:flex-row text-[11px]">
            <div>{t("landing.rights")}</div>
            <div className="mt-2 sm:mt-0 font-mono">{t("landing.tagline")}</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
