"use client";

/**
 * HorizontalFeatureReveal — from design/components/COMPONENT_PROMPTS.md
 * (component 3). GSAP ScrollTrigger + SplitText, horizontal pinned scroll.
 *
 * Adapted from the supplied source:
 *  - The four demo property cards (base64 images, real-estate copy) are gone.
 *    Cards are passed in; here they carry the product storage rules.
 *  - GSAP plugins register inside the effect rather than at module scope, so
 *    the static export does not touch `document` while rendering on the server.
 *  - Reduced motion and widths under 1025 px fall back to a plain vertical list
 *    with everything visible, which is also what CLAUDE.md asks for on phones.
 *  - Keeps the author's horizontal scrub, number/title/paragraph SplitText
 *    reveals, and the image parallax.
 */

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

interface TriggerRange {
  start?: string;
  end?: string;
}

export interface FeatureCard {
  number: string;
  title: string;
  image: string;
  imageAlt: string;
  paragraphs: string[];
  footer?: ReactNode;
  triggers?: { no?: TriggerRange; title?: TriggerRange; content?: TriggerRange; img?: TriggerRange };
}

interface Props {
  cards: FeatureCard[];
  imageParallaxRange?: number;
  cardGap?: number;
}

export default function HorizontalFeatureReveal({
  cards,
  imageParallaxRange = 24,
  cardGap = 10,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const sectionId = `feature-reveal-${uid}`;
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.innerWidth <= 1025) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let revert: (() => void) | undefined;
    let cancelled = false;

    // Loaded here, not at module scope: ScrollTrigger and SplitText both reach
    // for document on import, which breaks `next build`'s static render.
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/SplitText"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);

      // Measure only once the card images have loaded. Their height sets the
      // track width, so building the pin before they decode gives ScrollTrigger
      // a stale start and end and the section scrolls past without pinning.
      await Promise.race([
        Promise.all(
          [...el.querySelectorAll("img")].map((img) =>
            img.complete && img.naturalWidth > 0
              ? Promise.resolve()
              : new Promise<void>((r) => {
                  img.addEventListener("load", () => r(), { once: true });
                  img.addEventListener("error", () => r(), { once: true });
                }),
          ),
        ),
        // Never block setup indefinitely on a stalled image.
        new Promise<void>((r) => setTimeout(r, 3000)),
      ]);
      if (cancelled) return;

      const ctx = gsap.context(() => {
        const track = el.querySelector<HTMLElement>(".feature-track");
        const viewport = el.querySelector<HTMLElement>(".feature-viewport");
        if (!track || !viewport) return;

        // Scrub exactly the overflow width, so the last card lands flush.
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

        // Keep a direct handle on the horizontal tween: every card animation
        // below needs it as `containerAnimation`, and looking it up from the
        // global ScrollTrigger list picks up whichever trigger happens to be
        // registered first, which is not necessarily this one.
        const horizontal = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            id: sectionId,
            trigger: el,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        el.querySelectorAll<HTMLElement>(".feature-card").forEach((card, i) => {
          const cfg = cards[i]?.triggers ?? {};
          const at = (r: TriggerRange | undefined, ds: string, de: string) => ({
            start: r?.start ?? ds,
            end: r?.end ?? de,
          });
          // Sub-animations are driven by horizontal position inside the pinned
          // track, so each one reads the container tween rather than page scroll.
          const base = { trigger: card, containerAnimation: horizontal };

          // Everything below is content-first: `immediateRender: false` keeps
          // each element in its natural, visible state until its trigger
          // actually fires, and no animation reverses back into a hidden state.
          // An earlier version used plain `gsap.from` with `toggleActions:
          // ...reverse`, which left card text stuck at opacity 0 whenever a
          // trigger did not fire. Text that never appears is worse than text
          // that never animates.
          const reveal = (
            targets: object | object[] | string,
            from: Record<string, unknown>,
            trigger: { start: string; end: string },
            extra: Record<string, unknown> = {},
          ) =>
            gsap.fromTo(targets, from, {
              y: 0,
              yPercent: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              immediateRender: false,
              ...extra,
              scrollTrigger: { ...base, ...trigger, toggleActions: "play none none none" },
            });

          const noEl = card.querySelector(".feature-no");
          if (noEl) {
            reveal(noEl, { y: 24, opacity: 0 }, at(cfg.no, "left 85%", "left 55%"));
          }

          const titleEl = card.querySelector(".feature-title");
          if (titleEl) {
            // SplitText masked lines: the signature reveal the brief asks for.
            const lines = new SplitText(titleEl, { type: "lines", mask: "lines" });
            reveal(lines.lines, { yPercent: 100 }, at(cfg.title, "left 85%", "left 55%"), {
              stagger: 0.08,
              duration: 0.7,
            });
          }

          const contentEls = card.querySelectorAll(".feature-content");
          if (contentEls.length) {
            reveal(contentEls, { y: 20, opacity: 0 }, at(cfg.content, "left 85%", "left 50%"), {
              stagger: 0.08,
            });
          }

          const img = card.querySelector(".feature-img");
          if (img) {
            gsap.fromTo(
              img,
              { scale: 1.12 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: { ...base, ...at(cfg.img, "left right", "right left"), scrub: true },
              },
            );
          }
        });

        ScrollTrigger.refresh();
      }, el);

      revert = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [cards, sectionId, imageParallaxRange]);

  return (
    <section ref={rootRef} id={sectionId} className="relative z-10 w-full">
      <div className="feature-viewport w-full overflow-hidden">
        <div
          className="feature-track flex w-max gap-(--card-gap) px-4 max-[1025px]:w-full max-[1025px]:flex-col max-[1025px]:gap-12"
          style={{ "--card-gap": `${cardGap}vw` } as CSSProperties}
        >
          {cards.map((card, i) => (
            <article
              key={i}
              className="feature-card flex w-[72vw] shrink-0 gap-[4vw] max-[1025px]:w-full max-[1025px]:flex-col max-[1025px]:gap-6"
            >
              <div className="h-[62vh] w-[32vw] shrink-0 overflow-hidden bg-surface max-[1025px]:h-[56vw] max-[1025px]:w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.imageAlt}
                  className="feature-img photo h-full w-full object-cover"
                  // Not lazy: the pin distance is measured from these, and an
                  // off-screen lazy image never fires `load`.
                  loading="eager"
                />
              </div>

              <div className="flex max-w-[34rem] flex-col gap-5 pt-[2vh]">
                <p className="feature-no marker text-ink">{card.number}</p>
                <h3 className="feature-title display display-md">{card.title}</h3>
                <div className="space-y-3">
                  {card.paragraphs.map((p, pi) => (
                    <p key={pi} className="feature-content text-[0.9375rem] leading-relaxed text-deep">
                      {p}
                    </p>
                  ))}
                </div>
                {card.footer}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
