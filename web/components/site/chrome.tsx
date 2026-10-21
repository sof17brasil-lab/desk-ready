"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Why carriers say no" },
  { href: "/winter/", label: "Winter loads" },
  { href: "/method/", label: "Method & SQL" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const here = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[82rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        {/* Text mark only. No Uber or Uber Freight mark anywhere (CLAUDE.md). */}
        <Link href="/" className="flex items-baseline gap-2 leading-none">
          <span className="text-[0.9375rem] font-semibold tracking-tight">Desk Ready</span>
          <span className="hidden text-xs text-quiet sm:inline">Sofia Mota</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={here(l.href) ? "page" : undefined}
              className={cn(
                "rounded-[2px] px-3 py-2 text-sm transition-colors",
                here(l.href) ? "font-semibold text-ink" : "text-quiet hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <a
          href="mailto:sof17.brasil@gmail.com"
          className="btn ml-2 hidden md:inline-flex"
        >
          Contact Sofia
        </a>

        <button
          type="button"
          className="btn md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-t border-line bg-paper px-4 pb-4 md:hidden"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={here(l.href) ? "page" : undefined}
              className={cn(
                "block border-b border-line py-3 text-base last:border-0",
                here(l.href) ? "font-semibold text-ink" : "text-deep",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="on-dark bg-ink px-4 pt-16 pb-10 text-paper sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[82rem]">
        <div className="grid gap-10 border-b border-white/15 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="display display-md">Desk Ready</p>
            <p className="mt-3 max-w-[38ch] text-sm text-white/70">
              A desk brief and a winter planning tool, built on public records.
            </p>
          </div>

          <nav aria-label="Pages">
            <p className="marker text-white/50">Pages</p>
            <ul className="mt-3 space-y-2 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 underline-offset-4 hover:text-paper hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Contact">
            <p className="marker text-white/50">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:sof17.brasil@gmail.com"
                  className="text-white/80 underline-offset-4 hover:text-paper hover:underline"
                >
                  Email Sofia
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/"
                  className="text-white/80 underline-offset-4 hover:text-paper hover:underline"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a href="#top" className="text-white/80 underline-offset-4 hover:text-paper hover:underline">
                  Back to top
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Disclaimer, word for word from CLAUDE.md. On every page. */}
        <p className="mt-8 max-w-[76ch] text-xs leading-relaxed text-white/60">
          Independent portfolio project by Sofia Mota. Not affiliated with, endorsed by, or using
          data from Uber Freight or Master Builders Solutions. Data: NOAA; published reports cited
          on each page.
        </p>
        <p className="mt-3 text-xs text-white/45">
          Photos: Unsplash.
        </p>
      </div>
    </footer>
  );
}
