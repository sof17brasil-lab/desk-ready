"use client";

/**
 * Lenis smooth scroll + sticky stacking panels — from
 * design/components/COMPONENT_PROMPTS.md (component 2).
 *
 * Adapted from the supplied source: the demo hard-coded three slate panels with
 * placeholder copy and emoji. It is now a provider plus a generic panel, so the
 * four problem panels come from design/BRIEF_CONTENT.md. Lenis is disabled under
 * prefers-reduced-motion, and the grid background is kept.
 */

import { ReactLenis, type LenisRef } from "lenis/react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps the page in Lenis smooth scroll, except under reduced motion.
 *
 * Lenis is driven off the GSAP ticker and pushes every scroll into
 * ScrollTrigger.update. Without this, Lenis and ScrollTrigger keep separate
 * ideas of the scroll position and the pinned horizontal section on /winter
 * never pins. Lenis also runs its own rAF loop by default, so autoRaf is off
 * here to avoid stepping it twice per frame.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = React.useState(true);
  const lenisRef = React.useRef<LenisRef>(null);

  React.useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (reduced) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = lenisRef.current?.lenis;
      if (!lenis) return;

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.refresh();

      dispose = () => {
        lenis.off("scroll", onScroll);
        gsap.ticker.remove(tick);
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduced]);

  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.1, autoRaf: false }}>
      {children}
    </ReactLenis>
  );
}

const GRID =
  "absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]";

/**
 * One full-screen panel that the next panel slides over. Under reduced motion
 * the panels stop sticking and read as ordinary stacked sections.
 */
export function StickyPanel({
  tone = "dark",
  className,
  children,
}: {
  tone?: "dark" | "light";
  className?: string;
  children: React.ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        "sticky top-0 min-h-screen motion-reduce:static motion-reduce:min-h-0",
        dark ? "on-dark bg-ink text-paper" : "bg-surface text-ink",
        !dark && "rounded-t-2xl",
        className,
      )}
    >
      <div className={GRID} aria-hidden="true" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[82rem] items-center px-4 py-20 motion-reduce:min-h-0 motion-reduce:py-16 sm:px-6 lg:px-10">
        {children}
      </div>
    </section>
  );
}

export default SmoothScrollProvider;
