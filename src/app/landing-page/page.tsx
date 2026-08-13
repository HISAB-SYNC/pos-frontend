import Image from "next/image";
import Link from "next/link";
import { AndalusMark } from "@/components/shared/andalus-mark";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto flex items-center justify-between py-6 px-4">
        <Link href="/" aria-label="Andalus">
          <div className="flex items-center gap-3">
            <AndalusMark size={40} />
            <span className="font-semibold text-lg">Andalus</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="#" className="hover:underline">
            Home
          </Link>
          <Link href="#" className="hover:underline">
            About Us
          </Link>
          <Link href="#" className="hover:underline">
            Our Service
          </Link>
          <Link href="#" className="hover:underline">
            Contact us
          </Link>
          <ThemeToggle />
          <Link href="/login">
            <Button variant="default" size="sm">
              Login
            </Button>
          </Link>
        </nav>
      </header>

      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Streamline
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"> Your shop</span>
              <span className="block">Management</span>
            </h1>

            <p className="text-muted-foreground max-w-xl mb-8">
              Designed for Mini-Markets, easy for anyone to use, and ready to grow with your business.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/onboarding">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Learn more
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-white/60 to-primary/5 p-8">
              <div className="w-full h-64 bg-muted-foreground/10 rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Dashboard preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center mb-6">Everything Your Shop Needs</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
            From simple sales transactions to complex inventory management, Andalus provides all the tools to run your business
            efficiently.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Control</CardTitle>
                <CardDescription>Smart stock management with low-stock alerts and real-time inventory updates.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Analytics</CardTitle>
                <CardDescription>Live dashboard with sales metrics, top products, and customizable reports.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debt Management</CardTitle>
                <CardDescription>Track customer debts, payment schedules, and automated reminders.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales</CardTitle>
                <CardDescription>Easy point of sale system to record transactions and track history.</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t mt-16 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <AndalusMark size={56} />
            <p className="text-sm text-muted-foreground max-w-xs">
              The complete shop management solution designed for small businesses. Simplify your operations, boost your
              profits, and grow with confidence.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Companies</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>About Us</li>
              <li>Journey</li>
              <li>Blog</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Help</li>
              <li>Docs</li>
              <li>Support</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Contact Us</h4>
            <p className="text-sm text-muted-foreground">(480) 555-0103</p>
            <p className="text-sm text-muted-foreground">Andalus@1234.com</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
