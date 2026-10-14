/**
 * "No lane is exempt" (DESIGN_BRIEF 04, retitled after Phase 2).
 *
 * One strip per city: the coldest day of each of the last 10 winters, with the
 * product line and the 10 °F Saia gate drawn across. The finding is that every
 * strip crosses 20 °F, so there is no city here where severe cold is off the
 * table — which is why the original "rare but severe" flag returns zero.
 */

interface Strip {
  stationId: string;
  city: string;
  seasons: { season: number; coldest_f: number }[];
  daysBelow10: number;
  perWinter: number;
}

export function ColdestStrips({
  strips,
  productLine,
  productLabel,
  severeLine,
}: {
  strips: Strip[];
  productLine: number;
  productLabel: string;
  severeLine: number;
}) {
  const all = strips.flatMap((s) => s.seasons.map((x) => x.coldest_f));
  const lo = Math.floor(Math.min(...all, severeLine) / 10) * 10 - 2;
  const hi = Math.ceil(Math.max(...all, productLine) / 10) * 10 + 2;

  const W = 300;
  const H = 76;
  const padT = 10;
  const padB = 18;
  const x = (v: number) => ((v - lo) / (hi - lo)) * W;

  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
      {strips.map((s) => (
        <figure key={s.stationId}>
          <figcaption className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{s.city}</span>
            <span className="source">
              {s.daysBelow10 === 0
                ? "no day below 10 °F"
                : `${s.perWinter.toFixed(1)} days/winter below 10 °F`}
            </span>
          </figcaption>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mt-2 h-auto w-full"
            role="img"
            aria-label={`${s.city}: coldest day of each of the last 10 winters, from ${Math.min(...s.seasons.map((v) => v.coldest_f)).toFixed(1)} to ${Math.max(...s.seasons.map((v) => v.coldest_f)).toFixed(1)} degrees Fahrenheit. ${s.daysBelow10 === 0 ? "No day below 10 degrees." : `${s.daysBelow10} days below 10 degrees across the 10 winters.`}`}
          >
            {/* Axis */}
            <line x1={0} y1={H - padB} x2={W} y2={H - padB} stroke="#E2E2E2" />

            {/* The product's storage line and the 10 °F tariff gate. */}
            <line x1={x(productLine)} y1={padT - 4} x2={x(productLine)} y2={H - padB} stroke="#AFAFAF" strokeDasharray="3 3" />
            <line x1={x(severeLine)} y1={padT - 4} x2={x(severeLine)} y2={H - padB} stroke="#000000" strokeWidth="1" />

            {/* Each winter's coldest day. */}
            {s.seasons.map((v, i) => (
              <circle
                key={v.season}
                cx={x(v.coldest_f)}
                cy={padT + 6 + (i % 2) * 11}
                r="4"
                fill={v.coldest_f < severeLine ? "#000000" : "#FFFFFF"}
                stroke="#000000"
                strokeWidth="1.2"
              >
                <title>
                  Winter {v.season}–{String(v.season + 1).slice(2)}: coldest day{" "}
                  {v.coldest_f.toFixed(1)} °F
                </title>
              </circle>
            ))}

            <text x={x(severeLine)} y={H - 5} fontSize="9" fill="#000000" textAnchor="middle">
              10 °F
            </text>
            <text x={x(productLine)} y={H - 5} fontSize="9" fill="#6B6B6B" textAnchor="middle">
              {productLabel}
            </text>
          </svg>
        </figure>
      ))}
    </div>
  );
}
