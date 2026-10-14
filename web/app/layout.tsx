import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Footer, Nav } from "@/components/site/chrome";
import { SmoothScrollProvider } from "@/components/ui/smooth-scroll";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" id="top" className={inter.variable}>
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
