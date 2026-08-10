import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(var(--secondary))_0%,hsl(var(--background))_50%)] p-6">
      <Card className="w-full max-w-2xl border-border/60 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl tracking-tight">MiniShop</CardTitle>
          <CardDescription className="text-base">
            Frontend foundation for a SaaS POS and shop-management system.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard/dashboard">Open dashboard shell</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/login">View auth shell</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
