"use client";

/**
 * Then vs now, risk days per winter, one row per city. The only then-vs-now
 * chart on the site (DESIGN_BRIEF 02). Sorted by "now".
 *
 * 14 cities, not 15: Denver International's record starts in Nov 1994, so only
 * 6 of its 10 "then" winters reach the coverage rule and it has no baseline to
 * compare against. The page says so in words; the data simply has no row for it.
 */

import * as React from "react";

export interface DumbbellRow {
  stationId: string;
  city: string;
  then: number;
  now: number;
  thenSeasons: number;
  nowSeasons: number;
}

export function Dumbbell({
  rows,
  products,
  selected,
  onSelect,
}: {
  rows: DumbbellRow[];
  products: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => b.now - a.now);
  const max = Math.max(...rows.flatMap((r) => [r.then, r.now]), 1);

  const rowH = 34;
  const padL = 150;
  const padR = 56;
  const padT = 34;
  const W = 820;
  const plot = W - padL - padR;
  const H = padT + sorted.length * rowH + 28;
  const x = (v: number) => padL + (v / max) * plot;

  const ticks = [0, 30, 60, 90, 120, 150].filter((t) => t <= max * 1.02);

  return (
    <div>
      <fieldset className="mb-6">
        <legend className="marker mb-2">Product storage rule</legend>
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={selected === p.id}
              className={`btn ${selected === p.id ? "btn-solid" : ""}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`Risk days per winter by city, ${sorted.length} cities. Then is 1991 to 2000, now is 2016 to 2025. Every city has fewer risk days now. Values are given in the table below.`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} y1={padT - 12} x2={x(t)} y2={H - 26} stroke="#E2E2E2" />
              <text x={x(t)} y={H - 10} fontSize="11" fill="#6B6B6B" textAnchor="middle">
                {t}
              </text>
            </g>
          ))}
          <text x={padL} y={14} fontSize="11" fill="#6B6B6B">
            risk days per winter
          </text>

          {sorted.map((r, i) => {
            const y = padT + i * rowH + rowH / 2;
            return (
              <g key={r.stationId}>
                <text x={padL - 12} y={y + 4} fontSize="12.5" fill="#000000" textAnchor="end">
                  {r.city}
                </text>
                <line x1={x(r.now)} y1={y} x2={x(r.then)} y2={y} stroke="#AFAFAF" strokeWidth="2" />
                {/* "Then" is the quiet open marker; "now" is the solid black one. */}
                <circle cx={x(r.then)} cy={y} r="5.5" fill="#FFFFFF" stroke="#6B6B6B" strokeWidth="1.5" />
                <circle cx={x(r.now)} cy={y} r="5.5" fill="#000000" />
                <text x={W - padR + 10} y={y + 4} fontSize="11.5" fill="#6B6B6B">
                  −{(r.then - r.now).toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-deep">
        <span className="inline-flex items-center gap-2">
          <svg width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" fill="#FFFFFF" stroke="#6B6B6B" strokeWidth="1.5" />
          </svg>
          then, 1991 to 2000 winters
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="14" height="14" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" fill="#000000" />
          </svg>
          now, 2016 to 2025 winters
        </span>
        <span className="text-quiet">right column: change in days per winter</span>
      </div>

      {/* Table alternative: the chart is never the only way to read the data. */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium">Show as a table</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-sm">
            <caption className="sr-only">
              Risk days per winter by city, then and now, with the change
            </caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="py-2 pr-4 font-medium">City</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Then</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Now</th>
                <th scope="col" className="py-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.stationId} className="border-b border-line/70">
                  <th scope="row" className="py-1.5 pr-4 text-left font-normal">{r.city}</th>
                  <td className="py-1.5 pr-4 text-right">{r.then.toFixed(1)}</td>
                  <td className="py-1.5 pr-4 text-right">{r.now.toFixed(1)}</td>
                  <td className="py-1.5 text-right">−{(r.then - r.now).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
