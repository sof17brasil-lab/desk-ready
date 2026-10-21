import fs from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { Section, SectionHead } from "@/components/site/bits";
import {
  briefFacts,
  h,
  headlines,
  params,
  products,
  stationEligibility,
  stations,
  tariffs,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Method & SQL",
  description:
    "How every number on this site was computed: data, rules, the four SQL files, the numbers ledger, and the limits.",
};

const REPO = path.resolve(process.cwd(), "..");

/** The four SQL files, copied verbatim from /sql at build time. */
const sqlFiles = ["01_load.sql", "02_clean.sql", "03_metrics.sql", "04_headlines.sql"].map((f) => ({
  name: f,
  body: fs.readFileSync(path.join(REPO, "sql", f), "utf8"),
}));

/** The ledger, read from ledger/numbers_ledger.csv at build time. */
function readLedger() {
  const raw = fs.readFileSync(path.join(REPO, "ledger/numbers_ledger.csv"), "utf8").trim();
  const [head, ...lines] = raw.split("\n");
  const cols = head.split(",").map((c) => c.replace(/^"|"$/g, ""));
  // The basis column contains commas and is therefore quoted by pandas, so the
  // file needs real CSV parsing rather than a plain split.
  const parse = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
        } else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  return lines.map((line) => {
    const parts = parse(line);
    const row: Record<string, string> = {};
    cols.forEach((c, i) => { row[c] = parts[i] ?? ""; });
    return row;
  });
}

const ledger = readLedger();
const num = (v: string) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  // Trim trailing zeros, and the trailing point they can leave behind.
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
};

export default function MethodPage() {
  const allMatch = ledger.every((r) => r.match === "True");

  return (
    <>
      <Section>
        <p className="marker">Desk Ready</p>
        <h1 className="display display-xl mt-5 max-w-[12ch]">Method &amp; SQL</h1>
        <p className="lede mt-6">
          Every number, where it came from and how it was checked. Nothing on this site is typed by
          hand into a page.
        </p>
        <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          {[
            ["#data", "Data"],
            ["#rules", "Rules"],
            ["#sql", "SQL"],
            ["#ledger", "Numbers ledger"],
            ["#limits", "Limits"],
            ["#credits", "Credits"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="text-sm underline underline-offset-4">
              {label}
            </a>
          ))}
        </nav>
      </Section>

      {/* Data */}
      <Section id="data" tone="surface">
        <SectionHead index={1} total={5} title="Data" />

        <h3 className="mt-12 text-lg font-semibold">Weather records</h3>
        <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-relaxed text-deep">
          NOAA GHCN-Daily, one file per station, downloaded {stations[0]?.last_year ? "October 13, 2026" : ""}.
          Every station ID was checked against NOAA&rsquo;s own station list before anything was
          downloaded; all 15 matched their city.
        </p>
        <div className="mt-5 min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Stations used, with NOAA names and coverage</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="py-2 pr-4 font-medium">City</th>
                <th scope="col" className="py-2 pr-4 font-medium">Station ID</th>
                <th scope="col" className="py-2 pr-4 font-medium">NOAA station name</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Record starts</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Then winters</th>
                <th scope="col" className="py-2 text-right font-medium">Now winters</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s) => {
                const e = stationEligibility.find((x) => x.station_id === s.candidate_station_id);
                return (
                  <tr key={s.candidate_station_id} className="border-b border-line">
                    <th scope="row" className="py-1.5 pr-4 text-left font-normal">
                      {s.city.split(" (")[0]}
                    </th>
                    <td className="py-1.5 pr-4 font-mono text-xs">{s.candidate_station_id}</td>
                    <td className="py-1.5 pr-4">{s.noaa_station_name}</td>
                    <td className="py-1.5 pr-4 text-right">{s.first_year}</td>
                    <td className="py-1.5 pr-4 text-right">
                      {e?.then_seasons ?? 0}
                      {e && !e.eligible_then_now && (
                        <span className="text-quiet"> (below 8)</span>
                      )}
                    </td>
                    <td className="py-1.5 text-right">{e?.now_seasons ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="source mt-3 max-w-[76ch]">
          A winter counts only if at least {(params.min_season_coverage * 100).toFixed(0)}% of its
          days have a valid, quality-checked reading. Denver International&rsquo;s record starts in
          November 1994 (the airport opened in February 1995), so it reaches only 6 of 10 earlier
          winters and is left out of the then-versus-now comparison. It is used everywhere else.
        </p>

        <h3 className="mt-12 text-lg font-semibold">Product storage rules</h3>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {products.map((p) => (
            <div key={p.product_id} className="border border-line bg-paper p-5">
              <p className="figure text-2xl">{p.min_safe_f} °F</p>
              <p className="mt-1 text-sm font-medium">{p.example_product}</p>
              <p className="mt-2 text-xs leading-relaxed text-deep">
                &ldquo;{p.exact_storage_words}&rdquo;
              </p>
              <p className="source mt-3">
                <a href={p.source_url} target="_blank" rel="noopener noreferrer">
                  {p.doc_code}, {p.doc_date}
                </a>
              </p>
            </div>
          ))}
        </div>

        <h3 className="mt-12 text-lg font-semibold">Published LTL charges</h3>
        <div className="mt-4 min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <caption className="sr-only">Protect-from-freezing charges read from published tariffs</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="py-2 pr-4 font-medium">Carrier</th>
                <th scope="col" className="py-2 pr-4 font-medium">Item</th>
                <th scope="col" className="py-2 pr-4 font-medium">Charge</th>
                <th scope="col" className="py-2 pr-4 font-medium">Minimum</th>
                <th scope="col" className="py-2 font-medium">Effective</th>
              </tr>
            </thead>
            <tbody>
              {tariffs.map((t) => (
                <tr key={t.carrier} className="border-b border-line">
                  <th scope="row" className="py-1.5 pr-4 text-left font-normal">
                    <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      {t.carrier}
                    </a>
                  </th>
                  <td className="py-1.5 pr-4">{t.item}</td>
                  <td className="py-1.5 pr-4">${t.charge} {t.charge_unit}</td>
                  <td className="py-1.5 pr-4">${t.minimum_charge} {t.minimum_unit}</td>
                  <td className="py-1.5">{t.effective_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-12 text-lg font-semibold">Published reports and pages</h3>
        <div className="mt-4 min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Every outside fact used on the site</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="py-2 pr-4 font-medium">#</th>
                <th scope="col" className="py-2 pr-4 font-medium">Source</th>
                <th scope="col" className="py-2 pr-4 font-medium">Date</th>
                <th scope="col" className="py-2 font-medium">Exact words used</th>
              </tr>
            </thead>
            <tbody>
              {[...briefFacts.facts.flatMap((f) => f.sources), ...briefFacts.quotes]
                .filter((r, i, a) => a.findIndex((x) => x.row === r.row) === i)
                .sort((a, b) => a.row - b.row)
                .map((r) => (
                  <tr key={r.row} className="border-b border-line align-top">
                    <td className="py-2 pr-4 text-quiet">{r.row}</td>
                    <th scope="row" className="py-2 pr-4 text-left font-normal">
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                        {r.source}
                      </a>
                    </th>
                    <td className="py-2 pr-4 whitespace-nowrap text-quiet">{r.date}</td>
                    <td className="py-2 text-deep">{r.exact_words}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="source mt-3">
          Row numbers match sources/SOURCES.md in the repository. Saved copies of all 13 source
          documents are in sources/pdfs/.
        </p>
      </Section>

      {/* Rules */}
      <Section id="rules">
        <SectionHead index={2} total={5} title="Rules" />
        <dl className="mt-12 grid gap-x-12 gap-y-7 md:grid-cols-2">
          {[
            ["Season", "November 1 to March 31, labelled by the year it starts. Winter 2025 means November 2025 to March 2026."],
            ["Week", "Week 1 is November 1 to 7. Week 22 is a short week (March 28 to 31, or March 27 to 31 in a leap season), so it holds 42 station-days per city instead of 70. Its day count is shown wherever it appears."],
            ["Quality filter", "TMIN only. A blank Q-flag means the value \"did not fail any quality assurance check\" (NOAA readme.txt). Any other Q-flag is dropped, and −9999 means missing and is dropped."],
            ["Units", "TMIN is stored in tenths of degrees C and converted to Fahrenheit once, in SQL: v/10 × 9/5 + 32."],
            ["Coverage", `A winter counts only if at least ${(params.min_season_coverage * 100).toFixed(0)}% of its days have a valid reading.`],
            ["Two windows", `Then = winters ${params.then_first_season} to ${params.then_last_season}. Now = winters ${params.now_first_season} to ${params.now_last_season}. Two equal 10-winter windows, no overlap.`],
            ["Eligibility", `A station needs at least ${params.min_valid_seasons_per_period} complete winters in the now window to appear in any now-window number, and at least ${params.min_valid_seasons_per_period} in both windows to appear in the then-versus-now comparison. The second test is stricter because that comparison needs a real baseline; a short history does not disqualify a station from numbers that do not use history.`],
            ["Risk day", "A day whose recorded low breaks the selected product's printed storage rule. The comparison operator comes from the sheet: 31 °F \"or higher\" means strictly below 31 is a risk day; the other two are at-or-below."],
            ["Weekly heat threshold", `An assumption, not a finding: heat a city-week if at least ${(params.weekly_heat_threshold * 100).toFixed(0)}% of its days are risk days. The site exposes this as a slider. At 15% the data rule skips 18.2% of city-weeks, at 20% it skips 23.0%, at 30% it skips 33.0%.`],
            ["Rare but severe", `An assumption: risk share below ${(params.rare_share_max * 100).toFixed(0)}% in the now window, with at least one day at or below ${params.severe_tmin_f} °F. It returns zero cities, because the severity half passes for all 15.`],
            ["10 °F", `Not our threshold. It is the gate in Saia's published Item 810, which provides the service only when the outside temperature is "forecast to be 10 degrees Fahrenheit or higher". We count recorded daily lows below it.`],
            ["H12, the illustrative figure", `shipments × H6 × the carrier's published Item 810 minimum charge. At 100 shipments: 100 × ${h("H6_share_city_weeks_not_needing_heat").value.toFixed(6)} × $${Number(tariffs.find((t) => /Dominion/i.test(t.carrier))!.minimum_charge).toFixed(2)} = $${h("H12_illustrative_per_100_shipments_odfl").value.toFixed(2)} (Old Dominion), and × $${Number(tariffs.find((t) => /Saia/i.test(t.carrier))!.minimum_charge).toFixed(2)} = $${h("H12b_illustrative_per_100_shipments_saia").value.toFixed(2)} (Saia). It is arithmetic, not a measurement: it assumes the shipments are spread evenly across the analysed city-weeks, that each would otherwise be billed the minimum charge (which only binds on light shipments — above roughly 1,286 lb at Old Dominion's $3.50 per cwt the real charge is higher), and that protect-from-freezing was being bought on all of them. It uses no Uber Freight figure and is not a savings claim.`],
          ].map(([term, def]) => (
            <div key={term}>
              <dt className="text-sm font-semibold">{term}</dt>
              <dd className="mt-1.5 max-w-[56ch] text-[0.9375rem] leading-relaxed text-deep">{def}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* SQL */}
      <Section id="sql" tone="surface">
        <SectionHead
          index={3}
          total={5}
          title="SQL"
          lede="The four DuckDB files, copied verbatim from /sql at build time."
        />
        <div className="mt-12 space-y-4">
          {sqlFiles.map((f, i) => (
            <details key={f.name} className="border border-line bg-paper" open={i === 0}>
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">
                sql/{f.name}
                <span className="ml-3 font-normal text-quiet">
                  {f.body.split("\n").length} lines
                </span>
              </summary>
              <pre className="code overflow-x-auto border-t border-line bg-surface px-5 py-4">
                <code>{f.body}</code>
              </pre>
            </details>
          ))}
        </div>
        <p className="source mt-5">
          The independent pandas recomputation is in pipeline/check_pandas.py. It reads the raw NOAA
          files again rather than any table the SQL created, so a mistake in the SQL cannot hide in
          both.
        </p>
      </Section>

      {/* Ledger */}
      <Section id="ledger">
        <SectionHead
          index={4}
          total={5}
          title="Numbers ledger"
          lede="Every headline computed twice, in SQL and in pandas. They must match before the site can be built."
        />

        <p className="mt-8 inline-block border border-ink px-4 py-2 text-sm font-medium">
          {allMatch
            ? `All ${ledger.length} metrics match, on value and on sample size.`
            : "MISMATCH — do not trust this build."}
        </p>

        <div className="mt-6 min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">SQL value against pandas value for every headline metric</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="py-2 pr-4 font-medium">Metric</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">SQL</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">pandas</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">n stations</th>
                <th scope="col" className="py-2 pr-4 font-medium">Match</th>
                <th scope="col" className="py-2 font-medium">Basis</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((r) => (
                <tr key={r.metric_id} className="border-b border-line align-top">
                  <th scope="row" className="py-2 pr-4 text-left font-mono text-xs font-normal">
                    {r.metric_id}
                  </th>
                  <td className="py-2 pr-4 text-right">{num(r.sql_value)}</td>
                  <td className="py-2 pr-4 text-right">{num(r.pandas_value)}</td>
                  <td className="py-2 pr-4 text-right">{num(r.sql_n_stations)}</td>
                  <td className="py-2 pr-4">
                    {r.match === "True" ? (
                      <span aria-label="match">✓</span>
                    ) : (
                      <span aria-label="mismatch">✗</span>
                    )}
                  </td>
                  <td className="py-2 text-xs leading-relaxed text-deep">{r.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="source mt-3">
          Read from ledger/numbers_ledger.csv, written by pipeline/run_all.py. Computed{" "}
          {ledger[0]?.computed_at}.
        </p>
      </Section>

      {/* Limits */}
      <Section id="limits" tone="dark">
        <SectionHead index={5} total={5} tone="dark" title="Limits" />
        <ul className="mt-12 grid max-w-[80rem] gap-5 md:grid-cols-2">
          {[
            "These are outdoor daily minimum air temperatures, used as a screening signal. They are not trailer interior temperatures, which we do not have.",
            "These are past winters, not a forecast. Nothing here predicts any future day. Check the National Weather Service before dispatch.",
            "A station is a city's airport, not the exact pickup or delivery site. Conditions at a dock can differ.",
            "Product rules differ, and freezing does not always harm the product. One sheet says \"Although freezing does not harm this product\"; the other two give thaw instructions without saying.",
            "The weekly threshold and the rare-but-severe cut-offs are assumptions the reader can change, not measurements.",
            "We show what the station records say, then and now. We do not attribute the change to any cause.",
            "No Uber Freight cost, volume, margin or savings figure appears anywhere on this site. None is public. Every money figure is either industry-wide (ATRI), a published carrier tariff, or typed in by the reader.",
            "The construction-chemicals products are cited as public examples. No shipper relationship with any company is stated or implied.",
          ].map((t) => (
            <li key={t} className="flex gap-3 text-[0.9375rem] leading-relaxed text-white/80">
              <span aria-hidden="true" className="mt-2 h-px w-4 shrink-0 bg-white/40" />
              {t}
            </li>
          ))}
        </ul>

        <div id="credits" className="mt-16 scroll-mt-20 border-t border-white/20 pt-10">
          <h2 className="display display-md">Credits</h2>
          <p className="mt-4 max-w-[60ch] text-[0.9375rem] leading-relaxed text-white/75">
            Photos: Unsplash. Weather data: NOAA GHCN-Daily. Charges: Old
            Dominion and Saia published rules tariffs. Reports: Uber Freight, ATRI, FreightWaves,
            Climate Central, each linked above.
          </p>
        </div>
      </Section>
    </>
  );
}
