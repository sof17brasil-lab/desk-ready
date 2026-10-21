"use client";

/**
 * The opening sequence: a scroll-driven blizzard.
 *
 * Three beats on one pinned screen, all tied to scroll position so scrolling
 * back up brings the storm back:
 *   1. plain white, the project title centred, Sofia's name small at the foot;
 *   2. the storm blows in from the left — the background darkens, wind-driven
 *      streaks and flakes sweep left to right, and a haze layer thickens until
 *      the title is gone;
 *   3. the storm passes off to the right, the background returns to white, and
 *      the statement line is revealed in the display face.
 *
 * Performance notes:
 *  - one canvas, devicePixelRatio capped at 2;
 *  - ~600 particles on desktop, 250 on phones;
 *  - the haze is one pre-rendered sprite drawn a few times, not shadowBlur,
 *    which is what makes a storm like this expensive;
 *  - the loop only runs while the section is on screen and the tab is visible;
 *  - scroll progress is read from a ref inside the frame loop, so scrolling
 *    never re-renders React.
 *
 * prefers-reduced-motion: no canvas at all. The title screen and the statement
 * screen render as ordinary stacked sections.
 */

import { motion, useScroll, useTransform } from "motion/react";
import * as React from "react";

interface BlizzardIntroProps {
  title: string;
  /** Small grey line under the title; the site's independence is stated here
   *  as well as in the footer, because the title names Uber Freight. */
  disclaimer: string;
  byline: string;
  statement: string;
}

/** Smooth 0..1 ramp between two edges. */
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function BlizzardIntro({ title, disclaimer, byline, statement }: BlizzardIntroProps) {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const progressRef = React.useRef(0);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  // "end end", not "end start": the sticky child stops sticking when the
  // section's bottom reaches the viewport bottom, so that is where progress
  // must reach 1. With "end start" the last third of the timeline — the storm
  // clearing and the statement arriving — played only after the section had
  // already scrolled out of view, and was never seen.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Feed the frame loop without re-rendering on every scroll tick.
  React.useEffect(() => {
    progressRef.current = scrollYProgress.get();
    return scrollYProgress.on("change", (v) => {
      progressRef.current = v;
    });
  }, [scrollYProgress]);

  // Text beats. The title dissolves into the storm; the statement arrives after it.
  const titleOpacity = useTransform(scrollYProgress, [0, 0.14, 0.34], [1, 1, 0]);
  const bylineOpacity = useTransform(scrollYProgress, [0, 0.1, 0.26], [1, 1, 0]);
  const statementOpacity = useTransform(scrollYProgress, [0.74, 0.88], [0, 1]);
  const statementY = useTransform(scrollYProgress, [0.74, 0.88], [26, 0]);

  React.useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let onScreen = true;
    let tabVisible = true;

    type P = {
      x: number;
      y: number;
      size: number;
      fall: number;
      push: number;
      swayAmp: number;
      swayFreq: number;
      swayPhase: number;
      sprite: number;
      alpha: number;
    };
    let parts: P[] = [];
    // Three soft flake sprites, sharp to blurred. Drawing a pre-rendered sprite
    // is far cheaper than a gradient or shadowBlur per flake, and it is what
    // stops the snow reading as hard geometry.
    let sprites: HTMLCanvasElement[] = [];
    let haze: HTMLCanvasElement | null = null;

    /** A round, soft-edged flake. `soft` 0 = crisp, 1 = very diffuse. */
    const makeFlake = (soft: number) => {
      const s = 64;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const g = c.getContext("2d");
      if (!g) return c;
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      const core = 0.42 - soft * 0.34;
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(core, `rgba(255,255,255,${0.95 - soft * 0.45})`);
      grad.addColorStop(0.72, `rgba(255,255,255,${0.3 - soft * 0.18})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    };

    /** One soft white blob, drawn repeatedly for the fog. */
    const makeHaze = () => {
      const s = 256;
      const c = document.createElement("canvas");
      c.width = c.height = s;
      const g = c.getContext("2d");
      if (!g) return null;
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, "rgba(255,255,255,0.55)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.22)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
      return c;
    };

    const seed = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = w < 768 ? 250 : 600;
      parts = Array.from({ length: count }, () => {
        // depth 0 = far (small, crisp, slow), 1 = near (large, diffuse, fast).
        // That is the way snow actually photographs: the flakes closest to the
        // lens are big soft blurs, the distant ones are small and sharp.
        const depth = Math.pow(Math.random(), 0.75);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: lerp(2.5, 26, depth),
          fall: lerp(18, 70, depth),
          push: lerp(70, 330, depth),
          // Each flake drifts on its own sine, so paths curve and cross
          // instead of running parallel.
          swayAmp: lerp(6, 34, Math.random()),
          swayFreq: lerp(0.35, 1.5, Math.random()),
          swayPhase: Math.random() * Math.PI * 2,
          sprite: depth < 0.35 ? 0 : depth < 0.72 ? 1 : 2,
          alpha: lerp(0.5, 0.95, 1 - depth * 0.55),
        };
      });
      if (sprites.length === 0) sprites = [makeFlake(0), makeFlake(0.5), makeFlake(1)];
      haze = haze ?? makeHaze();
    };

    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = progressRef.current;

      // Global storm strength: builds, holds, then clears.
      const arrive = smoothstep(0.1, 0.44, p);
      const depart = smoothstep(0.6, 0.9, p);
      const intensity = arrive * (1 - depart);

      // Background: white -> stormy grey -> white.
      const bgT = Math.min(1, intensity * 1.15);
      const r = Math.round(lerp(255, 0x4d, bgT));
      const g = Math.round(lerp(255, 0x55, bgT));
      const b = Math.round(lerp(255, 0x5c, bgT));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);

      if (intensity > 0.002) {
        // Haze, drifting right with the wind.
        if (haze) {
          const blobs = 5;
          ctx.globalAlpha = intensity * 0.5;
          for (let i = 0; i < blobs; i++) {
            const t = (now / 1000) * (0.05 + i * 0.012) + i * 0.37;
            const hx = ((t % 1.4) - 0.2) * w;
            const hy = (0.18 + 0.17 * i) * h;
            const size = h * (0.75 + 0.3 * (i % 3));
            ctx.drawImage(haze, hx - size / 2, hy - size / 2, size, size);
          }
          ctx.globalAlpha = 1;
        }

        // A gust field shared by every flake, so the storm surges and eases
        // as a whole rather than flowing at one constant rate.
        const ts = now / 1000;
        const gust = 1 + 0.38 * Math.sin(ts * 0.55) + 0.22 * Math.sin(ts * 1.63 + 1.1);

        for (const q of parts) {
          // Wind drives right; the sine makes each path curve on its own beat.
          const sway = Math.sin(ts * q.swayFreq + q.swayPhase);
          q.x += (q.push * gust * (0.4 + intensity * 0.85) + sway * q.swayAmp) * dt;
          q.y += (q.fall + sway * 6) * dt;

          if (q.x - q.size > w + 40) {
            q.x = -40 - Math.random() * 120;
            q.y = Math.random() * h;
          }
          if (q.y - q.size > h) q.y = -q.size;

          // Left-to-right sweep: each flake's own arrival and departure are
          // offset by its x, so the storm front crosses the screen.
          const nx = q.x / Math.max(w, 1);
          const a = smoothstep(0.1 + nx * 0.14, 0.44 + nx * 0.14, p);
          const d = smoothstep(0.6 + nx * 0.14, 0.9 + nx * 0.14, p);
          const alpha = a * (1 - d) * q.alpha;
          if (alpha <= 0.012) continue;

          ctx.globalAlpha = alpha;
          const s = q.size;
          ctx.drawImage(sprites[q.sprite], q.x - s / 2, q.y - s / 2, s, s);
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !onScreen || !tabVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    seed();
    start();

    const onResize = () => seed();
    const onVisibility = () => {
      tabVisible = !document.hidden;
      tabVisible ? start() : stop();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        onScreen ? start() : stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <>
        <section className="flex min-h-[70svh] flex-col items-center justify-center border-b border-line px-4 py-24">
          <h1 className="statement statement-hero max-w-[18ch] text-center">{title}</h1>
          <p className="mt-5 text-sm text-quiet">{disclaimer}</p>
          <p className="mt-10 text-sm text-quiet">{byline}</p>
        </section>
        <section className="flex min-h-[50svh] items-center justify-center border-b border-line px-4 py-24">
          <p className="statement statement-lg text-center">{statement}</p>
        </section>
      </>
    );
  }

  return (
    <div ref={sectionRef} className="relative h-[320vh] border-b border-line">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        />

        <div className="relative flex h-full flex-col items-center justify-center px-4">
          <motion.h1
            style={{ opacity: titleOpacity }}
            className="statement statement-hero max-w-[18ch] text-center"
          >
            {title}
          </motion.h1>

          <motion.p
            style={{ opacity: titleOpacity }}
            className="mt-5 text-center text-sm text-quiet"
          >
            {disclaimer}
          </motion.p>

          <motion.p
            style={{ opacity: statementOpacity, y: statementY }}
            className="statement statement-lg absolute inset-x-4 text-center"
          >
            {statement}
          </motion.p>

          <motion.p
            style={{ opacity: bylineOpacity }}
            className="absolute inset-x-0 bottom-10 text-center text-sm text-quiet"
          >
            {byline}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

export default BlizzardIntro;
