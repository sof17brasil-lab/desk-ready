"use client";

/**
 * Opening sequence, built on ScrollFlyIn from
 * design/components/COMPONENT_PROMPTS.md (component 1).
 *
 * Three beats on one pinned screen:
 *   1. a plain white screen with the project title centred, Sofia's name small
 *      at the bottom;
 *   2. the truck drives left to right straight across the title;
 *   3. once it has passed, the statement line fades up in its place.
 *
 * Changes from the supplied source, all required:
 *  - `const screenWidth = window.innerWidth` ran during render, which throws
 *    during the static export. It now lives in state behind an effect.
 *  - Imports `motion`, not `framer-motion` (CLAUDE.md: one motion library).
 *  - The remote CDN onError fallback is replaced with a local file.
 *  - prefers-reduced-motion: no truck movement and no scroll-linked fades. The
 *    title, a parked truck and the statement line are all simply present.
 */

import * as React from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

interface OpeningSequenceProps {
  title: string;
  byline: string;
  statement: string;
  imageUrl: string;
  fallbackImageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
}

export function OpeningSequence({
  title,
  byline,
  statement,
  imageUrl,
  fallbackImageUrl,
  imageAlt = "",
  imageWidth = 733,
}: OpeningSequenceProps) {
  const targetRef = React.useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setScreenWidth(window.innerWidth);
      setReduced(motionQuery.matches);
    };
    sync();
    window.addEventListener("resize", sync);
    motionQuery.addEventListener("change", sync);
    return () => {
      window.removeEventListener("resize", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  // The truck crosses between 0.12 and 0.62 of the scroll, fully clearing the
  // title on both sides before anything else changes.
  const truckX = useTransform(
    scrollYProgress,
    [0.12, 0.62],
    [`${-1.25 * screenWidth - imageWidth}px`, `${1.25 * screenWidth + imageWidth}px`],
  );
  const truckOpacity = useTransform(scrollYProgress, [0.1, 0.18, 0.56, 0.64], [0, 1, 1, 0]);

  // Title holds until the truck is over it, then hands over to the statement.
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3, 0.46], [1, 1, 0]);
  const bylineOpacity = useTransform(scrollYProgress, [0, 0.22, 0.36], [1, 1, 0]);
  const statementOpacity = useTransform(scrollYProgress, [0.6, 0.74], [0, 1]);
  const statementY = useTransform(scrollYProgress, [0.6, 0.74], [28, 0]);

  if (reduced) {
    // Reduced motion: one static screen, everything readable, nothing moves.
    return (
      <section className="border-b border-line px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[82rem] text-center">
          <h1 className="statement statement-hero">{title}</h1>
          <TruckImage
            src={imageUrl}
            alt={imageAlt}
            fallback={fallbackImageUrl}
            width={imageWidth}
            className="mx-auto mt-10 h-auto w-[min(640px,80vw)]"
          />
          <p className="statement statement-lg mt-12">{statement}</p>
          <p className="source mt-10">{byline}</p>
        </div>
      </section>
    );
  }

  return (
    <div ref={targetRef} className="relative h-[280vh] border-b border-line">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-x-clip px-4">
        {/* Beat 1: the title. */}
        <motion.h1
          style={{ opacity: titleOpacity }}
          className="statement statement-hero relative z-10 max-w-[18ch] text-center"
        >
          {title}
        </motion.h1>

        {/* Beat 3: the statement, revealed after the truck has gone. */}
        <motion.p
          style={{ opacity: statementOpacity, y: statementY }}
          className="statement statement-lg absolute inset-x-4 z-10 text-center"
        >
          {statement}
        </motion.p>

        {/* Beat 2: the truck, crossing on top of the title. */}
        <motion.div
          style={{ x: truckX, opacity: truckOpacity }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center"
          aria-hidden="true"
        >
          <TruckImage
            src={imageUrl}
            alt=""
            fallback={fallbackImageUrl}
            width={imageWidth}
            decorative
            className="h-auto w-[min(860px,62vw)] max-w-none"
          />
        </motion.div>

        {/* Sofia's name, small, at the foot of the opening screen. */}
        <motion.p
          style={{ opacity: bylineOpacity }}
          className="absolute inset-x-0 bottom-10 z-10 text-center text-sm text-quiet"
        >
          {byline}
        </motion.p>
      </div>
    </div>
  );
}

function TruckImage({
  src,
  alt,
  fallback,
  width,
  className,
  decorative = false,
}: {
  src: string;
  alt: string;
  fallback?: string;
  width: number;
  className?: string;
  decorative?: boolean;
}) {
  const [current, setCurrent] = React.useState(src);
  React.useEffect(() => setCurrent(src), [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      width={width}
      height={Math.round(width * (229 / 733))}
      className={cn("max-w-none", className)}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
      }}
    />
  );
}

export default OpeningSequence;
