import Link from "next/link";

export default function RootPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Link href="/landing-page" className="text-lg font-medium underline">
        Go to landing page
      </Link>
    </main>
  );
}
