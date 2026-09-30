"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Barcode,
  Check,
  ChevronDown,
  Coins,
  Cpu,
  Menu,
  MonitorCheck,
  Package,
  Printer,
  Receipt,
  ScanLine,
  Sparkles,
  Store,
  WifiOff,
  X,
} from "lucide-react";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "@/components/landing/social-icons";
import { AndalusLogo } from "@/components/shared/andalus-mark";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Operations", href: "#realities" },
  { label: "Debt Ledger", href: "#debt-ledger" },
  { label: "Hardware", href: "#hardware" },
  { label: "FAQ", href: "#faq" },
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-neutral-900 selection:bg-[#5B4FE9]/10 selection:text-[#5B4FE9]">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/landing-page" aria-label="Andalus Home" className="flex items-center gap-2 transition hover:opacity-90">
            <AndalusLogo variant="compact" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-medium tracking-tight text-neutral-600 transition-colors hover:text-neutral-950"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="inline-flex h-8.5 items-center justify-center rounded-md px-3.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group inline-flex h-8.5 items-center justify-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4d42c7] hover:shadow-md hover:shadow-[#5B4FE9]/20 active:scale-[0.98]"
            >
              <span>Launch Store</span>
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 lg:hidden"
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
                <Link
                  href="/login"
                  className="flex h-9 w-full items-center justify-center rounded-md border border-neutral-200 text-xs font-medium text-neutral-900"
                >
                  Sign In to Terminal
                </Link>
                <Link
                  href="/register"
                  className="flex h-9 w-full items-center justify-center rounded-md bg-[#5B4FE9] text-xs font-semibold text-white"
                >
                  Launch Store Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Architectural Grid + Deliberate Illumination + Micro-Animations) */}
      <section className="relative overflow-hidden border-b border-neutral-200/90 bg-[#fafbfc] py-16 sm:py-20 lg:py-24">
        {/* Balanced Architectural Grid & Dot Matrix Canvas */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* Precision 32px Technical Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_85%_70%_at_50%_40%,#000_65%,transparent_100%)] opacity-45" />
          {/* Subtle Intersection Dots */}
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_40%,#000_70%,transparent_100%)] opacity-55" />
          {/* Rich Luminous Indigo Backlight Aura (Behind Terminal Pedestal & Canvas) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[520px] w-[640px] rounded-full bg-gradient-to-tr from-[#5B4FE9]/25 via-indigo-500/20 to-violet-500/15 blur-[90px]" />
          <div className="absolute left-10 -top-20 h-[380px] w-[460px] rounded-full bg-[#5B4FE9]/12 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left: Headline & Actions (6 cols) */}
            <div className="lg:col-span-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="inline-flex items-center gap-2 rounded-md border border-neutral-200/90 bg-white px-2.5 py-1 text-[11px] font-mono font-medium text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>ANDALUS RETAIL OS</span>
                <span className="text-neutral-300">/</span>
                <span className="text-neutral-900 font-semibold">RETAIL TERMINAL</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
                Every item scanned.
                <br />
                Every Birr accounted for.
                <br />
                <span className="bg-gradient-to-r from-[#5B4FE9] via-indigo-600 to-[#786ef7] bg-clip-text text-transparent">
                  Every debt recovered.
                </span>
              </h1>

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-neutral-600 max-w-xl">
                Running a busy shop in Addis shouldn&apos;t mean staying up until midnight reconciling paper
                notebooks, missing inventory, and uncollected customer tabs. Andalus is the high-speed,
                tactile retail counter system engineered for mini-markets and supermarkets.
              </p>

              {/* Action Buttons with Micro-Interactions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#5B4FE9] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4d42c7] hover:shadow-md hover:shadow-[#5B4FE9]/25 active:scale-[0.98]"
                >
                  <span>Open Your Store Account</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 text-xs font-medium text-neutral-800 transition-all hover:bg-neutral-50 hover:border-neutral-400 active:scale-[0.98]"
                >
                  <Store className="size-4 text-neutral-500" />
                  <span>Terminal Sign In</span>
                </Link>
              </div>

              {/* Hard Operational Numbers Bar */}
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-neutral-200/80 pt-6 sm:grid-cols-4">
                <div className="transition-transform hover:-translate-y-0.5 duration-200">
                  <div className="font-mono text-xl font-bold tracking-tight text-neutral-950">99.98%</div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">Offline Uptime</div>
                </div>
                <div className="transition-transform hover:-translate-y-0.5 duration-200">
                  <div className="font-mono text-xl font-bold tracking-tight text-neutral-950">ETB 45M+</div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">Monthly Volume</div>
                </div>
                <div className="transition-transform hover:-translate-y-0.5 duration-200">
                  <div className="font-mono text-xl font-bold tracking-tight text-neutral-950">&lt; 200ms</div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">Scan Latency</div>
                </div>
                <div className="transition-transform hover:-translate-y-0.5 duration-200">
                  <div className="font-mono text-xl font-bold tracking-tight text-neutral-950">500+</div>
                  <div className="mt-0.5 text-[11px] text-neutral-500">Active Stores</div>
                </div>
              </div>
            </div>

            {/* Right: Live POS Terminal Preview (6 cols) */}
            <div className="relative lg:col-span-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="mb-2.5 flex items-center justify-between text-xs text-neutral-500">
                <span className="font-medium tracking-tight text-neutral-700 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#5B4FE9]" />
                  Live Counter Simulation
                </span>
                <span className="font-mono text-[11px]">Click items to ring up cart</span>
              </div>

              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 4 Realities of Shop Operations */}
      <section id="realities" className="border-b border-neutral-200/90 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
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
          </div>

          <div className="mt-12 grid grid-cols-1 divide-y divide-neutral-200 border-y border-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {/* Reality 1 */}
            <div className="group p-6 transition-all duration-200 hover:bg-neutral-50/70">
              <span className="font-mono text-xs font-semibold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">01</span>
              <h3 className="mt-2 text-sm font-semibold tracking-tight text-neutral-950">
                The Rush Hour Queue
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                When customers stand in line, every second per item counts. Instant barcode scans, keyboard
                shortcuts, and one-tap tenders prevent counter bottlenecks.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Avg queue time: <span className="font-semibold text-neutral-900">&lt; 35 seconds</span>
              </div>
            </div>

            {/* Reality 2 */}
            <div className="group p-6 transition-all duration-200 hover:bg-neutral-50/70">
              <span className="font-mono text-xs font-semibold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">02</span>
              <h3 className="mt-2 text-sm font-semibold tracking-tight text-neutral-950">
                Customer Debt Ledger
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Neighborhood regulars buy groceries on credit daily. Phone-linked debtor records eliminate
                notebook disputes, enforce ceilings, and accelerate payback.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Debt recovery: <span className="font-semibold text-[#5B4FE9]">98.2% collected</span>
              </div>
            </div>

            {/* Reality 3 */}
            <div className="group p-6 transition-all duration-200 hover:bg-neutral-50/70">
              <span className="font-mono text-xs font-semibold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">03</span>
              <h3 className="mt-2 text-sm font-semibold tracking-tight text-neutral-950">
                Stockouts &amp; Spoilage
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Running out of cooking oil or milk means lost customers. Automated low-stock thresholds flag
                fast-moving goods before shelves go empty, with expiry tracking.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Inventory radar: <span className="font-semibold text-neutral-900">Zero surprises</span>
              </div>
            </div>

            {/* Reality 4 */}
            <div className="group p-6 transition-all duration-200 hover:bg-neutral-50/70">
              <span className="font-mono text-xs font-semibold text-neutral-400 group-hover:text-[#5B4FE9] transition-colors">04</span>
              <h3 className="mt-2 text-sm font-semibold tracking-tight text-neutral-950">
                Closing Shift Audit
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Never wonder where cash vanished at 9:00 PM. End-of-shift reports reconcile drawer cash
                against Telebirr confirmation SMS, CBE deposits, and credit tabs.
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-3 text-[11px] font-mono text-neutral-500">
                Shift reconciliation: <span className="font-semibold text-neutral-900">3 minutes flat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Notebook vs. Andalus OS (Structured Comparison) */}
      <section id="features" className="border-b border-neutral-200/90 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              SYSTEM COMPARISON
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Paper Ledgers vs. Andalus Retail OS
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              Why modern supermarket and mini-market owners retire paper notebooks and manual calculators.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xs">
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
              <div className="bg-neutral-50/50 p-6 sm:p-8">
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

      {/* 5. Customer Debt Ledger Module Deep-Dive */}
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
                    limit (e.g. ETB 4,000). The register alerts cashiers if a purchase exceeds the ceiling.
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
                    <strong className="text-neutral-900">Partial Settlements:</strong> When the customer brings 1,500 ETB, deduct it in one
                    tap and print an updated statement immediately.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Simulated Debt Slip */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-lg border border-neutral-800 bg-[#0A0D12] p-5 text-neutral-200 shadow-xl transition-all duration-300 hover:border-neutral-700">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-[#5B4FE9]" />
                    <span className="font-mono text-xs font-semibold text-white">CUSTOMER DEBT VOUCHER</span>
                  </div>
                  <span className="rounded bg-[#5B4FE9]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5B4FE9]">
                    CREDIT ACCOUNT
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md bg-neutral-900/80 p-3 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400">Customer Name</span>
                    <div className="mt-0.5 font-semibold text-white">Dawit Kebede</div>
                    <div className="font-mono text-[10px] text-neutral-500">+251 91 123 4567</div>
                  </div>
                  <div className="rounded-md bg-neutral-900/80 p-3 border border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400">Credit Limit</span>
                    <div className="mt-0.5 font-mono font-semibold text-white">ETB 5,000.00</div>
                    <div className="text-[10px] text-neutral-400">68% balance utilized</div>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Previous Outstanding</span>
                    <span>ETB 2,850.00</span>
                  </div>
                  <div className="mt-1 flex justify-between text-neutral-400">
                    <span>Today&apos;s Goods (Sale #4092)</span>
                    <span>+ ETB 550.00</span>
                  </div>
                  <div className="my-2 border-t border-neutral-800" />
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Current Balance</span>
                    <span className="text-[#5B4FE9]">ETB 3,400.00</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-md bg-[#5B4FE9] py-2 text-center text-xs font-medium text-white shadow-sm transition-all hover:bg-[#4d42c7] active:scale-[0.98]"
                  >
                    Receive Payment
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-300 transition-all hover:text-white hover:bg-neutral-700 active:scale-[0.98]"
                  >
                    Print Statement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hardware Compatibility */}
      <section id="hardware" className="border-b border-neutral-200/90 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              COMPATIBILITY
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Works With Hardware You Already Own
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              No proprietary terminal leases. Connect standard USB barcode guns, thermal receipt printers, or Android tablets.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xs">
              <Barcode className="size-5 text-neutral-700" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Barcode Scanners</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                USB &amp; Bluetooth handheld guns with instant keystroke emulation.
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xs">
              <Printer className="size-5 text-neutral-700" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Thermal Receipt Printers</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                Standard 58mm &amp; 80mm ESC/POS printers via USB, network LAN, or Bluetooth.
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xs">
              <MonitorCheck className="size-5 text-neutral-700" />
              <div className="mt-3 text-xs font-semibold text-neutral-900">Any Screen Hardware</div>
              <div className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                Touchscreen All-In-One PCs, desktop monitors, laptops, and Android tablets.
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xs">
              <WifiOff className="size-5 text-neutral-700" />
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
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#5B4FE9]">
              FIELD DISPATCHES
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Merchant Dispatches From Addis Ababa
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600">
              Verified operational feedback from retail managers and supermarket owners.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-lg border border-neutral-200 bg-[#fafbfc] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div>
                <span className="font-mono text-[11px] font-semibold text-[#5B4FE9]">BOLE MEDHANEALEM</span>
                <div className="mt-1 text-xs font-semibold text-neutral-900">Bole Neighborhood Mart</div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  &ldquo;Before Andalus, cashier shift changes took 45 minutes of manual counting and arguing over customer tabs.
                  Now closing takes 3 minutes and our debt recovery rate is over 98%.&rdquo;
                </p>
              </div>
              <div className="mt-5 border-t border-neutral-200 pt-3 text-[11px] font-medium text-neutral-500">
                Yonas T. • Store Owner
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-neutral-200 bg-[#fafbfc] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div>
                <span className="font-mono text-[11px] font-semibold text-[#5B4FE9]">KAZANCHIS</span>
                <div className="mt-1 text-xs font-semibold text-neutral-900">Kazanchis Daily Grocery</div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  &ldquo;During the 5:00 PM rush, customers used to walk out because checkout was too slow. Barcode scan
                  speed and instant Telebirr/CBE payment buttons cut our counter queues in half.&rdquo;
                </p>
              </div>
              <div className="mt-5 border-t border-neutral-200 pt-3 text-[11px] font-medium text-neutral-500">
                Selamawit A. • Manager
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-neutral-200 bg-[#fafbfc] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
              <div>
                <span className="font-mono text-[11px] font-semibold text-[#5B4FE9]">SARBET</span>
                <div className="mt-1 text-xs font-semibold text-neutral-900">Red Sea Minimarket</div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  &ldquo;The low stock radar saved us from constant dairy shortages. I can check real-time sales margins
                  from my phone while I&apos;m at the Merkato wholesale depot.&rdquo;
                </p>
              </div>
              <div className="mt-5 border-t border-neutral-200 pt-3 text-[11px] font-medium text-neutral-500">
                Abel K. • Managing Partner
              </div>
            </div>
          </div>
        </div>
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

          <div className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50/60"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#5B4FE9]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Closing Action Block */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-[#0A0D12] p-8 text-white sm:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#5B4FE9]/15 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#5B4FE9]">
                COUNTER READY
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Ring up your first customer in under 10 minutes.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Create your store, configure your top items or barcode catalog, and start processing
                sales today. No upfront equipment leases or expensive proprietary hardware required.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5B4FE9] px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4d42c7] hover:shadow-md hover:shadow-[#5B4FE9]/25 active:scale-[0.98]"
                >
                  <span>Open Your Store Account</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-5 text-xs font-medium text-neutral-200 transition-all hover:bg-neutral-800 hover:text-white active:scale-[0.98]"
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
                <span className="flex size-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:text-neutral-950 hover:border-neutral-300">
                  <InstagramIcon />
                </span>
                <span className="flex size-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:text-neutral-950 hover:border-neutral-300">
                  <FacebookIcon />
                </span>
                <span className="flex size-7 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition hover:text-neutral-950 hover:border-neutral-300">
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
