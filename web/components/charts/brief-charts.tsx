/**
 * The three home-page charts. Hand-written SVG, monochrome: the one thing to
 * look at is solid black, everything else grey (DESIGN_BRIEF "Colors (FINAL)").
 * Each is server-rendered and carries a text alternative, so the information
 * never depends on the drawing or on colour.
 */

/**
 * Chart 1 — acceptance as 100 squares.
 *
 * A reader who knows nothing about freight should get this in two seconds:
 * 100 squares, 78 filled, and the band the industry used to sit in marked on
 * the same scale. A bar makes you convert a length into a count; squares are
 * already the count.
 */
export function AcceptanceSquares({
  now,
  bandLow,
  bandHigh,
}: {
  now: number;
  bandLow: number;
  bandHigh: number;
}) {
  const cell = 30;
  const gap = 6;
  const cols = 10;
  const W = cols * cell + (cols - 1) * gap;
  const rows = 10;
  const H = rows * cell + (rows - 1) * gap;

  // The band sits on the same 100-square scale: squares 91 to 94 are the
  // range the prior three years ran at, marked but not filled.
  const inBand = (i: number) => i >= bandLow && i < bandHigh;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-[360px]"
        role="img"
        aria-label={`Of every 100 loads, ${now} were accepted by the first carrier asked. In the prior three years the rate ran between ${bandLow} and ${bandHigh} of every 100.`}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const filled = i < now;
          return (
            <rect
              key={i}
              x={col * (cell + gap)}
              y={row * (cell + gap)}
              width={cell}
              height={cell}
              fill={filled ? "#000000" : "#FFFFFF"}
              stroke={filled ? "#000000" : inBand(i) ? "#000000" : "#E2E2E2"}
              strokeWidth={inBand(i) ? 2 : 1}
              strokeDasharray={inBand(i) ? "4 3" : undefined}
            />
          );
        })}
      </svg>

      <figcaption className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-2 text-sm">
          <span aria-hidden="true" className="h-3.5 w-3.5 bg-ink" />
          accepted first time ({now})
        </span>
        <span className="inline-flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 border-2 border-dashed border-ink bg-paper"
          />
          {bandLow} to {bandHigh}, prior three years
        </span>
      </figcaption>
    </figure>
  );
}

/** Chart 2 — the two January tender-rejection jumps. */
export function OtriJumps({
  series,
}: {
  series: { label: string; from: number; to: number }[];
}) {
  const max = Math.max(...series.flatMap((s) => [s.from, s.to])) * 1.25;

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {series.map((s) => {
        const W = 300;
        const H = 150;
        const base = H - 26;
        const bw = 72;
        const hOf = (v: number) => (v / max) * (base - 16);
        return (
          <figure key={s.label}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              role="img"
              aria-label={`${s.label}: tender rejections moved from ${s.from} percent to ${s.to} percent.`}
            >
              <line x1={0} y1={base} x2={W} y2={base} stroke="#E2E2E2" />
              <rect x={40} y={base - hOf(s.from)} width={bw} height={hOf(s.from)} fill="#AFAFAF" />
              <rect x={168} y={base - hOf(s.to)} width={bw} height={hOf(s.to)} fill="#000000" />
              <text x={40 + bw / 2} y={base - hOf(s.from) - 8} fontSize="15" fontWeight="650" fill="#6B6B6B" textAnchor="middle">
                {s.from}%
              </text>
              <text x={168 + bw / 2} y={base - hOf(s.to) - 8} fontSize="15" fontWeight="650" fill="#000000" textAnchor="middle">
                {s.to}%
              </text>
              <text x={40 + bw / 2} y={base + 17} fontSize="11" fill="#6B6B6B" textAnchor="middle">
                before
              </text>
              <text x={168 + bw / 2} y={base + 17} fontSize="11" fill="#6B6B6B" textAnchor="middle">
                after
              </text>
            </svg>
            <figcaption className="mt-1 text-sm font-medium">{s.label}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/** Chart 3 — 39.3% of stops, as a 100-square grid. */
export function DetentionGrid({ share }: { share: number }) {
  const filled = Math.round(share);
  const cell = 26;
  const gap = 5;
  const W = 10 * cell + 9 * gap;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${W}`}
        className="h-auto w-full max-w-[320px]"
        role="img"
        aria-label={`${share} percent of all stops had the driver detained: about ${filled} squares in 100 are filled.`}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          return (
            <rect
              key={i}
              x={col * (cell + gap)}
              y={row * (cell + gap)}
              width={cell}
              height={cell}
              fill={i < filled ? "#000000" : "#FFFFFF"}
              stroke={i < filled ? "#000000" : "#E2E2E2"}
            />
          );
        })}
      </svg>
    </figure>
  );
}
