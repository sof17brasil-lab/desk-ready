"use client";

/**
 * City x week heat map with a live threshold slider (DESIGN_BRIEF 03).
 *
 * The two counts below recompute in the browser from the same weekly_risk rows
 * the pipeline exported. At the default threshold they must equal H4, H5 and H6
 * in the ledger; the page asserts that in a visible line rather than trusting it.
 *
 * Monochrome: risk is encoded by value, darkest = highest. A cell that the rule
 * would heat also carries a visible ring, so the decision never rests on colour
 * alone.
 */

import * as React from "react";

export interface HeatCell {
  s: string; // station id
  w: number; // season week 1..22
  r: number; // risk share
  d: number; // days behind the cell
}

export interface HeatCity {
  stationId: string;
  city: string;
}

const WEEKS = 22;

/** Grey ramp, light to black. Value, not hue. */
function shade(r: number): string {
  if (r <= 0) return "#FFFFFF";
  const stops = ["#F6F6F6", "#E2E2E2", "#C9C9C9", "#AFAFAF", "#8A8A8A", "#6B6B6B", "#4A4A4A", "#2B2B2B", "#000000"];
  return stops[Math.min(stops.length - 1, Math.floor(r * stops.length))];
}

export function HeatMap({
  cells,
  cities,
  weekLabels,
  threshold,
  onThreshold,
  defaultThreshold,
  ledger,
  products,
  selected,
  onSelect,
}: {
  cells: HeatCell[];
  cities: HeatCity[];
  weekLabels: string[];
  threshold: number;
  onThreshold: (v: number) => void;
  defaultThreshold: number;
  ledger: { calendar: number; dataRule: number; notHeated: number };
  products: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = React.useState<HeatCell | null>(null);

  const byCity = React.useMemo(() => {
    const m = new Map<string, Map<number, HeatCell>>();
    for (const c of cells) {
      if (!m.has(c.s)) m.set(c.s, new Map());
      m.get(c.s)!.set(c.w, c);
    }
    return m;
  }, [cells]);

  // Order cities by how much of the winter the rule would heat: the shape of
  // the finding is "northern cities heat all 22 weeks, southern ones do not".
  const ordered = React.useMemo(() => {
    return [...cities].sort((a, b) => {
      const heat = (id: string) =>
        [...(byCity.get(id)?.values() ?? [])].filter((c) => c.r >= threshold).length;
      return heat(b.stationId) - heat(a.stationId);
    });
  }, [cities, byCity, threshold]);

  const calendarWeeks = cells.length;
  const heatedWeeks = cells.filter((c) => c.r >= threshold).length;
  const skipped = calendarWeeks - heatedWeeks;
  const skipShare = calendarWeeks ? skipped / calendarWeeks : 0;
  const atDefault = Math.abs(threshold - defaultThreshold) < 1e-9;

  const cell = 26;
  const gap = 3;
  const padL = 132;
  const padT = 26;
  const W = padL + WEEKS * (cell + gap);
  const H = padT + ordered.length * (cell + gap) + 10;

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <fieldset>
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

        <div className="lg:w-[22rem]">
          <label htmlFor="heat-threshold" className="block text-sm font-medium">
            Heat the week if at least{" "}
            <span className="figure">{Math.round(threshold * 100)}%</span> of its days break the
            rule
          </label>
          <input
            id="heat-threshold"
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={threshold}
            onChange={(e) => onThreshold(Number(e.target.value))}
            aria-describedby="heat-threshold-help"
          />
          <p id="heat-threshold-help" className="source">
            An assumption, not a finding. Default {Math.round(defaultThreshold * 100)}% from
            config/params.json. Move it and the map and counts below update.
          </p>
        </div>
      </div>

      <div className="mt-8 min-w-0 max-w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[760px]"
          role="img"
          aria-label={`Heat map of ${ordered.length} cities by 22 winter weeks. At a ${Math.round(threshold * 100)} percent threshold the rule would heat ${heatedWeeks} of ${calendarWeeks} city-weeks. Full values are in the table below.`}
        >
          {/* Week numbers across the top. */}
          {Array.from({ length: WEEKS }, (_, i) => (
            <text
              key={i}
              x={padL + i * (cell + gap) + cell / 2}
              y={padT - 10}
              fontSize="9.5"
              fill="#6B6B6B"
              textAnchor="middle"
            >
              {i + 1}
            </text>
          ))}

          {ordered.map((c, ri) => {
            const y = padT + ri * (cell + gap);
            return (
              <g key={c.stationId}>
                <text x={padL - 10} y={y + cell / 2 + 4} fontSize="11.5" fill="#000000" textAnchor="end">
                  {c.city}
                </text>
                {Array.from({ length: WEEKS }, (_, wi) => {
                  const w = wi + 1;
                  const d = byCity.get(c.stationId)?.get(w);
                  if (!d) return null;
                  const heated = d.r >= threshold;
                  return (
                    <rect
                      key={w}
                      x={padL + wi * (cell + gap)}
                      y={y}
                      width={cell}
                      height={cell}
                      fill={shade(d.r)}
                      stroke={heated ? "#000000" : "#E2E2E2"}
                      strokeWidth={heated ? 1.5 : 0.75}
                      tabIndex={0}
                      role="button"
                      aria-label={`${c.city} week ${w}: ${(d.r * 100).toFixed(0)}% of ${d.d} days. ${heated ? "Heat" : "Skip"}.`}
                      onMouseEnter={() => setHover(d)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(d)}
                      onBlur={() => setHover(null)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="source">
          Week 1 = Nov 1 to 7 · week 22 = Mar 28 to 31, a short week (42 station-days, not 70)
        </p>
        <div className="flex items-center gap-2">
          <span className="source">less</span>
          {["#F6F6F6", "#E2E2E2", "#C9C9C9", "#AFAFAF", "#8A8A8A", "#6B6B6B", "#4A4A4A", "#2B2B2B", "#000000"].map(
            (s) => (
              <span key={s} className="h-3 w-5 border border-line" style={{ background: s }} />
            ),
          )}
          <span className="source">more days break the rule</span>
        </div>
        <span className="source inline-flex items-center gap-2">
          <svg width="16" height="16" aria-hidden="true">
            <rect x="1" y="1" width="14" height="14" fill="#FFF" stroke="#000" strokeWidth="1.5" />
          </svg>
          outlined = the rule heats this week
        </span>
      </div>

      <p className="source mt-2 min-h-[1.5rem]" aria-live="polite">
        {hover
          ? `${cities.find((c) => c.stationId === hover.s)?.city}, week ${hover.w} (${weekLabels[hover.w - 1]}): ${(hover.r * 100).toFixed(0)}% of ${hover.d} days, 10 winters`
          : "Hover or focus a cell for its share, days and winters."}
      </p>

      {/* The two counts, live. */}
      <div className="mt-10 grid gap-8 border-t border-line pt-8 sm:grid-cols-3" aria-live="polite">
        <div>
          <p className="figure text-[clamp(2rem,4vw,3rem)] leading-none">{calendarWeeks}</p>
          <p className="mt-2 text-sm font-medium">Calendar rule: heat every winter week</p>
          <p className="source mt-1">15 cities × 22 weeks</p>
        </div>
        <div>
          <p className="figure text-[clamp(2rem,4vw,3rem)] leading-none">{heatedWeeks}</p>
          <p className="mt-2 text-sm font-medium">Data rule: heat these city-weeks</p>
          <p className="source mt-1">at a {Math.round(threshold * 100)}% threshold</p>
        </div>
        <div>
          <p className="figure text-[clamp(2rem,4vw,3rem)] leading-none">
            {(skipShare * 100).toFixed(1)}%
          </p>
          <p className="mt-2 text-sm font-medium">of calendar weeks the data rule would not heat</p>
          <p className="source mt-1">{skipped} city-weeks</p>
        </div>
      </div>

      <p className="source mt-4">
        {atDefault ? (
          <>
            At the default threshold these equal the ledger: H4 = {ledger.calendar}, H5 ={" "}
            {ledger.dataRule}, H6 = {(ledger.notHeated * 100).toFixed(1)}%.{" "}
            {calendarWeeks === ledger.calendar &&
            heatedWeeks === ledger.dataRule &&
            Math.abs(skipShare - ledger.notHeated) < 0.0005
              ? "Checked in the browser: they match."
              : "Mismatch against the ledger — do not trust this chart."}
          </>
        ) : (
          <>
            Threshold moved off the default. The ledger values are H4 = {ledger.calendar}, H5 ={" "}
            {ledger.dataRule}, H6 = {(ledger.notHeated * 100).toFixed(1)}% at{" "}
            {Math.round(defaultThreshold * 100)}%.
          </>
        )}
      </p>
    </div>
  );
}
