import Link from "next/link";
import { ClipboardCheck, Clock3, Mail, MapPin, Phone, TrendingUp, UserRound } from "lucide-react";

import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FacebookIcon, InstagramIcon, LinkedInIcon, MailIcon } from "@/components/landing/social-icons";
import { AndalusLogo } from "@/components/shared/andalus-mark";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Our Service", href: "#services" },
  { label: "Contact us", href: "#contact" },
];

const services = [
  {
    title: "Inventory Control",
    description: "Smart stock management with low-stock alerts and real-time inventory updates.",
    icon: ClipboardCheck,
  },
  {
    title: "Real-time Analytics",
    description:
      "Live dashboard with sales metrics, top products, and customizable reports to track your business performance.",
    icon: TrendingUp,
  },
  {
    title: "Debt Management",
    description: "Track customer debts, payment schedules, and automated reminders for outstanding balances.",
    icon: Clock3,
  },
  {
    title: "Sales",
    description: "Easy point of sale system to record transactions and track history.",
    icon: UserRound,
  },
];

const footerLinks = {
  companies: ["About Us", "Journey", "Blog", "Contact", "Help"],
  resources: ["About Us", "Journey", "Blog", "Contact", "Help"],
  help: ["House Rules", "Our Terms", "Privacy & Policy"],
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/landing-page" aria-label="Andalus home">
            <AndalusLogo variant="compact" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#374151] transition-colors hover:text-[#111827]"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login">
              <Button className="h-10 rounded-lg bg-[#111827] px-6 text-sm font-semibold hover:bg-[#1f2937]">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section id="home" className="bg-[#eef2f7]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[56px]">
              Streamline{" "}
              <span className="inline-block rounded-md bg-[#111827] px-3 py-1 text-white">Your shop</span>{" "}
              Management
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#6b7280] lg:text-lg">
              Designed for Mini-Markets, easy for anyone to use, and ready to grow with your business.
            </p>
            <div className="mt-8">
              <Link href="/onboarding">
                <Button className="h-12 rounded-lg bg-[#111827] px-8 text-base font-semibold hover:bg-[#1f2937]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <section id="about" className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything Your Shop Needs</h2>
          <p className="mt-4 text-base leading-7 text-[#6b7280] lg:text-lg">
            From simple sales transactions to complex inventory management, Andalus provides all the tools to run
            your business efficiently.
          </p>
        </div>
      </section>

      <section id="services" className="bg-[#eef2f7] py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl">Our Service</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[#111827] text-white">
                  <service.icon className="size-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-[#111827]">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7280]">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-black/5 bg-white pt-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-10 lg:grid-cols-5 lg:gap-8 lg:px-10">
          <div className="space-y-5 lg:col-span-1">
            <AndalusLogo variant="full" className="w-[120px]" />
            <p className="max-w-xs text-sm leading-6 text-[#6b7280]">
              The complete shop management solution designed for small businesses. Simplify your operations, boost
              your profits, and grow with confidence.
            </p>
            <div className="flex items-center gap-3">
              {[InstagramIcon, FacebookIcon, MailIcon, LinkedInIcon].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  aria-label="Social link"
                  className="flex size-9 items-center justify-center rounded-full bg-[#111827] text-white transition-opacity hover:opacity-80"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Companies" links={footerLinks.companies} />
          <FooterColumn title="Resources" links={footerLinks.resources} />
          <FooterColumn title="Help" links={footerLinks.help} />

          <div>
            <h4 className="mb-4 text-sm font-bold text-[#111827]">Contact Us</h4>
            <ul className="space-y-3 text-sm text-[#6b7280]">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#111827]" />
                <span>(480) 555-0103</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#111827]" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#111827]" />
                <span>andalus@1234.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black/5 py-6">
          <p className="text-center text-sm text-[#9ca3af]">Copyright @Andalus 2025. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold text-[#111827]">{title}</h4>
      <ul className="space-y-2.5 text-sm text-[#6b7280]">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="transition-colors hover:text-[#111827]">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
