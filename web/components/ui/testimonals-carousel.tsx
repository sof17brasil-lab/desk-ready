"use client";

/**
 * Embla carousel primitives, adapted from the supplied testimonals-carousel
 * component, plus the quote carousel the brief page uses.
 *
 * What was removed from the supplied source, and why:
 *  - every piece of demo content: the Cloudinary company logos, the seven
 *    invented testimonials, the fake names and job titles, and the
 *    "Testimonial Highlight" headings. This page quotes real published
 *    sources, so none of it could stay;
 *  - `next/image` with remote URLs, and the instruction to fill images from
 *    Unsplash. There are no images in this carousel at all;
 *  - the inline quote and arrow SVGs, replaced with lucide-react icons;
 *  - the `text-gray-900` / `from-background` colours, replaced with the
 *    project's own black, white and grey tokens;
 *  - `hidden md:block` around the arrows: the brief asks for arrows on phones
 *    as well as desktop.
 *
 * What was kept: the Embla context pattern, the ArrowLeft/ArrowRight key
 * handling, and the canScrollPrev/canScrollNext disabled states.
 *
 * Added for this project: a counter and dots, source attribution under each
 * quote, a polite live region, and a reduced-motion path that swaps slides
 * instantly instead of sliding.
 */

import { ArrowLeft, ArrowRight, Quote as QuoteIcon } from "lucide-react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];

export interface CarouselQuote {
  /** The quoted words, exactly as recorded in SOURCES.md. */
  text: string;
  /** Who said it, when the source names a person. */
  speaker?: string;
  /** Their title, when the source gives one. */
  speakerTitle?: string;
  /** The publication or report. */
  publication: string;
  date: string;
  link: string;
  sourceRow: number;
}

export function QuoteCarousel({ quotes }: { quotes: CarouselQuote[] }) {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  // duration 0 makes Embla jump rather than animate; dragFree stays off so a
  // swipe always lands on exactly one quote.
  const [carouselRef, api] = useEmblaCarousel({
    align: "start",
    loop: false,
    duration: reduced ? 0 : 22,
  });

  const [selected, setSelected] = React.useState(0);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const onSelect = React.useCallback((a: CarouselApi) => {
    if (!a) return;
    setSelected(a.selectedScrollSnap());
    setCanPrev(a.canScrollPrev());
    setCanNext(a.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Quotes from the sources"
      tabIndex={0}
      onKeyDownCapture={onKeyDown}
    >
      {/* Swipe comes from Embla; no autoplay is configured anywhere. */}
      <div ref={carouselRef} className="overflow-hidden">
        <div className="-ml-6 flex">
          {quotes.map((q) => (
            <figure
              key={q.sourceRow}
              role="group"
              aria-roledescription="slide"
              className="min-w-0 shrink-0 grow-0 basis-full pl-6"
            >
              <QuoteIcon aria-hidden="true" strokeWidth={1.25} className="h-7 w-7 text-mute" />
              <blockquote className="mt-4 max-w-[46ch] text-[clamp(1.25rem,2.6vw,1.875rem)] leading-[1.3]">
                &ldquo;{q.text}&rdquo;
              </blockquote>

              {/* Where the demo showed a logo, a name and a role: the source. */}
              <figcaption className="mt-7 border-t border-line pt-4">
                {q.speaker && (
                  <p className="text-sm font-semibold">
                    {q.speaker}
                    {q.speakerTitle && (
                      <span className="font-normal text-quiet">, {q.speakerTitle}</span>
                    )}
                  </p>
                )}
                <p className="source mt-1">
                  <a href={q.link} target="_blank" rel="noopener noreferrer">
                    {q.publication}
                  </a>
                  {q.date ? `, ${q.date}` : ""}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Controls: shown at every width, not desktop only. */}
      <div className="mt-8 flex items-center gap-5 border-t border-line pt-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Previous quote"
            className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Next quote"
            className="flex h-11 w-11 items-center justify-center rounded-[2px] border border-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <p className="figure text-sm text-quiet">
          {pad(selected + 1)} / {pad(quotes.length)}
        </p>

        <div className="ml-auto flex gap-1">
          {quotes.map((q, i) => (
            <button
              key={q.sourceRow}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Quote ${i + 1} of ${quotes.length}`}
              aria-current={i === selected ? "true" : undefined}
              // 44px hit area around a small dot.
              className="flex h-11 w-6 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2 w-2 rounded-full border border-ink transition-colors",
                  i === selected ? "bg-ink" : "bg-transparent",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        Quote {selected + 1} of {quotes.length}. {quotes[selected]?.publication}.
      </div>

      <p className="source mt-4">Swipe, use the arrows, or press the left and right arrow keys.</p>
    </div>
  );
}
