import type { Metadata } from "next";

import { IllustrativeSaving } from "@/components/calculators/illustrative-saving";
import { ColdestStrips } from "@/components/charts/coldest-strips";
import { Snowfall } from "@/components/winter/snowfall";
import { Quote, Section, SectionHead, Stat } from "@/components/site/bits";
import HorizontalFeatureReveal, { type FeatureCard } from "@/components/ui/horizontal-feature-reveal";
import { Playbook } from "@/components/winter/playbook";
import { WinterExplorer } from "@/components/winter/winter-explorer";
import {
  cityLabel,
  cityShort,
  fmtInt,
  h,
  params,
  products,
  quote,
  seasonColdest,
  severeCold,
  spp,
  stations,
  tariffs,
  weekLabel,
  weeklyRisk,
  SEASON_WEEKS,
} from "@/lib/data";
import { asset } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Winter Load Readiness",
  description:
    "Which winter loads need heat, by city and week, from the last 10 winters of NOAA station records.",
};

const productOptions = products
  .slice()
  .sort((a, b) => a.min_safe_f - b.min_safe_f)
  .map((p) => ({
    id: p.product_id,
    label: `${p.min_safe_f} °F · ${p.example_product}`,
    minSafeF: p.min_safe_f,
    rule: p.risk_rule,
  }));

// Then-vs-now rows: only stations with a real baseline in both windows.
const dumbbellByProduct = Object.fromEntries(
  products.map((p) => {
    const rows = spp
      .filter((r) => r.product_id === p.product_id && r.period === "now" && r.in_then_now)
      .map((now) => {
        const then = spp.find(
          (t) =>
            t.station_id === now.station_id && t.product_id === p.product_id && t.period === "then",
        );
        if (!then) return null;
        return {
          stationId: now.station_id,
          city: cityShort(now.station_id),
          then: then.risk_days_per_winter,
          now: now.risk_days_per_winter,
          thenSeasons: then.n_seasons,
          nowSeasons: now.n_seasons,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    return [p.product_id, rows];
  }),
);

// Heat-map cells: the now window, every eligible station.
//
// Shipped as flat arrays indexed by stationIndex * 22 + (week - 1) rather than
// 990 objects per product. The object form repeated the station id and four
// keys on every cell and cost ~200 KB of HTML; this is the same data, expanded
// once on the client. Risk is rounded to 4 dp, which is far finer than the
// 0-100% the map can show.
const WEEKS = SEASON_WEEKS;
const gridStations = [...new Set(
  weeklyRisk.filter((r) => r.period === "now").map((r) => r.station_id),
)].sort();

const gridByProduct = Object.fromEntries(
  products.map((p) => {
    const risk = new Array<number>(gridStations.length * WEEKS).fill(0);
    const days = new Array<number>(gridStations.length * WEEKS).fill(0);
    for (const r of weeklyRisk) {
      if (r.product_id !== p.product_id || r.period !== "now") continue;
      const si = gridStations.indexOf(r.station_id);
      if (si < 0) continue;
      const i = si * WEEKS + (r.season_week - 1);
      risk[i] = Math.round(r.risk_share * 1e4) / 1e4;
      days[i] = r.n_days;
    }
    return [p.product_id, { risk, days }];
  }),
);

const nowStationIds = [...new Set(weeklyRisk.filter((r) => r.period === "now").map((r) => r.station_id))];

const laneCities = nowStationIds
  .map((id) => {
    const sev = severeCold.find((s) => s.station_id === id);
    return {
      stationId: id,
      city: cityLabel(id),
      coldestF: sev?.coldest_f ?? 0,
      daysBelow10: sev?.days_below_10f ?? 0,
      perWinter: sev?.days_below_10f_per_winter ?? 0,
    };
  })
  .sort((a, b) => a.city.localeCompare(b.city));

const heatCities = nowStationIds
  .map((id) => ({ stationId: id, city: cityShort(id) }))
  .sort((a, b) => a.city.localeCompare(b.city));

const weekLabels = Array.from({ length: SEASON_WEEKS }, (_, i) => weekLabel(i + 1));

const tariffInfo = tariffs.map((t) => ({
  carrier: t.carrier,
  tariff: t.tariff,
  item: t.item,
  effective_date: t.effective_date,
  charge: t.charge,
  charge_unit: t.charge_unit,
  minimum_charge: t.minimum_charge,
  minimum_unit: t.minimum_unit,
  conditionWords: t.conditions_exact_words,
  chargeWords: t.exact_words,
  source_url: t.source_url,
}));

const headline = products.find((p) => p.product_id === params.headline_product)!;

// "No lane is exempt": every city, coldest day of each of the last 10 winters.
const strips = laneCities
  .map((c) => {
    const sev = severeCold.find((s) => s.station_id === c.stationId)!;
    return {
      stationId: c.stationId,
      city: c.city.split(",")[0],
      seasons: seasonColdest
        .filter((s) => s.station_id === c.stationId && s.period === "now")
        .sort((a, b) => a.season - b.season)
        .map((s) => ({ season: s.season, coldest_f: s.coldest_f })),
      daysBelow10: sev.days_below_10f,
      perWinter: sev.days_below_10f_per_winter,
    };
  })
  .sort((a, b) => b.daysBelow10 - a.daysBelow10);

// The temperature in Saia's published Item 810 condition C. Distinct from
// params.severe_tmin_f (20 °F), which is our own rare-but-severe assumption.
const SAIA_GATE_F = 10;

const saia = tariffs.find((t) => t.carrier.toLowerCase().includes("saia"))!;
const odfl = tariffs.find((t) => t.carrier.toLowerCase().includes("dominion"))!;

const H1 = h("H1_stations_now_window");
const H8 = h("H8_station_days_used");
const H11 = h("H11_cities_any_day_below_10f");
const H7 = h("H7_rare_but_severe_stations");

const featureCards: FeatureCard[] = productOptions.map((p, i) => {
  const full = products.find((x) => x.product_id === p.id)!;
  const media = [
    { img: "/media/p2-steel-drums.webp", alt: "Steel drums stacked on a pallet" },
    { img: "/media/p4-bulk-tank-trailer.webp", alt: "A bulk tank trailer" },
    // p9 now carries the hero, so this card uses a different approved photo
    // (design/MEDIA_LIST.md) to keep p9 to a single appearance on the page.
    { img: "/media/p7-cold-snap-street.webp", alt: "A street during a cold snap" },
  ][i];
  return {
    number: `0${i + 1}`,
    title: `${full.min_safe_f} °F · ${full.example_product}`,
    image: asset(media.img),
    imageAlt: media.alt,
    paragraphs: [
      `${full.product_type}. The sheet says it "${full.exact_storage_words}".`,
      full.freeze_harm_words.startsWith("(")
        ? "The sheet gives thaw instructions but does not say whether freezing harms it."
        : `It also says: "${full.freeze_harm_words}".`,
      `Supplied in ${full.packaging_words.replace("supplied in ", "")}.`,
    ],
    footer: (
      <p className="source">
        <a href={full.source_url} target="_blank" rel="noopener noreferrer">
          {full.example_product} technical data sheet
        </a>
        , {full.doc_code}, {full.doc_date} · cited as a public example, not as a customer
      </p>
    ),
  };
});

export default function WinterPage() {
  return (
    <>
      {/* 10. Full-screen hero: photo, overlay, title, and light snowfall. */}
      <section className="relative isolate flex min-h-[calc(100svh-3.5rem)] items-end overflow-hidden bg-ink">
        <img
          src={asset("/media/p9-closing-band-aerial-terminal.webp")}
          alt=""
          aria-hidden="true"
          className="photo absolute inset-0 h-full w-full object-cover object-[50%_45%]"
        />
        {/* Dark wash so the title holds contrast over any part of the photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55),rgba(0,0,0,0.45)_45%,rgba(0,0,0,0.85))]"
        />
        <Snowfall className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="on-dark relative mx-auto w-full max-w-[82rem] px-4 pb-16 pt-28 text-paper sm:px-6 lg:px-10">
          <p className="marker">Desk Ready · planning tool</p>
          <h1 className="statement statement-hero mt-5 max-w-[13ch]">Winter Load Readiness</h1>
          <p className="mt-7 max-w-[48ch] text-[clamp(1.0625rem,1.6vw,1.3125rem)] leading-[1.5] text-white/85">
            Which winter loads need heat, by city and week, from the last 10 winters of NOAA
            records.
          </p>
          <p className="mt-5 inline-block border border-white/60 px-3 py-1.5 text-sm">
            A planning tool for the desk. Not a forecast, not a savings claim.
          </p>
        </div>
      </section>

      {/* 11. Three stat squares. */}
      <Section>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              figure: fmtInt(H1.value),
              label: "stations analyzed",
              note: "major airport weather stations, each checked against NOAA\u2019s station list",
            },
            {
              figure: fmtInt(H8.value),
              label: "quality-checked station-days behind every number",
              note: "days that failed NOAA\u2019s quality check or had no reading were removed · 10 winters per window",
            },
            {
              figure: "3",
              label: "product storage rules checked",
              note: "31 °F, 32 °F and 40 °F, from three public technical data sheets",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex aspect-square flex-col items-center justify-between border border-line bg-surface p-6 text-center sm:aspect-auto sm:min-h-[17rem]"
            >
              <span />
              <div>
                <p className="figure text-[clamp(2.5rem,5vw,3.75rem)] leading-none">{s.figure}</p>
                <p className="mx-auto mt-4 max-w-[22ch] text-sm font-medium leading-snug">
                  {s.label}
                </p>
              </div>
              <p className="source mx-auto max-w-[30ch]">{s.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 02 renders inside WinterExplorer, after the tool. */}

      {/* 02, 03 and 05 share a product selector. */}
      <WinterExplorer
        products={productOptions}
        dumbbellByProduct={dumbbellByProduct}
        grid={{ stations: gridStations, weeks: WEEKS, byProduct: gridByProduct }}
        cities={laneCities}
        heatCities={heatCities}
        weekLabels={weekLabels}
        defaultThreshold={params.weekly_heat_threshold}
        ledger={{
          calendar: h("H4_calendar_rule_city_weeks").value,
          dataRule: h("H5_data_rule_city_weeks").value,
          notHeated: h("H6_share_city_weeks_not_needing_heat").value,
        }}
        tariffs={tariffInfo}
        // Saia Item 810's own gate, not the rare-but-severe assumption.
        tariffGateF={SAIA_GATE_F}
        headlineProductId={params.headline_product}
        h2={{ value: h("H2_median_change_risk_days_per_winter").value, n: h("H2_median_change_risk_days_per_winter").n_stations }}
        h3={{ value: h("H3_share_stations_fewer_risk_days").value, n: h("H3_share_stations_fewer_risk_days").n_stations }}
        climateQuote={<Quote row={quote(13)} />}
        // 04 · No lane is exempt. Passed in so the explorer renders it between
        // sections 03 and 05, keeping the numbered sections in reading order.
        // 02 · The rule on the drum. Passed in so the explorer can render it
        // between the tool and the then-vs-now chart.
        rulesSection={
          <section id="rules" className="scroll-mt-20 border-y border-line bg-paper py-20 lg:py-28">
            <div className="mx-auto mb-14 w-full max-w-[82rem] px-4 sm:px-6 lg:px-10">
              <SectionHead
                index={2}
                total={6}
                title="The rule on the drum"
                lede="Three public product sheets, three different storage rules. The rule is printed on the sheet, not inferred."
              />
            </div>

            <HorizontalFeatureReveal cards={featureCards} />

            <div className="mx-auto mt-14 w-full max-w-[82rem] px-4 sm:px-6 lg:px-10">
              <Quote row={quote(1)} className="max-w-[56ch]" />
              <p className="source mt-5 max-w-[62ch]">
                Rail and intermodal are part of the same picture but are not modelled here. These
                products are named as public examples; no shipper relationship is implied.
              </p>
            </div>
          </section>
        }
        noLaneExemptSection={
          <Section id="no-lane-exempt" tone="dark">
            <SectionHead
              index={5}
              total={6}
              tone="dark"
              title="No lane is exempt"
              lede={
                <>
                  Every one of the {fmtInt(H1.value)} cities has had a daily low at or below{" "}
                  {params.severe_tmin_f} °F in the last 10 winters — Houston included.
                </>
              }
            />

            <div className="mt-12 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
              <div>
                <Stat
                  tone="dark"
                  figure={`${fmtInt(H11.value)} of ${fmtInt(H1.value)}`}
                  label={`cities have recorded a daily low below ${SAIA_GATE_F} °F in the last 10 winters`}
                  source={
                    <>
                      NOAA GHCN-Daily · 15 cities · 10 winters each · ledger H11, n ={" "}
                      {fmtInt(H11.n_stations)}
                    </>
                  }
                />
                <p className="mt-8 text-[0.9375rem] leading-relaxed text-white/80">
                  The original screen looked for cities where cold is <em>rare</em> but severe: under{" "}
                  {(params.rare_share_max * 100).toFixed(0)}% of winter days breaking the rule, yet at
                  least one day at or below {params.severe_tmin_f} °F. It returns{" "}
                  <strong>{fmtInt(H7.value)} cities</strong> — not because the cold is mild, but
                  because no city is <em>rare</em> enough. Every one breaks the rule on more than{" "}
                  {(params.rare_share_max * 100).toFixed(0)}% of winter days; Houston comes closest
                  and still misses, at 5.4%. The severity half, meanwhile, passes{" "}
                  <strong>everywhere</strong>.
                </p>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/80">
                  Plan by the worst week, not the average.
                </p>
              </div>

              <div className="bg-paper p-6 text-ink sm:p-8">
                <ColdestStrips
                  strips={strips}
                  productLine={headline.min_safe_f}
                  productLabel={`${headline.min_safe_f} °F`}
                  severeLine={params.severe_tmin_f}
                />
                <p className="source mt-6 border-t border-line pt-4">
                  Each dot is the coldest recorded daily low of one winter. Filled dots are at or below{" "}
                  {params.severe_tmin_f} °F. Dashed line: the {headline.example_product} rule (
                  {headline.min_safe_f} °F). Solid line: {params.severe_tmin_f} °F. NOAA GHCN-Daily ·
                  15 cities · 10 winters each.
                </p>
              </div>
            </div>

            {/* The tariff floor, paired with H11. */}
            <div className="mt-16 border-t border-white/20 pt-10">
              <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <p className="marker text-white/60">What the tariff says</p>
                  <p className="display display-md mt-4 max-w-[20ch]">
                    The published service has a floor.
                  </p>
                  <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-white/80">
                    {saia.carrier} provides Protect from Freezing Service only when each of several
                    conditions is met. One of them is a temperature gate:
                  </p>
                  <blockquote className="mt-5 border-l-2 border-white/40 pl-4 text-[0.9375rem] italic">
                    &ldquo;Outside temperature is forecast to be 10 degrees Fahrenheit or higher&rdquo;
                  </blockquote>
                  <p className="source mt-3 text-white/60">
                    <a href={saia.source_url} target="_blank" rel="noopener noreferrer">
                      {saia.tariff}, Item {saia.item}
                    </a>
                    , eff. {saia.effective_date}
                  </p>
                </div>

                <div>
                  <p className="text-[0.9375rem] leading-relaxed text-white/80">
                    On the coldest days in some lanes, published LTL protect-from-freeze may not be
                    available. That is a reason to plan a heated truckload or an equipment backup ahead
                    of time, rather than to find out on the day.
                  </p>
                  <div className="mt-6 border border-white/25 p-5">
                    <p className="marker text-white/60">Read this carefully</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      The tariff condition is written on a <strong>forecast</strong>. The temperatures
                      on this page are <strong>recorded daily lows</strong> from past winters. These
                      records say how often a lane has run below the gate; they do not predict any
                      future day, and they do not say the service will be refused.
                    </p>
                  </div>

                  <table className="mt-8 w-full border-collapse text-sm">
                    <caption className="source mb-2 text-left text-white/60">
                      Days below {SAIA_GATE_F} °F per winter, now window
                    </caption>
                    <thead>
                      <tr className="border-b border-white/25 text-left">
                        <th scope="col" className="py-2 pr-4 font-medium">City</th>
                        <th scope="col" className="py-2 pr-4 text-right font-medium">Days/winter</th>
                        <th scope="col" className="py-2 text-right font-medium">Coldest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strips.map((s) => (
                        <tr key={s.stationId} className="border-b border-white/10">
                          <th scope="row" className="py-1.5 pr-4 text-left font-normal text-white/85">
                            {s.city}
                          </th>
                          <td className="py-1.5 pr-4 text-right text-white/85">
                            {s.perWinter.toFixed(1)}
                          </td>
                          <td className="py-1.5 text-right text-white/85">
                            {Math.min(...s.seasons.map((x) => x.coldest_f)).toFixed(1)} °F
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="source mt-3 text-white/55">
                    NOAA GHCN-Daily · 15 cities · 10 winters each ·{" "}
                    {fmtInt(h("H11b_days_below_10f_total").value)} days below {SAIA_GATE_F} °F
                    in total (ledger H11b)
                  </p>
                </div>
              </div>
            </div>

            {/* H12. Deliberately placed after the assumptions above, not as a headline. */}
            <div className="mt-16 border-t border-white/20 pt-10">
              <IllustrativeSaving
                h6={h("H6_share_city_weeks_not_needing_heat").value}
                thresholdPct={Math.round(params.weekly_heat_threshold * 100)}
                tariffs={tariffs.map((t) => ({
                  carrier: t.carrier,
                  item: t.item,
                  minimum_charge: t.minimum_charge,
                  minimum_unit: t.minimum_unit,
                  effective_date: t.effective_date,
                  source_url: t.source_url,
                }))}
                ledger={{
                  odfl: h("H12_illustrative_per_100_shipments_odfl").value,
                  saia: h("H12b_illustrative_per_100_shipments_saia").value,
                }}
              />
            </div>
          </Section>
        }
      />

      {/* 04 renders inside WinterExplorer, between 03 and 05. */}

      {/* 01, 02, 03, 04 and 05 all render inside WinterExplorer above. */}
      <Section id="playbook">
        <SectionHead
          index={6}
          total={6}
          title="Desk playbook"
          lede="What to do before the load books, while it runs, and if it lands cold."
        />
      </Section>

      <Playbook
        cards={[
          {
            n: "01 · Before booking",
            title: "Before booking",
            image: asset("/media/p1-winter-highway-truck.webp"),
            checklist: [
              <>Run the load check (section 01) for origin, destination and ship week.</>,
              <>Book heated equipment early: 48 to 72 hours, 7 to 10 days for bulk.</>,
              <>Write the minimum storage temperature on the order and BOL.</>,
            ],
            note: (
              <p className="text-sm leading-relaxed">
                Published charges, for reference: {odfl.carrier.replace(" Freight Line", "")} $
                {odfl.charge} {odfl.charge_unit}, min ${odfl.minimum_charge} (eff.{" "}
                {odfl.effective_date}) · {saia.carrier} ${saia.charge} {saia.charge_unit}, min $
                {saia.minimum_charge} (eff. {saia.effective_date}).
              </p>
            ),
            email: {
              subject:
                "Protect-from-freeze request: Load [#], [Origin] to [Destination], picks up [date]",
              body: [
                "Hello [Name],",
                "We are tendering Load [#]: [product], [quantity and packaging], picking up [date] at [origin] for delivery [date] to [destination]. Per the manufacturer\u2019s technical data sheet, the product must be kept above [32 °F] in transit.",
                "Please confirm by [date, time] that you can provide heated or protect-from-freeze service, including the equipment type and any accessorial charge.",
                "Thank you,",
                "[Your name] | [Title] | [Phone]",
              ],
            },
          },
          {
            n: "02 · Cold snap in transit",
            title: "Cold snap in transit",
            image: asset("/media/p8-arrived-cold.webp"),
            checklist: [
              <>
                Check the forecast at{" "}
                <a
                  href="https://www.weather.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  weather.gov
                </a>{" "}
                for each overnight stop.
              </>,
              <>Confirm heat and set point with the carrier.</>,
              <>Update the receiver; escalate if heat is not confirmed.</>,
            ],
            note: (
              <p className="text-sm leading-relaxed">
                <strong>Below 10 °F, the published LTL service may not be offered at all.</strong>{" "}
                Fourteen of the fifteen cities here have recorded a daily low below 10 °F in the
                last 10 winters. Plan the heated truckload or the equipment backup ahead of time.
                <span className="source mt-2 block">
                  <a href={saia.source_url} target="_blank" rel="noopener noreferrer">
                    {saia.tariff}, Item {saia.item}
                  </a>
                  , eff. {saia.effective_date}. The tariff condition uses a forecast; our data is
                  recorded daily lows from past winters.
                </span>
              </p>
            ),
            email: {
              subject: "Cold weather alert: Load [#] in transit to [Destination]",
              body: [
                "Hello [Name],",
                "The National Weather Service forecasts a low of [temperature] near [location] on [date], on the route for Load [#]. This load must be protected from freezing below [32 °F].",
                "Please confirm that heat is running, the current set point, and the updated ETA. If heat cannot be maintained, please call me right away at [phone] so we can arrange an alternative.",
                "Thank you,",
                "[Your name] | [Title] | [Phone]",
              ],
            },
          },
          {
            n: "03 · Arrived cold",
            title: "Arrived cold",
            image: asset("/media/p7-cold-snap-street.webp"),
            checklist: [
              <>Hold the material until it is checked.</>,
              <>Follow the product sheet&rsquo;s thaw steps exactly.</>,
              <>Photograph it and note it on the delivery receipt.</>,
            ],
            note: (
              <p className="text-sm leading-relaxed">
                The sheets differ: MasterAir AE 90 says &ldquo;Although freezing does not harm this
                product&rdquo;, while the other two give thaw instructions only. All three say not
                to use pressurised air for agitation.
              </p>
            ),
            email: {
              subject: "Load [#] received in cold conditions: please hold before use",
              body: [
                "Hello [Name],",
                "Load [#] ([product]) was delivered on [date] at [time], and it may have been exposed to temperatures below the [32 °F] limit on its technical data sheet.",
                "Please hold the material until it has been checked, and follow the thaw instructions on the product sheet: [link]. Please also send photos of the labels and packaging and note the condition on the delivery receipt.",
                "I am coordinating next steps with the carrier and will follow up by [time].",
                "Thank you,",
                "[Your name] | [Title] | [Phone]",
              ],
            },
          },
        ]}
      />

      {/* Solid black closing band, no photo. */}
      <section className="on-dark bg-ink px-4 py-24 text-paper sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[82rem]">
          <p className="display display-lg max-w-[20ch]">Every number here is checked twice.</p>
          <p className="mt-5 max-w-[48ch] text-white/75">
            Computed once in SQL and again in pandas, from the raw NOAA files. They have to match
            before the site can be built.
          </p>
          <a href="/method/" className="btn mt-8">
            Method &amp; SQL
          </a>
        </div>
      </section>
    </>
  );
}
