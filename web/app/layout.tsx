import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";

import { Footer, Nav } from "@/components/site/chrome";
import { SmoothScrollProvider } from "@/components/ui/smooth-scroll";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display face for the uppercase statement lines only. Condensed and
// industrial, so it reads as transport signage rather than as UI text, and is
// unmistakably distinct from Inter at a glance.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Desk Ready — Why carriers say no",
    template: "%s — Desk Ready",
  },
  description:
    "An independent desk brief on why carriers reject loads, and a winter load planning tool built on 10 winters of NOAA station records.",
  authors: [{ name: "Sofia Mota" }],
  openGraph: {
    title: "Desk Ready — Why carriers say no",
    description:
      "A desk brief on measured 2026 freight numbers, and a winter load planning tool on NOAA records.",
    type: "website",
  },
  // No Uber or Uber Freight mark in the favicon or share image (CLAUDE.md).
  // Next does not apply basePath to metadata icons, so it is added here; a bare
  // "/favicon.svg" 404s on GitHub Pages, where the site lives under /desk-ready.
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.svg` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" id="top" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[2px] focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to main content
        </a>
        <SmoothScrollProvider>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
