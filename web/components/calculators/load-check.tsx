"use client";

/**
 * "Check a load" (DESIGN_BRIEF 05).
 *
 * Reads the last 10 winters only. It is a screening view, not a forecast: it
 * reports how often a lane's recorded daily lows broke the product's storage
 * rule in that week, and nothing about any future day.
 *
 * When a lane's coldest recent day is below 10 °F it surfaces the Saia Item 810
 * condition, quoted from pff_tariffs.json. The point is a planning one: the
 * published LTL service has a floor, so a heated truckload or an equipment
 * backup is something to line up ahead of time rather than on the day.
 */

import * as React from "react";

export interface LaneWeek {
  s: string;
  w: number;
  r: number;
  d: number;
}

export interface LaneCity {
  stationId: string;
  city: string;
  coldestF: number;
  daysBelow10: number;
  perWinter: number;
}

export interface TariffInfo {
  carrier: string;
  tariff: string;
  item: string;
  effective_date: string;
  charge: string;
  charge_unit: string;
  minimum_charge: string;
  minimum_unit: string;
  conditionWords: string;
  chargeWords: string;
  source_url: string;
}

const usd = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/[,$]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function LoadCheck({
  cells,
  cities,
  weekLabels,
  products,
  threshold,
  tariffs,
  tariffGateF,
}: {
  cells: LaneWeek[];
  cities: LaneCity[];
  weekLabels: string[];
  products: { id: string; label: string; minSafeF: number; rule: string }[];
  threshold: number;
  tariffs: TariffInfo[];
  /** The gate in Saia's published Item 810: 10 °F. NOT params.severe_tmin_f
   *  (20 °F), which is the separate 'rare but severe' assumption. */
  tariffGateF: number;
}) {
  const [productId, setProductId] = React.useState(products[0]?.id ?? "");
  const [origin, setOrigin] = React.useState(cities[0]?.stationId ?? "");
  const [dest, setDest] = React.useState(cities[1]?.stationId ?? "");
  const [overnight, setOvernight] = React.useState("");
  const [week, setWeek] = React.useState(10);
  const [transit, setTransit] = React.useState(2);
  const [heatCharge, setHeatCharge] = React.useState("");
  const [reworkCost, setReworkCost] = React.useState("");

  const product = products.find((p) => p.id === productId) ?? products[0];

  const stops = React.useMemo(() => {
    const ids = [origin, dest];
    if (transit >= 2 && overnight) ids.splice(1, 0, overnight);
    return ids.filter(Boolean);
  }, [origin, dest, overnight, transit]);

  const legs = stops.map((id) => {
    const c = cells.find((x) => x.s === id && x.w === week);
    const city = cities.find((x) => x.stationId === id);
    return { id, city: city?.city ?? id, risk: c?.r ?? 0, days: c?.d ?? 0, info: city };
  });

  const worst = legs.reduce((a, b) => (b.risk > a.risk ? b : a), legs[0]);
  const verdict =
    worst && worst.risk >= threshold
      ? "Heat recommended"
      : worst && worst.risk >= threshold / 2
        ? "Watch"
        : "Not needed on this history";

  // Any stop whose coldest recorded day in the last 10 winters was below 10 °F.
  const belowGate = legs.filter((l) => (l.info?.coldestF ?? 99) < tariffGateF);
  const saia = tariffs.find((t) => t.carrier.toLowerCase().includes("saia"));

  const charge = num(heatCharge);
  const rework = num(reworkCost);
  const expectedNoHeat = rework !== null && worst ? worst.risk * rework : null;

  return (
    <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="lc-product" className="block text-sm font-medium">
            Product storage rule
          </label>
          <select
            id="lc-product"
            className="field mt-1.5"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="source mt-1">Risk day: {product?.rule.replace("tmin_f", "daily low °F")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lc-origin" className="block text-sm font-medium">Origin</label>
            <select id="lc-origin" className="field mt-1.5" value={origin} onChange={(e) => setOrigin(e.target.value)}>
              {cities.map((c) => (
                <option key={c.stationId} value={c.stationId}>{c.city}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lc-dest" className="block text-sm font-medium">Destination</label>
            <select id="lc-dest" className="field mt-1.5" value={dest} onChange={(e) => setDest(e.target.value)}>
              {cities.map((c) => (
                <option key={c.stationId} value={c.stationId}>{c.city}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="lc-transit" className="block text-sm font-medium">
            Transit days: <span className="figure">{transit}</span>
          </label>
          <input
            id="lc-transit"
            type="range"
            min={1}
            max={5}
            step={1}
            value={transit}
            onChange={(e) => setTransit(Number(e.target.value))}
          />
        </div>

        {transit >= 2 && (
          <div>
            <label htmlFor="lc-overnight" className="block text-sm font-medium">
              Overnight city (optional)
            </label>
            <select
              id="lc-overnight"
              className="field mt-1.5"
              value={overnight}
              onChange={(e) => setOvernight(e.target.value)}
            >
              <option value="">none</option>
              {cities.map((c) => (
                <option key={c.stationId} value={c.stationId}>{c.city}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="lc-week" className="block text-sm font-medium">
            Ship week: <span className="figure">{week}</span>{" "}
            <span className="font-normal text-quiet">({weekLabels[week - 1]})</span>
          </label>
          <input
            id="lc-week"
            type="range"
            min={1}
            max={22}
            step={1}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
          />
        </div>

        <fieldset className="border-t border-line pt-5">
          <legend className="marker">Cost block (optional)</legend>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="lc-charge" className="block text-sm font-medium">
                Heat charge per load
              </label>
              <input
                id="lc-charge"
                className="field mt-1.5"
                inputMode="decimal"
                placeholder="your number, in dollars"
                value={heatCharge}
                onChange={(e) => setHeatCharge(e.target.value)}
                aria-describedby="lc-charge-help"
              />
              <p id="lc-charge-help" className="source mt-1">
                Example inputs, replace with yours. Published LTL charges for reference:{" "}
                {tariffs.map((t, i) => (
                  <span key={t.carrier}>
                    {i > 0 && " · "}
                    <a href={t.source_url} target="_blank" rel="noopener noreferrer">
                      {t.carrier.replace(" Freight Line", "")}
                    </a>{" "}
                    ${t.charge} {t.charge_unit}, min ${t.minimum_charge} {t.minimum_unit}, eff.{" "}
                    {t.effective_date}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <label htmlFor="lc-rework" className="block text-sm font-medium">
                Redelivery or rework cost
              </label>
              <input
                id="lc-rework"
                className="field mt-1.5"
                inputMode="decimal"
                placeholder="your number, in dollars"
                value={reworkCost}
                onChange={(e) => setReworkCost(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      </form>

      <div aria-live="polite" className="space-y-8">
        <div className="border border-ink p-6 sm:p-8">
          <p className="marker">Result</p>
          <p className="display display-md mt-2">{verdict}</p>
          <p className="mt-3 max-w-[48ch] text-sm text-deep">
            Highest risk on this lane in week {week}: <strong>{worst?.city}</strong>, where{" "}
            <span className="figure">{((worst?.risk ?? 0) * 100).toFixed(0)}%</span> of{" "}
            {worst?.days} recorded days broke the {product?.minSafeF} °F rule.
          </p>
          <p className="source mt-3">
            Your threshold: {Math.round(threshold * 100)}% of days. NOAA GHCN-Daily · 10 winters
            (2016 to 2025) · {worst?.days} days behind this cell.
          </p>

          <table className="mt-6 w-full border-collapse text-sm">
            <caption className="sr-only">Risk share at each stop on the lane</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="py-2 pr-4 font-medium">Stop</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Days breaking rule</th>
                <th scope="col" className="py-2 text-right font-medium">Coldest in 10 winters</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((l, i) => (
                <tr key={`${l.id}-${i}`} className="border-b border-line/70">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">
                    {l.city}
                    {i === 0 ? " (origin)" : i === legs.length - 1 ? " (destination)" : " (overnight)"}
                  </th>
                  <td className="py-2 pr-4 text-right">{(l.risk * 100).toFixed(0)}% of {l.days}</td>
                  <td className="py-2 text-right">{l.info?.coldestF.toFixed(1)} °F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The 10 °F gate in the published tariff. */}
        {belowGate.length > 0 && saia && (
          <aside className="border-l-2 border-ink bg-surface p-6">
            <p className="marker">Below the published service floor</p>
            <p className="mt-3 text-sm leading-relaxed text-deep">
              On this lane, {belowGate.map((l) => l.city).join(" and ")}{" "}
              {belowGate.length === 1 ? "has" : "have"} recorded a daily low below{" "}
              {tariffGateF} °F in the last 10 winters
              {" ("}
              {belowGate.map((l) => `${l.city} ${l.info?.coldestF.toFixed(1)} °F`).join(", ")}
              {")"}. {saia.carrier}&rsquo;s Item {saia.item} provides Protect from Freezing Service
              only when:
            </p>
            <blockquote className="mt-3 border-l-2 border-mute pl-4 text-sm italic">
              &ldquo;Outside temperature is forecast to be 10 degrees Fahrenheit or higher&rdquo;
            </blockquote>
            <p className="mt-3 text-sm leading-relaxed text-deep">
              So on the coldest days in some lanes, published LTL protect-from-freeze may not be
              available. Plan a heated truckload or an equipment backup ahead of time.
            </p>
            <p className="source mt-3">
              The tariff condition is written on a <strong>forecast</strong>; the temperatures here
              are <strong>recorded daily lows</strong> from past winters. This says how often a lane
              has run that cold, not what any future day will do.{" "}
              <a href={saia.source_url} target="_blank" rel="noopener noreferrer">
                {saia.tariff}, Item {saia.item}
              </a>
              , eff. {saia.effective_date}.
            </p>
          </aside>
        )}

        {(charge !== null || expectedNoHeat !== null) && (
          <div className="border-t border-line pt-6">
            <p className="marker">Cost comparison, your inputs</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="figure text-[clamp(1.5rem,3vw,2rem)] leading-none">
                  {expectedNoHeat !== null ? usd(expectedNoHeat) : "—"}
                </p>
                <p className="mt-2 text-sm font-medium">Expected cost without heat</p>
                <p className="source mt-1">
                  {((worst?.risk ?? 0) * 100).toFixed(0)}% × your rework cost
                </p>
              </div>
              <div>
                <p className="figure text-[clamp(1.5rem,3vw,2rem)] leading-none">
                  {charge !== null ? usd(charge) : "—"}
                </p>
                <p className="mt-2 text-sm font-medium">Heat charge</p>
                <p className="source mt-1">your input</p>
              </div>
            </div>
            <p className="source mt-4">
              Example inputs, replace with yours. No Uber Freight figure is used or implied.
            </p>
          </div>
        )}

        <p className="source">
          <a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">
            Check the forecast before dispatch
          </a>{" "}
          — these are past winters, not a forecast.
        </p>
      </div>
    </div>
  );
}
