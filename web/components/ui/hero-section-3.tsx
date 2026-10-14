"use client";

/**
 * ScrollFlyIn — from design/components/COMPONENT_PROMPTS.md (component 1).
 *
 * Changes from the supplied source, all required:
 *  1. `const screenWidth = window.innerWidth` ran during render, which throws
 *     during the static export (there is no window on the server). It now lives
 *     in state behind an effect, with a resize listener.
 *  2. Imports `motion` rather than `framer-motion` (CLAUDE.md: one motion
 *     library, under its current name).
 *  3. Honours prefers-reduced-motion: the truck parks under the title instead of
 *     driving across it, and the section collapses to one screen.
 *  4. The onError fallback to a remote CDN placeholder is gone; the fallback is
 *     a local file from design/MEDIA_LIST.md.
 */

import * as React from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

interface ScrollFlyInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  imageUrl: string;
  imageAlt?: string;
  fallbackImageUrl?: string;
  /** Natural width of the source file; never upscaled past 2x (MEDIA_LIST). */
  imageWidth?: number;
}

export function ScrollFlyIn({
  children,
  imageUrl,
  imageAlt = "",
  fallbackImageUrl,
  imageWidth = 733,
  className,
  ...props
}: ScrollFlyInProps) {
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
    offset: ["start end", "end start"],
  });

  // Drive the truck from off the left edge to off the right edge.
  const x = useTransform(
    scrollYProgress,
    [0.1, 0.8],
    [`${-1.6 * screenWidth}px`, `${1.6 * screenWidth}px`],
  );
  const opacity = useTransform(scrollYProgress, [0.1, 0.22, 0.72, 0.84], [0, 1, 1, 0]);

  const src = imageUrl;

  return (
    <div
      ref={targetRef}
      className={cn("relative", reduced ? "h-auto" : "h-[200vh]", className)}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center",
          reduced ? "static min-h-0 py-24" : "sticky top-0 h-screen",
        )}
      >
        <div className="relative z-10 w-full">{children}</div>

        {reduced ? (
          // Parked: shown once, under the title, as a still image.
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
            <TruckImage
              src={src}
              alt={imageAlt}
              fallback={fallbackImageUrl}
              width={imageWidth}
            />
          </div>
        ) : (
          <motion.div
            style={{ x, opacity }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center"
            aria-hidden="true"
          >
            <TruckImage
              src={src}
              alt=""
              fallback={fallbackImageUrl}
              width={imageWidth}
              decorative
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function TruckImage({
  src,
  alt,
  fallback,
  width,
  decorative = false,
}: {
  src: string;
  alt: string;
  fallback?: string;
  width: number;
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
      // Capped well under 2x the 733 px source so it stays sharp (MEDIA_LIST.md),
      // and small enough that it reads as crossing the page rather than burying it.
      className="h-auto w-[min(860px,62vw)] max-w-none"
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
      }}
    />
  );
}

export default ScrollFlyIn;
