import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { ApiProvider } from "@/providers/api-provider";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Amharic (Ethiopic script) glyphs; Geist has none.
const notoEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Andalus",
    template: "%s | Andalus",
  },
  description: "Andalus shop management platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoEthiopic.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased [color-scheme:light]">
        <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ApiProvider>{children}</ApiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
