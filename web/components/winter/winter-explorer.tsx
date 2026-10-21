"use client";

/**
 * Client shell for winter sections 02, 03 and 05. The product selector is
 * shared, so picking a rule moves the dumbbell, the heat map and the load
 * check together. All data arrives as props from the server component; nothing
 * is fetched and no number is computed from anything but web/public/data.
 */

import * as React from "react";

import { LoadCheck, type LaneCity, type LaneWeek, type TariffInfo } from "@/components/calculators/load-check";
import { Dumbbell, type DumbbellRow } from "@/components/charts/dumbbell";
import { HeatMap, type HeatCell, type HeatCity } from "@/components/charts/heatmap";
import { SectionHead } from "@/components/site/bits";

export interface ProductOption {
  id: string;
  label: string;
  minSafeF: number;
  rule: string;
}

export function WinterExplorer({
  products,
  dumbbellByProduct,
  grid,
  cities,
  heatCities,
  weekLabels,
  defaultThreshold,
  ledger,
  tariffs,
  tariffGateF,
  headlineProductId,
  h2,
  h3,
  climateQuote,
  noLaneExemptSection,
  rulesSection,
}: {
  products: ProductOption[];
  dumbbellByProduct: Record<string, DumbbellRow[]>;
  /** Heat-map grid as flat arrays; expanded to cells once, on the client. */
  grid: {
    stations: string[];
    weeks: number;
    fullWeekDays: number;
    shortWeekDays: number;
    /** Risk per mille (0-1000) per cell; -1 where there is no cell. */
    byProduct: Record<string, number[]>;
  };
  cities: LaneCity[];
  heatCities: HeatCity[];
  weekLabels: string[];
  defaultThreshold: number;
  ledger: { calendar: number; dataRule: number; notHeated: number };
  tariffs: TariffInfo[];
  tariffGateF: number;
  headlineProductId: string;
  h2: { value: number; n: number };
  h3: { value: number; n: number };
  climateQuote: React.ReactNode;
  /** Sections rendered inside the explorer so the numbering reads in order. */
  noLaneExemptSection: React.ReactNode;
  rulesSection: React.ReactNode;
}) {
  const [productId, setProductId] = React.useState(headlineProductId);
  const [threshold, setThreshold] = React.useState(defaultThreshold);

  const product = products.find((p) => p.id === productId) ?? products[0];
  const rows = dumbbellByProduct[productId] ?? [];
  const cells = React.useMemo(() => {
    const g = grid.byProduct[productId];
    if (!g) return [] as HeatCell[];
    const out: HeatCell[] = [];
    for (let si = 0; si < grid.stations.length; si++) {
      for (let wi = 0; wi < grid.weeks; wi++) {
        const v = g[si * grid.weeks + wi];
        if (v < 0) continue;
        out.push({
          s: grid.stations[si],
          w: wi + 1,
          r: v / 1000,
          d: wi + 1 === grid.weeks ? grid.shortWeekDays : grid.fullWeekDays,
        });
      }
    }
    return out;
  }, [grid, productId]);
  const isHeadline = productId === headlineProductId;

  const median = React.useMemo(() => {
    if (!rows.length) return 0;
    const d = rows.map((r) => r.now - r.then).sort((a, b) => a - b);
    const mid = d.length / 2;
    return d.length % 2 ? d[Math.floor(mid)] : (d[mid - 1] + d[mid]) / 2;
  }, [rows]);

  const fewer = rows.filter((r) => r.now < r.then).length;

  return (
    <>
      {/* 01 · Check a load — the tool leads, the evidence follows. */}
      <section id="load-check" className="scroll-mt-20 bg-surface px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto w-full max-w-[82rem]">
          <SectionHead
            index={1}
            total={6}
            title="Check a load"
            lede="Pick a product, a lane and a ship week. The result reads the last 10 winters of recorded lows for those cities."
          />
          <div className="mt-12">
            <LoadCheck
              cells={cells}
              cities={cities}
              weekLabels={weekLabels}
              products={products}
              threshold={threshold}
              tariffs={tariffs}
              tariffGateF={tariffGateF}
            />
          </div>
        </div>
      </section>
      {/* 02 · The rule on the drum */}
      {rulesSection}

      {/* 03 · Warmer winters, same calendar */}
      <section id="then-now" className="scroll-mt-20 bg-surface px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto w-full max-w-[82rem]">
          <SectionHead
            index={3}
            total={6}
            title="Warmer winters, same calendar"
            lede="The only then-versus-now view on this site. Everything after it uses the last 10 winters."
          />

          <div className="mt-12 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
            {/* min-w-0 on the items, not just the container: a grid item
                defaults to min-width:auto and would otherwise be widened to the
                dumbbell SVG's 640px min-width, pushing the whole page sideways. */}
            <div className="min-w-0">
              <p className="figure text-[clamp(3rem,7vw,5rem)] leading-[0.9]">
                {/* For the headline product, show the ledger's own value. The
                    browser recomputation lands on -7.449999…, which renders as
                    7.4 next to a citation reading "ledger H2 = 7.5". */}
                {Math.abs(isHeadline ? h2.value : median).toFixed(1)}
              </p>
              <p className="mt-3 max-w-[26ch] text-sm font-medium">
                fewer days per winter that break the {product?.minSafeF} °F rule, median across
                cities
              </p>
              <p className="source mt-2">
                now (2016 to 2025 winters) minus then (1991 to 2000 winters) · {rows.length} cities
                {isHeadline && (
                  <>
                    {" "}
                    · ledger H2 = {Math.abs(h2.value).toFixed(1)}, n = {h2.n}
                  </>
                )}
              </p>

              <p className="mt-8 text-[0.9375rem] leading-relaxed text-deep">
                <strong>
                  {fewer} of {rows.length} cities
                </strong>{" "}
                have fewer risk days now.
                {isHeadline && h3.value === 1 && " That is every city with a baseline, not most of them."}
              </p>
              <p className="source mt-2">
                {isHeadline && <>ledger H3 = {(h3.value * 100).toFixed(0)}%, n = {h3.n} · </>}
                NOAA GHCN-Daily
              </p>

              <div className="mt-8 border-t border-line pt-5">{climateQuote}</div>
            </div>

            <div className="min-w-0">
              <Dumbbell
                rows={rows}
                products={products.map((p) => ({ id: p.id, label: p.label }))}
                selected={productId}
                onSelect={setProductId}
              />
              <p className="source mt-5 max-w-[62ch] border-t border-line pt-4">
                <strong>14 cities, not 15.</strong> Denver International&rsquo;s record starts in
                November 1994 because the airport opened in February 1995, so only 6 of its 10
                earlier winters meet the coverage rule and it has no baseline to compare against.
                Denver stays in every chart from here on, which uses the last 10 winters only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 04 · Where heat can come off */}
      <section id="heat-map" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto w-full max-w-[82rem]">
          <SectionHead
            index={4}
            total={6}
            title="Where heat can come off"
            lede={
              <>
                A calendar rule heats every winter week everywhere. The records say that is roughly
                right for the northern lanes — and wrong in the south and in the shoulder weeks.
              </>
            }
          />
          <div className="mt-12">
            <HeatMap
              cells={cells}
              cities={heatCities}
              weekLabels={weekLabels}
              threshold={threshold}
              onThreshold={setThreshold}
              defaultThreshold={defaultThreshold}
              ledger={ledger}
              products={products.map((p) => ({ id: p.id, label: p.label }))}
              selected={productId}
              onSelect={setProductId}
            />
          </div>
        </div>
      </section>

      {/* 05 · No lane is exempt */}
      {noLaneExemptSection}

    </>
  );
}
