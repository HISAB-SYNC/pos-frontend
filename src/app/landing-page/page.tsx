"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
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
  Store,
  WifiOff,
  X,
} from "lucide-react";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "@/components/landing/social-icons";
import { AndalusLogo } from "@/components/shared/andalus-mark";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "The 4 Realities", href: "#realities" },
  { label: "Debt Ledger", href: "#debt-ledger" },
  { label: "Hardware", href: "#hardware" },
  { label: "FAQ", href: "#faq" },
];

const FAQS = [
  {
    q: "Does Andalus keep working when the internet drops or during power blinks?",
    a: "Yes. Andalus is built with local offline caching. Your cashiers can continue scanning barcodes, ringing up items, and printing receipts even if the network is disconnected. The moment your connection recovers, all transactions sync to the cloud in the background with zero data loss.",
  },
  {
    q: "Can cashiers change item prices or delete items without manager approval?",
    a: "No. Role-based security prevents unauthorized price overrides, cart voids, or stock adjustments. Any restricted action requires a manager PIN or approval, and every event is timestamped in the audit log.",
  },
  {
    q: "How does the Customer Debt Ledger work?",
    a: "When a trusted customer buys on credit, cashiers select Customer Debt instead of cash. The system links the balance to the customer's phone number, enforces credit limits (e.g. maximum ETB 5,000), prints an acknowledgement slip, and allows 1-click partial or full settlement anytime.",
  },
  {
    q: "What hardware does Andalus support in our shop?",
    a: "Andalus works out of the box with standard USB or Bluetooth handheld barcode scanners, 58mm & 80mm ESC/POS thermal receipt printers, RJ11 auto-opening cash drawers, and runs on any PC, laptop, or Android tablet screen.",
  },
  {
    q: "Can I manage multiple branch stores from a single phone or laptop?",
    a: "Absolutely. Store owners can toggle between all branches (e.g., Bole, Kazanchis, Piassa) in real-time to compare sales, transfer stock between shops, and inspect cashier closing drawers without being physically present.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-zinc-900 selection:bg-[#c0e763] selection:text-zinc-950">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/landing-page" aria-label="Andalus Home" className="flex items-center gap-2">
            <AndalusLogo variant="compact" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold tracking-wide text-zinc-600 transition-colors hover:text-zinc-950"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0c1017] px-4 text-xs font-semibold text-white transition hover:bg-[#1a2436] active:scale-[0.98]"
            >
              <span>Launch Store</span>
              <ArrowRight className="size-3 text-[#c0e763]" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-zinc-200 bg-white px-5 py-4 lg:hidden">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="flex h-10 w-full items-center justify-center rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-900"
                >
                  Sign In to Terminal
                </Link>
                <Link
                  href="/register"
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-[#0c1017] text-xs font-semibold text-white"
                >
                  Launch Store Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-gradient-to-b from-[#fafcf2] via-white to-[#f6faf0] pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Soft Ambient Glowing Background (Top, Sides, and Under Terminal) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top-center radial illumination */}
          <div className="absolute left-1/2 -top-28 h-[450px] w-[850px] -translate-x-1/2 rounded-full bg-radial from-[#c0e763]/25 via-[#c0e763]/10 to-transparent blur-3xl" />
          {/* Left-side ambient light glow */}
          <div className="absolute -left-36 top-1/4 h-[420px] w-[420px] rounded-full bg-[#c0e763]/16 blur-[100px]" />
          {/* Right-side ambient light glow */}
          <div className="absolute -right-36 top-1/3 h-[450px] w-[450px] rounded-full bg-[#c0e763]/16 blur-[110px]" />
          {/* Under-terminal pedestal glow */}
          <div className="absolute left-1/2 bottom-8 h-[260px] w-[750px] -translate-x-1/2 rounded-full bg-[#c0e763]/20 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Monospace Telemetry Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300/80 bg-white/95 px-3 py-1 text-[11px] font-mono font-medium text-zinc-700 shadow-2xs">
              <span className="flex size-2 rounded-full bg-[#7ea521]" />
              <span>ANDALUS RETAIL OS</span>
              <span className="text-zinc-300">|</span>
              <span className="text-[#547311]">0.18s Barcode Engine</span>
            </div>

            {/* Editorial Title */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.03em] text-zinc-950 sm:text-5xl lg:text-[58px] lg:leading-[1.12]">
              Every item scanned.{" "}
              <br className="hidden sm:inline" />
              Every Birr accounted for.{" "}
              <br className="hidden sm:inline" />
              <span className="underline decoration-[#c0e763] decoration-4 underline-offset-4">
                Every debt recovered.
              </span>
            </h1>

            {/* Grounded narrative */}
            <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
              Running a busy shop in Addis shouldn't mean staying up until midnight reconciling paper
              notebooks, missing inventory, and uncollected customer tabs. Andalus is the tactile,
              high-speed retail counter system engineered for mini-markets and supermarkets.
            </p>

            {/* Action CTA Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c0e763] px-7 text-sm font-bold text-zinc-950 shadow-sm transition duration-150 hover:bg-[#b0d952] active:scale-[0.98] sm:w-auto"
              >
                <span>Open Your Store Free</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-800 transition duration-150 hover:bg-zinc-50 active:scale-[0.98] sm:w-auto"
              >
                <Store className="size-4 text-zinc-600" />
                <span>Sign In to Terminal</span>
              </Link>
            </div>

            {/* Hard Operational Numbers Bar */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-zinc-200/80 pt-6 sm:grid-cols-4">
              <div className="text-left">
                <div className="font-mono text-xl font-bold text-zinc-950 sm:text-2xl">99.98%</div>
                <div className="mt-0.5 text-xs text-zinc-500">Offline & Online Uptime</div>
              </div>
              <div className="text-left">
                <div className="font-mono text-xl font-bold text-zinc-950 sm:text-2xl">ETB 45M+</div>
                <div className="mt-0.5 text-xs text-zinc-500">Monthly Transacted Volume</div>
              </div>
              <div className="text-left">
                <div className="font-mono text-xl font-bold text-zinc-950 sm:text-2xl">&lt; 200ms</div>
                <div className="mt-0.5 text-xs text-zinc-500">Barcode Ring Latency</div>
              </div>
              <div className="text-left">
                <div className="font-mono text-xl font-bold text-zinc-950 sm:text-2xl">500+</div>
                <div className="mt-0.5 text-xs text-zinc-500">Active Retail Merchants</div>
              </div>
            </div>
          </div>

          {/* Interactive Live POS Terminal Showcase */}
          <div className="mt-12 sm:mt-16">
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <ScanLine className="size-3.5 text-[#547311]" />
                Interactive POS Terminal Simulation • Tap any product below to test
              </span>
            </div>
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* 3. The 4 Realities of Shop Operations */}
      <section id="realities" className="border-b border-zinc-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Cpu className="size-3.5 text-[#7ea521]" />
              <span>Core Operational Architecture</span>
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              The 4 Realities of Running a Retail Store in Ethiopia
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Retail software shouldn't be built for Silicon Valley coffee shops. It must be built for
              power cuts, Telebirr transfers, uncollected customer credit, and the 3:00 PM rush hour.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Reality 1 */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-[#fafbfc] p-6 transition duration-200 hover:border-zinc-300 hover:shadow-xs">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#0c1017] text-white">
                  <ScanLine className="size-5 text-[#c0e763]" />
                </div>
                <div className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  REALITY #01
                </div>
                <h3 className="mt-1 text-lg font-bold text-zinc-950">The Evening Rush Hour</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  When 6 customers stand in line, every second per item counts. Instant USB/Bluetooth
                  barcode scans, keyboard shortcuts, and one-tap tenders prevent counter bottlenecks.
                </p>
              </div>
              <div className="mt-5 border-t border-zinc-200/70 pt-3 font-mono text-[11px] text-zinc-500">
                Avg queue time: <span className="font-bold text-zinc-900">&lt; 35 seconds</span>
              </div>
            </div>

            {/* Reality 2 */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-[#fafbfc] p-6 transition duration-200 hover:border-zinc-300 hover:shadow-xs">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#0c1017] text-white">
                  <Receipt className="size-5 text-[#c0e763]" />
                </div>
                <div className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  REALITY #02
                </div>
                <h3 className="mt-1 text-lg font-bold text-zinc-950">The Customer Debt Ledger</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  Customers take items on credit daily. Stop scribbling in torn notebooks. Phone-linked
                  customer debt ledgers prevent disputes, enforce credit limits, and accelerate recovery.
                </p>
              </div>
              <div className="mt-5 border-t border-zinc-200/70 pt-3 font-mono text-[11px] text-zinc-500">
                Debt recovery rate: <span className="font-bold text-[#547311]">98.2%</span>
              </div>
            </div>

            {/* Reality 3 */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-[#fafbfc] p-6 transition duration-200 hover:border-zinc-300 hover:shadow-xs">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#0c1017] text-white">
                  <Package className="size-5 text-[#c0e763]" />
                </div>
                <div className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  REALITY #03
                </div>
                <h3 className="mt-1 text-lg font-bold text-zinc-950">Stockouts & Spoilage</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  Running out of milk, bread, or cooking oil means lost revenue. Automated low-stock radar
                  flags fast-depleting SKUs before shelves go empty, with supplier order tracking.
                </p>
              </div>
              <div className="mt-5 border-t border-zinc-200/70 pt-3 font-mono text-[11px] text-zinc-500">
                Stockout prevention: <span className="font-bold text-zinc-900">Zero surprises</span>
              </div>
            </div>

            {/* Reality 4 */}
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-[#fafbfc] p-6 transition duration-200 hover:border-zinc-300 hover:shadow-xs">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#0c1017] text-white">
                  <Coins className="size-5 text-[#c0e763]" />
                </div>
                <div className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  REALITY #04
                </div>
                <h3 className="mt-1 text-lg font-bold text-zinc-950">Closing Shift Audit</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  Never wonder where cash vanished at 9:00 PM. End-of-shift reports reconcile physical
                  cash in the drawer against Telebirr confirmation SMS, CBE deposits, and credit tabs.
                </p>
              </div>
              <div className="mt-5 border-t border-zinc-200/70 pt-3 font-mono text-[11px] text-zinc-500">
                Reconciliation time: <span className="font-bold text-zinc-900">3 minutes flat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Notebook vs. Andalus (The Honest Reality Check) */}
      <section id="features" className="border-b border-zinc-200/80 bg-[#f4f6f9] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Paper Notebooks vs. Andalus Retail OS
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Why modern supermarket and mini-market owners retire paper ledgers and fragmented calculators.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xs">
            <div className="grid grid-cols-1 divide-y divide-zinc-200/90 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Left Column: Old Way */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="size-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    The Paper Notebook & Cash Box Way
                  </span>
                </div>
                <ul className="mt-6 space-y-4 text-xs sm:text-sm text-zinc-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    <span>Customer debt recorded in torn notebooks leads to lost money and counter arguments.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    <span>No visibility on gross profit margins until end of the month, if at all.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    <span>Cashier theft or unchecked discounts go completely undetected without audit trails.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold shrink-0">✕</span>
                    <span>Price updates require re-labeling every single can and carton by hand.</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Andalus Way */}
              <div className="bg-[#fbfcfa] p-6 sm:p-8">
                <div className="flex items-center gap-2 text-[#547311]">
                  <BadgeCheck className="size-5 text-[#7ea521]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    The Andalus POS Standard
                  </span>
                </div>
                <ul className="mt-6 space-y-4 text-xs sm:text-sm text-zinc-900">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#7ea521] shrink-0 mt-0.5" />
                    <span><strong>Phone-verified debt tracking</strong> with balance ceilings and print acknowledgements.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#7ea521] shrink-0 mt-0.5" />
                    <span><strong>Real-time gross margin calculation</strong> on every sale and cashier shift.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#7ea521] shrink-0 mt-0.5" />
                    <span><strong>Role-locked permissions</strong>: Price overrides and voids require owner/manager approval.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-[#7ea521] shrink-0 mt-0.5" />
                    <span><strong>Change price once</strong> on the dashboard, instantly reflected at every register.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customer Debt Ledger Module Deep-Dive */}
      <section id="debt-ledger" className="border-b border-zinc-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <Coins className="size-3.5 text-[#7ea521]" />
                <span>Specialized Retail Accounting</span>
              </div>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
                The Customer Debt Ledger Built Right Into the Register
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                In residential neighborhoods across Addis, regular customers buy groceries on credit and settle
                on payday. Andalus eliminates awkward disputes and forgotten debts forever.
              </p>

              <div className="mt-6 space-y-3.5 text-xs sm:text-sm text-zinc-700">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-[#c0e763]/25 text-[#547311]">
                    <Check className="size-3.5" />
                  </div>
                  <div>
                    <strong>Customer Profile & Limit Ceilings:</strong> Assign each regular customer a credit
                    ceiling (e.g. ETB 4,000). The POS automatically alerts cashiers if the debt exceeds the limit.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-[#c0e763]/25 text-[#547311]">
                    <Check className="size-3.5" />
                  </div>
                  <div>
                    <strong>Printed Debt Slips:</strong> Thermal receipt prints current purchase, previous balance,
                    and new total debt with signature line for the customer.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 items-center justify-center rounded-full bg-[#c0e763]/25 text-[#547311]">
                    <Check className="size-3.5" />
                  </div>
                  <div>
                    <strong>Partial or Full Settlements:</strong> When the customer pays 1,500 ETB, deduct it in one
                    tap and print an updated statement immediately.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Simulated Debt Slip */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c1017] p-5 shadow-lg text-zinc-200">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-[#c0e763]" />
                    <span className="font-mono text-xs font-bold text-white">CUSTOMER DEBT CARD</span>
                  </div>
                  <span className="rounded bg-[#c0e763]/15 px-2 py-0.5 text-[10px] font-bold text-[#c0e763]">
                    CREDIT ACCOUNT
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-zinc-900 p-2.5">
                    <span className="text-[10px] text-zinc-400">Customer Name</span>
                    <div className="mt-0.5 font-bold text-white">Dawit Kebede</div>
                    <div className="font-mono text-[10px] text-zinc-500">+251 91 123 4567</div>
                  </div>
                  <div className="rounded-lg bg-zinc-900 p-2.5">
                    <span className="text-[10px] text-zinc-400">Credit Limit</span>
                    <div className="mt-0.5 font-bold font-mono text-white">ETB 5,000.00</div>
                    <div className="text-[10px] text-[#c0e763]">68% utilized</div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Previous Outstanding</span>
                    <span>ETB 2,850.00</span>
                  </div>
                  <div className="mt-1 flex justify-between text-zinc-400">
                    <span>Today&apos;s Purchase (Inv #4092)</span>
                    <span>+ ETB 550.00</span>
                  </div>
                  <div className="my-2 border-t border-zinc-800" />
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Current Balance</span>
                    <span className="text-[#c0e763]">ETB 3,400.00</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-[#c0e763] py-2 text-center text-xs font-bold text-zinc-950 hover:bg-[#b0d952]"
                  >
                    Receive Payment
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white"
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
      <section id="hardware" className="border-b border-zinc-200/80 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Works With Hardware You Already Own
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              No expensive proprietary terminal leases. Plug in your barcode gun, thermal printer, or use your tablet.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                <Barcode className="size-6" />
              </div>
              <div className="mt-3 text-sm font-bold text-zinc-900">Barcode Scanners</div>
              <div className="mt-1 text-xs text-zinc-500">USB & Bluetooth handheld & omni-directional guns</div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                <Printer className="size-6" />
              </div>
              <div className="mt-3 text-sm font-bold text-zinc-900">Thermal Printers</div>
              <div className="mt-1 text-xs text-zinc-500">58mm & 80mm ESC/POS USB, LAN & Bluetooth printers</div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                <MonitorCheck className="size-6" />
              </div>
              <div className="mt-3 text-sm font-bold text-zinc-900">Any Screen</div>
              <div className="mt-1 text-xs text-zinc-500">Laptops, Touchscreen All-In-One PCs, Android Tablets</div>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                <WifiOff className="size-6" />
              </div>
              <div className="mt-3 text-sm font-bold text-zinc-900">Offline Resilience</div>
              <div className="mt-1 text-xs text-zinc-500">Continues ringing transactions even if fiber or 4G disconnects</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Merchant Dispatches (Real Social Proof) */}
      <section className="border-b border-zinc-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Merchant Dispatches From Addis Ababa
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Verified stories from store owners who replaced manual logs with Andalus.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-[#fafbfc] p-6">
              <div>
                <div className="font-mono text-xs font-bold text-[#547311]">BOLE MEDHANEALEM</div>
                <div className="mt-1 text-sm font-bold text-zinc-900">Bole Neighborhood Mart</div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                  &ldquo;Before Andalus, our cashier shift change took 45 minutes of manual counting and we constantly
                  argued over customer tabs. Now the closing drawer takes 3 minutes and our debt recovery rate is over 98%.&rdquo;
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-200/70 pt-3 text-xs font-medium text-zinc-500">
                Yonas T. • Store Owner
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-[#fafbfc] p-6">
              <div>
                <div className="font-mono text-xs font-bold text-[#547311]">KAZANCHIS</div>
                <div className="mt-1 text-sm font-bold text-zinc-900">Kazanchis Daily Grocery</div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                  &ldquo;During the 5:00 PM rush, customers used to walk out because checkout was too slow. The barcode
                  scanner speed and instant Telebirr/CBE payment buttons cut our counter queues in half.&rdquo;
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-200/70 pt-3 text-xs font-medium text-zinc-500">
                Selamawit A. • Manager
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-[#fafbfc] p-6">
              <div>
                <div className="font-mono text-xs font-bold text-[#547311]">SARBET</div>
                <div className="mt-1 text-sm font-bold text-zinc-900">Red Sea Minimarket & Dairy</div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                  &ldquo;The low stock alert saved us from constant dairy and beverage shortages. I can check real-time sales
                  margins from my phone while I&apos;m at the Merkato wholesale depot.&rdquo;
                </p>
              </div>
              <div className="mt-6 border-t border-zinc-200/70 pt-3 text-xs font-medium text-zinc-500">
                Abel K. • Managing Partner
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="border-b border-zinc-200/80 bg-[#fafbfc] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Clear, honest answers for store managers and owners.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-200/90 bg-white transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-zinc-900 sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-zinc-600 border-t border-zinc-100 pt-3">
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
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#0c1017] p-8 text-white sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-[#c0e763]/15 blur-3xl" />

            <div className="relative max-w-2xl">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#c0e763]">
                Zero Hardware Lock-In
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Ring up your first customer in under 10 minutes.
              </h2>
              <p className="mt-4 text-sm text-zinc-400 sm:text-base">
                Create your store, add your top products or import a barcode list, and start processing
                sales today. No upfront equipment purchases needed.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c0e763] px-7 text-sm font-bold text-zinc-950 transition hover:bg-[#b0d952]"
                >
                  <span>Open Your Store Account</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  <span>Sign In to Terminal</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-zinc-200/90 bg-[#fafbfc] pt-12 pb-8 text-xs text-zinc-600">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <AndalusLogo variant="compact" />
              <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
                Andalus Retail OS is the tactile counter point-of-sale and store inventory management
                platform purpose-built for Ethiopian mini-markets, groceries, and retail stores.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                <span className="flex size-2 rounded-full bg-[#7ea521]" />
                <span>All systems operational • v2.4</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950">
                  <InstagramIcon />
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950">
                  <FacebookIcon />
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950">
                  <LinkedInIcon />
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Product</h4>
              <ul className="mt-3 space-y-2 text-zinc-600">
                <li><a href="#features" className="hover:text-zinc-950">POS Register</a></li>
                <li><a href="#debt-ledger" className="hover:text-zinc-950">Customer Debt Ledger</a></li>
                <li><a href="#realities" className="hover:text-zinc-950">Inventory Radar</a></li>
                <li><a href="#hardware" className="hover:text-zinc-950">Hardware Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Access</h4>
              <ul className="mt-3 space-y-2 text-zinc-600">
                <li><Link href="/login" className="hover:text-zinc-950">Store Sign In</Link></li>
                <li><Link href="/register" className="hover:text-zinc-950">Create Store</Link></li>
                <li><Link href="/forgot-password" className="hover:text-zinc-950">Recover Password</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Addis Ababa Contact</h4>
              <ul className="mt-3 space-y-2 text-zinc-600">
                <li>Addis Ababa, Ethiopia</li>
                <li>support@andaluspos.com</li>
                <li>+251 91 100 0000</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-zinc-200 pt-6 sm:flex-row text-zinc-500">
            <div>© 2026 Andalus POS. All rights reserved.</div>
            <div className="mt-2 sm:mt-0">Designed for retail speed and accuracy.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}

