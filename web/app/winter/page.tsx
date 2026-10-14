import type { Metadata } from "next";

import { ColdestStrips } from "@/components/charts/coldest-strips";
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
const cellsByProduct = Object.fromEntries(
  products.map((p) => [
    p.product_id,
    weeklyRisk
      .filter((r) => r.product_id === p.product_id && r.period === "now")
      .map((r) => ({ s: r.station_id, w: r.season_week, r: r.risk_share, d: r.n_days })),
  ]),
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
    { img: "/media/p9-closing-band-aerial-terminal.webp", alt: "An aerial view of a freight terminal" },
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
      {/* Header */}
      <Section>
        <p className="marker">Desk Ready · planning tool</p>
        <h1 className="display display-xl mt-5 max-w-[14ch]">Winter Load Readiness</h1>
        <p className="lede mt-6">
          Which winter loads need heat, by city and week, from the last 10 winters of NOAA records.
        </p>
        <p className="mt-4 inline-block border border-ink px-3 py-1.5 text-sm">
          A planning tool for the desk. Not a forecast, not a savings claim.
        </p>

        <div className="mt-14 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
          <Stat
            size="sm"
            figure={fmtInt(H1.value)}
            label="stations analysed"
            source={<>first-order airport stations, verified against NOAA&rsquo;s station list</>}
          />
          <Stat
            size="sm"
            figure={fmtInt(H8.value)}
            label="quality-checked station-days behind every number"
            source={<>Q-flag blank, −9999 dropped · 10 winters per window</>}
          />
          <Stat
            size="sm"
            figure="3"
            label="product storage rules checked"
            source={<>31 °F, 32 °F and 40 °F, from three public technical data sheets</>}
          />
        </div>
      </Section>

      {/* 01 · The rule on the drum */}
      <section id="rules" className="scroll-mt-20 border-y border-line bg-paper py-20 lg:py-28">
        <div className="mx-auto mb-14 w-full max-w-[82rem] px-4 sm:px-6 lg:px-10">
          <SectionHead
            index={1}
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

      {/* 02, 03 and 05 share a product selector. */}
      <WinterExplorer
        products={productOptions}
        dumbbellByProduct={dumbbellByProduct}
        cellsByProduct={cellsByProduct}
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
        severeTminF={params.severe_tmin_f}
        headlineProductId={params.headline_product}
        h2={{ value: h("H2_median_change_risk_days_per_winter").value, n: h("H2_median_change_risk_days_per_winter").n_stations }}
        h3={{ value: h("H3_share_stations_fewer_risk_days").value, n: h("H3_share_stations_fewer_risk_days").n_stations }}
        climateQuote={<Quote row={quote(13)} />}
      />

      {/* 04 · No lane is exempt */}
      <Section id="no-lane-exempt" tone="dark">
        <SectionHead
          index={4}
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

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <Stat
              figure={`${fmtInt(H11.value)} of ${fmtInt(H1.value)}`}
              label={`cities have recorded a daily low below ${params.severe_tmin_f} °F in the last 10 winters`}
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
              because the severity half passes <strong>everywhere</strong>. Houston comes closest
              to &ldquo;rare&rdquo; and still misses, at 5.4% of winter days.
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
                  Days below {params.severe_tmin_f} °F per winter, now window
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
                NOAA GHCN-Daily · 15 cities · 10 winters each · 1,058 days below{" "}
                {params.severe_tmin_f} °F in total (ledger H11b)
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* 05 renders inside WinterExplorer above. 06 below. */}
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
            title: "Book the equipment, not the hope",
            image: asset("/media/p1-winter-highway-truck.webp"),
            checklist: [
              <>Run the lane and ship week through <a className="underline underline-offset-4" href="#load-check">Check a load</a>.</>,
              <>Request heated or protect-from-freeze equipment early. {odfl.carrier.replace(" Freight Line", "")} requires the shipper to &ldquo;contact the local service center to establish in advance whether the service is available&rdquo;.</>,
              <>Give carriers lead time. The Q3 report asks for &ldquo;48 to 72 hours of lead time&rdquo;, and bulk lead time has moved to &ldquo;7 to 10 days&rdquo;.</>,
              <>Put the words on the bill of lading itself. Both tariffs require the notation on the BOL; marking the freight alone is not enough.</>,
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
              subject: "Protect from freezing — [origin] to [destination], pickup [date]",
              lines: [
                "Please confirm heated or protect-from-freeze service is available for this shipment, and the set point you can hold.",
                "The bill of lading will be marked \"PROTECT FROM FREEZING\" on the first page, and each handling unit will be marked.",
                "If the service is not available for this pickup date, please tell me today so I can arrange a heated truckload instead.",
              ],
            },
          },
          {
            n: "02 · Cold snap in transit",
            title: "Confirm the set point, then the backup",
            image: asset("/media/p7-cold-snap-street.webp"),
            checklist: [
              <>Confirm with the carrier that the equipment is heated and ask for the set point in writing.</>,
              <>Check whether the lane is forecast below the published service floor. {saia.carrier} provides the service only when &ldquo;Outside temperature is forecast to be 10 degrees Fahrenheit or higher&rdquo;.</>,
              <>Update the receiver with the revised ETA and the protection in place.</>,
              <>Escalate if no heat can be confirmed: line up a heated truckload or hold the load.</>,
              <>Verify any reroute by phone. &ldquo;{quote(21).exact_words}&rdquo;</>,
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
              subject: "Cold snap — confirm heat and set point, PRO [number]",
              lines: [
                "This load is moving through a lane that has run below 10 °F in recent winters. Please confirm the trailer is heated and give me the set point you are holding.",
                "If protect-from-freeze service cannot be maintained for any leg, call me before the next departure.",
                "Receiver has been notified. I can accept a delay to keep the product protected.",
              ],
            },
          },
          {
            n: "03 · Arrived cold",
            title: "Follow the sheet, document the claim",
            image: asset("/media/p8-arrived-cold.webp"),
            checklist: [
              <>Do not judge by appearance. The sheets differ: MasterAir AE 90 says &ldquo;Although freezing does not harm this product&rdquo;, while the other two give thaw instructions only.</>,
              <>Follow the sheet&rsquo;s own thaw words: MasterPozzolith 80 and MasterAir AE 90 say &ldquo;thaw at 35 °F (2 °C) or above&rdquo;; MasterSure Z 60 says to &ldquo;thaw and reconstitute by mechanical agitation&rdquo;.</>,
              <>Never use pressurised air for agitation. All three sheets say not to.</>,
              <>Photograph the seal, the temperature recorder if fitted, and the BOL notation.</>,
              <>Document for the claim and log the facility, so the lane&rsquo;s pattern is visible next winter.</>,
            ],
            email: {
              subject: "Cold arrival — [product], PRO [number], [date]",
              lines: [
                "This shipment arrived after transit through sub-freezing temperatures. Photos of the seal, BOL and packaging are attached.",
                "We are following the manufacturer's published thaw instructions and will not use pressurised air for agitation.",
                "Please open a claim file and confirm the protect-from-freeze service that was billed on this shipment.",
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
