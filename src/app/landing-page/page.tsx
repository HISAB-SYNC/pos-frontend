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
import { useAuthStore } from "@/stores/auth-store";

const emptySubscribe = () => () => {};

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Operations", href: "#realities" },
  { label: "Debt Ledger", href: "#debt-ledger" },
  { label: "Hardware", href: "#hardware" },
  { label: "FAQ", href: "#faq" },
];

const heroCapabilities = [
  { icon: WifiOff, label: "Works offline" },
  { icon: Coins, label: "Telebirr & CBE" },
  { icon: Receipt, label: "Customer credit tabs" },
  { icon: Barcode, label: "Any USB scanner" },
];

const heroMetrics: Array<{ value: number; label: string; prefix?: string; suffix?: string; decimals?: number }> = [
  { value: 200, label: "Scan to cart", prefix: "< ", suffix: "ms" },
  { value: 99.98, label: "Offline uptime", suffix: "%", decimals: 2 },
  { value: 45, label: "Monthly volume", prefix: "ETB ", suffix: "M+" },
  { value: 500, label: "Active stores", suffix: "+" },
];

const TESTIMONIALS = [
  {
    name: "Yonas T.",
    role: "Store Owner",
    area: "Bole Medhanealem",
    quote:
      "Shift changes used to take 45 minutes of counting and arguing over tabs. Now closing takes 3 minutes and we collect over 98% of customer debt.",
  },
  {
    name: "Selamawit A.",
    role: "Manager",
    area: "Kazanchis",
    quote:
      "At the 5 PM rush customers used to walk out. Fast scanning and one-tap Telebirr and CBE tenders cut our queue in half.",
  },
  {
    name: "Abel K.",
    role: "Managing Partner",
    area: "Sarbet",
    quote:
      "Low-stock alerts stopped our dairy shortages. I check margins from my phone while I'm at the Merkato wholesale depot.",
  },
  {
    name: "Hanna G.",
    role: "Owner",
    area: "Piassa",
    quote:
      "The internet drops twice a day here. Andalus keeps ringing sales and syncs everything when the connection is back.",
  },
  {
    name: "Mekdes B.",
    role: "Cashier Lead",
    area: "CMC",
    quote: "New cashiers learn the register in one afternoon. Prices are locked, so I don't worry about mistakes at the till.",
  },
];

const FAQS = [
  {
    q: "Does Andalus keep working when the internet drops or during power outages?",
    a: "Yes. Andalus is built with local offline caching. Cashiers can continue scanning barcodes, ringing up items, and printing receipts even if the network is disconnected. The moment your connection recovers, all transactions sync to the cloud in the background with zero data loss.",
  },
  {
    q: "Can cashiers change item prices or delete items without manager approval?",
    a: "No. Role-based security prevents unauthorized price overrides, cart voids, or stock adjustments. Any restricted action requires a manager PIN or approval, and every event is recorded with an audit trail.",
  },
  {
    q: "How does the Customer Debt Ledger work?",
    a: "When a trusted customer buys on credit, cashiers select Customer Debt instead of cash. The system links the balance to the customer's phone number, enforces credit ceilings, prints an acknowledgement slip, and allows 1-click partial or full settlements anytime.",
  },
  {
    q: "What hardware does Andalus support in our shop?",
    a: "Andalus works out of the box with standard USB or Bluetooth handheld barcode scanners, 58mm & 80mm ESC/POS thermal receipt printers, RJ11 auto-opening cash drawers, and runs on any PC, laptop, or Android tablet screen.",
  },
  {
    q: "Can I manage multiple branch stores from a single phone or laptop?",
    a: "Store owners can switch between all branches (e.g. Bole, Kazanchis, Piassa) in real time to compare sales, transfer stock between shops, and inspect cashier closing drawers without being physically present.",
  },
];

export default function LandingPage() {
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
    if (!user) return "Dashboard";
    if (user.role === "SUPER_ADMIN" || user.role === "SYSTEM_ADMIN") return "Admin Console";
    if (user.role === "SALES") return "POS Register";
    return "Dashboard";
  }, [user]);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-neutral-900 selection:bg-[#5B4FE9]/15 selection:text-[#5B4FE9]">
      {/* 1. Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/landing-page" aria-label="Andalus Home" className="flex items-center gap-2 transition hover:opacity-90">
            <AndalusLogo variant="compact" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-950"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden items-center gap-3 sm:flex">
            {isLoggedIn ? (
              <Link
                href={destination}
                className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4D40D9] active:bg-[#3E32C4]"
              >
                <span>Go to {destinationLabel}</span>
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4D40D9] active:bg-[#3E32C4]"
                >
                  <span>Launch Store</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 lg:hidden"
            aria-label="Toggle navigation"
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
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-medium text-neutral-700 hover:text-neutral-950"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                {isLoggedIn ? (
                  <Link
                    href={destination}
                    className="flex h-9.5 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5B4FE9] text-xs font-semibold text-white shadow-sm"
                  >
                    <span>Go to {destinationLabel}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex h-9.5 w-full items-center justify-center rounded-lg border border-neutral-200 text-xs font-medium text-neutral-900"
                    >
                      Sign In to Terminal
                    </Link>
                    <Link
                      href="/register"
                      className="flex h-9.5 w-full items-center justify-center rounded-lg bg-[#5B4FE9] text-xs font-semibold text-white shadow-sm"
                    >
                      Launch Store Free
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
                  Point of sale for Ethiopian shops
                </div>
              </Reveal>

              <h1 className="mt-6 text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl lg:text-[5.25rem]">
                <BlurText text="Run the counter." />
                <br />
                <BlurText text="Skip the notebook." delay={0.3} className="text-zinc-400" />
              </h1>

              <Reveal delay={0.6}>
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600">
                  {heroCapabilities.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2">
                      <Icon className="size-4 text-[#5B4FE9]" strokeWidth={1.75} />
                      {label}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <Reveal delay={0.45} className="lg:col-span-4">
              <p className="max-w-md text-base leading-relaxed text-zinc-600">
                Fast barcode checkout, Telebirr and CBE tenders, and customer credit tabs for mini-markets
                and supermarkets &mdash; and it keeps selling when the internet drops.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {isLoggedIn ? (
                  <Button asChild size="lg" className="group h-11 px-5">
                    <Link href={destination}>
                      Open {destinationLabel}
                      <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="group h-11 px-5">
                      <Link href="/register">
                        Start for free
                        <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-11 border-zinc-300 bg-white px-5">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>

              <p className="mt-4 text-xs text-zinc-500">Free tier available. No hardware leases.</p>
            </Reveal>
          </div>

          {/* Metrics */}
          <dl className="relative mt-16 grid grid-cols-2 border-y border-zinc-200 bg-white sm:grid-cols-4">
            {heroMetrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`py-5 sm:px-6 ${index > 0 ? "sm:border-l sm:border-zinc-200" : "sm:pl-0"} ${
                  index % 2 === 1 ? "border-l border-zinc-200 pl-5" : ""
                } ${index > 1 ? "border-t border-zinc-200 sm:border-t-0" : ""}`}
              >
                <dt className="text-xs text-zinc-500">{metric.label}</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                  <CountUp
                    to={metric.value}
                    decimals={metric.decimals}
                    prefix={metric.prefix}
                    suffix={metric.suffix}
                  />
                </dd>
              </div>
            ))}
          </dl>

          {/* Live counter simulator */}
          <Reveal className="mt-12">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-800">Live counter simulator</span>
              <span className="font-mono text-zinc-500">Click items to ring up a cart</span>
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
              CORE ARCHITECTURE
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              The 4 Realities of Running a Retail Store in Ethiopia
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Retail software must be built for real counter pressures: power outages, Telebirr transfers,
              uncollected customer credit, and rush-hour bottlenecks.
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
                The Rush Hour Queue
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                When customers stand in line, every second per item counts. Instant barcode scans, keyboard
                shortcuts, and one-tap tenders prevent counter bottlenecks.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Avg queue time: <span className="font-semibold text-neutral-900">&lt; 35 seconds</span>
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
                Customer Debt Ledger
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Neighborhood regulars buy groceries on credit daily. Phone-linked debtor records eliminate
                notebook disputes, enforce ceilings, and accelerate payback.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Debt recovery: <span className="font-semibold text-[#5B4FE9]">98.2% collected</span>
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
                Stockouts &amp; Spoilage
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Running out of cooking oil or milk means lost customers. Automated low-stock thresholds flag
                fast-moving goods before shelves go empty, with expiry tracking.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Inventory radar: <span className="font-semibold text-neutral-900">Zero surprises</span>
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
                Closing Shift Audit
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Never wonder where cash vanished at 9:00 PM. End-of-shift reports reconcile drawer cash
                against Telebirr confirmation SMS, CBE deposits, and credit tabs.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Shift reconciliation: <span className="font-semibold text-neutral-900">3 minutes flat</span>
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
              SYSTEM COMPARISON
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Paper Ledgers vs. Andalus Retail OS
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              Why modern supermarket and mini-market owners retire paper notebooks and manual calculators.
            </p>
          </Reveal>

          <div className="mt-10 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 divide-y divide-neutral-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Left Column: Old Way */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-neutral-700">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <span className="text-xs font-semibold tracking-tight uppercase">
                    The Paper Notebook &amp; Cash Box Method
                  </span>
                </div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>Customer debt recorded in torn notebooks leads to lost revenue and counter disputes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>No visibility on gross profit margins until month-end accounting, if ever calculated.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>Unchecked price overrides and unauthorized discounts pass undetected without audit logs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono text-[11px] shrink-0">—</span>
                    <span>Price adjustments require manually updating every individual product price label.</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Andalus POS */}
              <div className="bg-neutral-50/70 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-[#5B4FE9]">
                  <Check className="size-4 text-[#5B4FE9]" />
                  <span className="text-xs font-semibold tracking-tight uppercase text-neutral-900">
                    The Andalus POS Standard
                  </span>
                </div>
                <ul className="mt-6 space-y-3.5 text-xs text-neutral-800">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>Phone-verified debt tracking</strong> with balance ceilings and printed slips.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>Real-time gross margin calculation</strong> on every completed transaction and shift.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>Role-locked controls</strong>: Price modifications and cart voids require manager PIN.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-3.5 text-[#5B4FE9] shrink-0 mt-0.5" />
                    <span><strong>Instant catalog updates</strong>: Change price once and every terminal syncs immediately.</span>
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
                CREDIT ACCOUNTING
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                The Customer Debt Ledger Built Directly Into Checkout
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-600">
                In residential neighborhoods across Addis, regular customers purchase groceries on credit and settle
                on payday. Andalus eliminates awkward disputes and forgotten tabs forever.
              </p>

              <div className="mt-6 space-y-3 text-xs text-neutral-700">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 text-[#5B4FE9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">Credit Ceilings:</strong> Assign each regular customer a credit
                    limit (e.g. ETB 5,000). The register alerts cashiers if a purchase exceeds the ceiling.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check className="size-4 text-[#5B4FE9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">Printed Debt Slips:</strong> Thermal slip prints current goods, previous balance,
                    and new total debt with a customer acknowledgement line.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check className="size-4 text-[#5B4FE9] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-neutral-900">Partial Settlements:</strong> When the customer brings 500 or 1,000 ETB, deduct it in one
                    tap and print an updated statement immediately.
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
                    <span className="font-mono text-xs font-semibold text-white">CUSTOMER DEBT VOUCHER</span>
                  </div>
                  <span className="rounded bg-[#5B4FE9]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
                    INTERACTIVE DEMO
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Customer Name</span>
                    <div className="mt-0.5 font-semibold text-white">Dawit Kebede</div>
                    <div className="font-mono text-[10px] text-slate-400">+251 91 123 4567</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Credit Limit</span>
                    <div className="mt-0.5 font-mono font-semibold text-white">ETB 5,000.00</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {Math.round((currentSimulatedDebt / 5000) * 100)}% utilized
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Tab (#4092)</span>
                    <span>ETB 3,400.00</span>
                  </div>
                  <div className="mt-1 flex justify-between text-emerald-400">
                    <span>Payment Received</span>
                    <span>- ETB {simulatedPaid.toLocaleString()}.00</span>
                  </div>
                  <div className="my-2 border-t border-slate-800" />
                  <div className="flex justify-between font-bold text-white">
                    <span>Remaining Balance</span>
                    <span className={voucherSettled ? "text-emerald-400" : "text-[#786ef7]"}>
                      {voucherSettled ? "PAID IN FULL ✓" : `ETB ${currentSimulatedDebt.toLocaleString()}.00`}
                    </span>
                  </div>
                </div>

                {/* Quick Repayment Tender Chips */}
                <div className="mt-4">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Simulate Repayment:</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handlePayBirr(500)}
                      disabled={voucherSettled}
                      className="cursor-pointer rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-40"
                    >
                      +500 ETB
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayBirr(1000)}
                      disabled={voucherSettled}
                      className="cursor-pointer rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-mono text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-40"
                    >
                      +1,000 ETB
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePayBirr(initialDebt)}
                      disabled={voucherSettled}
                      className="cursor-pointer rounded-md border border-[#5B4FE9]/40 bg-[#5B4FE9]/20 px-2.5 py-1 text-[11px] font-mono text-indigo-200 transition hover:bg-[#5B4FE9]/30 disabled:opacity-40"
                    >
                      Pay Full Tab
                    </button>
                    {simulatedPaid > 0 && (
                      <button
                        type="button"
                        onClick={handleResetVoucher}
                        className="cursor-pointer rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-mono text-slate-400 transition hover:text-white"
                      >
                        Reset Demo
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
              COMPATIBILITY
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Works With Hardware You Already Own
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              No proprietary terminal leases. Connect standard USB barcode guns, thermal receipt printers, or Android tablets.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <Barcode className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Barcode Scanners</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                USB &amp; Bluetooth handheld guns with instant keystroke emulation.
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <Printer className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Thermal Receipt Printers</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                Standard 58mm &amp; 80mm ESC/POS printers via USB, network LAN, or Bluetooth.
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <MonitorCheck className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Any Screen Hardware</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                Touchscreen All-In-One PCs, desktop monitors, laptops, and Android tablets.
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#5B4FE9]/40 hover:shadow-md">
              <WifiOff className="size-5 text-[#5B4FE9]" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Offline Resilience</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                Continues ringing transactions even if fiber or mobile data disconnects.
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
              FIELD DISPATCHES
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Merchant Dispatches From Addis Ababa
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              Verified operational feedback from retail managers and supermarket owners.
            </p>
          </Reveal>
        </div>
        <InfiniteMovingCards
          className="mt-10"
          items={TESTIMONIALS}
          getKey={(t) => t.name}
          renderItem={(t) => (
            <figure className="flex h-full w-[340px] flex-col justify-between rounded-lg border border-zinc-200 bg-zinc-50/60 p-5 sm:w-[400px]">
              <blockquote className="text-sm leading-relaxed text-zinc-700">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-3 text-xs">
                <span className="font-medium text-zinc-900">
                  {t.name} <span className="font-normal text-zinc-500">· {t.role}</span>
                </span>
                <span className="font-mono text-[11px] text-[#5B4FE9]">{t.area}</span>
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
              QUESTIONS &amp; ANSWERS
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              Clear technical and operational details for store operators.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            defaultValue="faq-0"
            className="mt-8 rounded-lg border border-zinc-200 bg-white px-5"
          >
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} className="border-zinc-200">
                <AccordionTrigger className="py-5 text-sm font-semibold text-zinc-900 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-600">{faq.a}</AccordionContent>
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
                COUNTER READY
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Ring up your first customer in under 10 minutes.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Create your store, configure your top items or barcode catalog, and start processing
                sales today. No upfront equipment leases or expensive proprietary hardware required.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#5B4FE9] px-5 text-sm font-medium text-white transition-colors hover:bg-[#4D40D9] active:bg-[#3E32C4]"
                >
                  <span>Open Your Store Account</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <span>Sign In to Terminal</span>
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
                Andalus Retail OS is the point-of-sale and store inventory management
                platform purpose-built for Ethiopian mini-markets, groceries, and retail stores.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Operating status: Normal · v2.4</span>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">Product</h4>
              <ul className="mt-3 space-y-2 text-neutral-600 text-xs">
                <li><a href="#features" className="hover:text-neutral-950 transition-colors">POS Register</a></li>
                <li><a href="#debt-ledger" className="hover:text-neutral-950 transition-colors">Customer Debt Ledger</a></li>
                <li><a href="#realities" className="hover:text-neutral-950 transition-colors">Inventory Radar</a></li>
                <li><a href="#hardware" className="hover:text-neutral-950 transition-colors">Hardware Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">Access</h4>
              <ul className="mt-3 space-y-2 text-neutral-600 text-xs">
                <li><Link href="/login" className="hover:text-neutral-950 transition-colors">Terminal Sign In</Link></li>
                <li><Link href="/register" className="hover:text-neutral-950 transition-colors">Create Store</Link></li>
                <li><Link href="/forgot-password" className="hover:text-neutral-950 transition-colors">Recover Password</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">Addis Ababa Office</h4>
              <ul className="mt-3 space-y-2 text-neutral-600 text-xs">
                <li>Bole Sub-City, Addis Ababa</li>
                <li>support@andaluspos.com</li>
                <li>+251 91 100 0000</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-neutral-200 pt-6 text-neutral-500 sm:flex-row text-[11px]">
            <div>© 2026 Andalus POS. All rights reserved.</div>
            <div className="mt-2 sm:mt-0 font-mono">Precision retail software.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
