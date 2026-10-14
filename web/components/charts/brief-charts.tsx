/**
 * The three home-page charts. Hand-written SVG, monochrome: the one thing to
 * look at is solid black, everything else grey (DESIGN_BRIEF "Colors (FINAL)").
 * Each is server-rendered and carries a text alternative, so the information
 * never depends on the drawing or on colour.
 */

/** Chart 1 — 78% against the 90 to 94% band of the prior three years. */
export function AcceptanceBar({
  now,
  bandLow,
  bandHigh,
}: {
  now: number;
  bandLow: number;
  bandHigh: number;
}) {
  const W = 760;
  const H = 96;
  const barH = 34;
  const y = 30;
  const x = (v: number) => (v / 100) * W;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`First-tender acceptance is ${now} percent, against a band of ${bandLow} to ${bandHigh} percent in the prior three years.`}
      >
        <rect x={0} y={y} width={W} height={barH} fill="#F6F6F6" />
        {/* The prior-three-years band, as a ghost marker. */}
        <rect
          x={x(bandLow)}
          y={y - 8}
          width={x(bandHigh) - x(bandLow)}
          height={barH + 16}
          fill="#E2E2E2"
        />
        <rect x={0} y={y} width={x(now)} height={barH} fill="#000000" />

        <text x={0} y={y - 12} className="figure" fontSize="13" fill="#6B6B6B">
          0%
        </text>
        {/* Anchored to the band's right edge: centring it overflows the viewBox,
            because the band sits at 90 to 94% of the width. */}
        <text x={x(bandHigh)} y={y - 14} fontSize="12" fill="#6B6B6B" textAnchor="end">
          {bandLow} to {bandHigh}% prior three years
        </text>
        <text x={x(now) - 10} y={y + barH / 2 + 6} fontSize="17" fontWeight="650" fill="#FFFFFF" textAnchor="end">
          {now}%
        </text>
        <line x1={x(bandLow)} y1={y - 8} x2={x(bandLow)} y2={y + barH + 8} stroke="#AFAFAF" strokeWidth="1" />
        <line x1={x(bandHigh)} y1={y - 8} x2={x(bandHigh)} y2={y + barH + 8} stroke="#AFAFAF" strokeWidth="1" />
      </svg>
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
