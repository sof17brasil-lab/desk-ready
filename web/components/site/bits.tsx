import type { ReactNode } from "react";

import type { SourceRow } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Section head with the reference's `01 / 06` counter. The numbering is kept
 * because these sections genuinely run in order: rules, then history, then
 * where heat comes off, then the exception, then the tool, then the playbook.
 */
export function SectionHead({
  index,
  total,
  title,
  lede,
  id,
  tone = "light",
}: {
  index: number;
  total: number;
  title: string;
  lede?: ReactNode;
  id?: string;
  tone?: "light" | "dark";
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <header id={id} className="scroll-mt-24">
      <div className="flex items-baseline justify-between gap-6 border-b border-current/15 pb-3">
        <p className={cn("marker", tone === "dark" && "text-white/60")}>
          {pad(index)} / {pad(total)}
        </p>
      </div>
      <h2 className="display display-lg mt-6">{title}</h2>
      {lede && <div className={cn("lede mt-4", tone === "dark" && "text-white/75")}>{lede}</div>}
    </header>
  );
}

/** A figure with its label and a source line. Never a number on its own. */
export function Stat({
  figure,
  label,
  source,
  size = "md",
  className,
}: {
  figure: ReactNode;
  label: ReactNode;
  source?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-[clamp(1.75rem,3vw,2.25rem)]",
    md: "text-[clamp(2.5rem,5vw,3.5rem)]",
    lg: "text-[clamp(3.5rem,9vw,6rem)]",
  };
  return (
    <div className={className}>
      <p className={cn("figure leading-[0.95]", sizes[size])}>{figure}</p>
      <p className="mt-2 max-w-[34ch] text-sm leading-snug text-deep">{label}</p>
      {source && <div className="source mt-2 max-w-[48ch]">{source}</div>}
    </div>
  );
}

/** Renders a SOURCES.md row as an attributed source line. */
export function Source({ rows, extra }: { rows: SourceRow[]; extra?: ReactNode }) {
  // A fact can cite the same row twice (a figure and its context quote), so
  // de-duplicate before rendering rather than emitting a repeated React key.
  const unique = rows.filter((r, i, a) => a.findIndex((x) => x.row === r.row) === i);
  return (
    <p className="source">
      {unique.map((r, i) => (
        <span key={r.row}>
          {i > 0 && " · "}
          <a href={r.link} target="_blank" rel="noopener noreferrer">
            {r.source.replace(/^Same (report|page|sheet).*/i, "Same source")}
          </a>
          {r.date ? `, ${r.date}` : ""}
        </span>
      ))}
      {extra && <> · {extra}</>}
    </p>
  );
}

/** Sample size line. Shown wherever a number rests on a subset. */
export function Sample({ children }: { children: ReactNode }) {
  return <p className="source">{children}</p>;
}

/** Exact words from a source, quoted verbatim and attributed. */
export function Quote({ row, className }: { row: SourceRow; className?: string }) {
  return (
    <figure className={className}>
      <blockquote className="border-l-2 border-current/25 pl-4 text-[0.9375rem] leading-relaxed">
        &ldquo;{row.exact_words}&rdquo;
      </blockquote>
      <figcaption className="source mt-2 pl-4">
        <a href={row.link} target="_blank" rel="noopener noreferrer">
          {row.source}
        </a>
        {row.date ? `, ${row.date}` : ""}
      </figcaption>
    </figure>
  );
}

/** The marquee band of real figures, after the reference site. */
export function Marquee({ items }: { items: string[] }) {
  const run = [...items, ...items];
  return (
    <div
      className="marquee overflow-hidden border-y border-line bg-surface py-3"
      role="region"
      aria-label="Key figures"
    >
      <div className="marquee-track">
        {run.map((t, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="flex shrink-0 items-center whitespace-nowrap px-6 text-sm text-deep"
          >
            {t}
            <span className="ml-6 text-mute" aria-hidden="true">
              /
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Section({
  children,
  className,
  tone = "light",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark" | "surface";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 px-4 py-20 sm:px-6 lg:px-10 lg:py-28",
        tone === "dark" && "on-dark bg-ink text-paper",
        tone === "surface" && "bg-surface",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[82rem]">{children}</div>
    </section>
  );
}
