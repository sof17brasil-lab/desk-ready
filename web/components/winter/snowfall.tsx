"use client";

/**
 * A very light snowfall over the winter hero.
 *
 * One canvas, ~70 flakes, drawn only while the hero is on screen. It stops
 * entirely when scrolled past or when the tab is hidden, so it costs nothing
 * for the rest of the page, and it never runs under prefers-reduced-motion.
 * Decorative only: aria-hidden, and the hero reads identically without it.
 */

import * as React from "react";

export function Snowfall({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    let onScreen = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Flake = { x: number; y: number; r: number; vy: number; vx: number; a: number };
    let flakes: Flake[] = [];

    const seed = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, (width * height) / 18000));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.7 + Math.random() * 1.7,
        vy: 12 + Math.random() * 26,
        vx: -5 + Math.random() * 10,
        a: 0.18 + Math.random() * 0.4,
      }));
    };

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.x += f.vx * dt;
        if (f.y - f.r > height) {
          f.y = -f.r;
          f.x = Math.random() * width;
        }
        if (f.x < -10) f.x = width + 10;
        if (f.x > width + 10) f.x = -10;
        ctx.globalAlpha = f.a;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible || !onScreen) return;
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

    const onResize = () => {
      seed();
    };
    const onVisibility = () => {
      visible = !document.hidden;
      visible ? start() : stop();
    };
    // Stop as soon as the hero scrolls away.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
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
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
