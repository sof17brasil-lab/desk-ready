/**
 * Typed access to web/public/data/*.json, the only source of numbers on this
 * site (CLAUDE.md rule 8). Everything here runs at build time in server
 * components; client components receive already-narrowed props.
 */
import briefFactsJson from "@/public/data/brief_facts.json";
import headlinesJson from "@/public/data/headlines.json";
import paramsJson from "@/public/data/params.json";
import productsJson from "@/public/data/products.json";
import seasonColdestJson from "@/public/data/season_coldest.json";
import severeColdJson from "@/public/data/severe_cold_now.json";
import sppJson from "@/public/data/station_period_product.json";
import stationEligibilityJson from "@/public/data/station_eligibility.json";
import stationsJson from "@/public/data/stations.json";
import tariffsJson from "@/public/data/pff_tariffs.json";
import weeklyRiskJson from "@/public/data/weekly_risk.json";

export type Period = "now" | "then";

export interface Station {
  role: string;
  city: string;
  candidate_station_id: string;
  noaa_station_name: string;
  noaa_state: string;
  wmo_id: number;
  lat: number;
  lon: number;
  first_year: number;
  last_year: number;
  status: string;
}

export interface Product {
  product_id: string;
  product_type: string;
  example_product: string;
  min_safe_f: number;
  risk_rule: string;
  exact_storage_words: string;
  freeze_harm_words: string;
  packaging_words: string;
  doc_code: string;
  doc_date: string;
  source_url: string;
}

export interface Headline {
  metric_id: string;
  value: number;
  n_stations: number;
  basis: string;
}

export interface StationPeriodProduct {
  station_id: string;
  period: Period;
  product_id: string;
  n_seasons: number;
  n_days: number;
  risk_days: number;
  risk_share: number;
  risk_days_per_winter: number;
  coldest_f: number;
  in_then_now: boolean;
}

export interface WeeklyRisk {
  station_id: string;
  period: Period;
  product_id: string;
  season_week: number;
  n_days: number;
  risk_share: number;
}

export interface SeasonColdest {
  station_id: string;
  season: number;
  period: Period;
  coldest_f: number;
  n_days: number;
  in_then_now: boolean;
}

export interface SevereCold {
  station_id: string;
  n_seasons: number;
  n_days: number;
  days_below_10f: number;
  days_below_10f_per_winter: number;
  coldest_f: number;
  any_below_10f: boolean;
}

export interface Tariff {
  carrier: string;
  tariff: string;
  item: string;
  item_title: string;
  charge: string;
  charge_unit: string;
  minimum_charge: string;
  minimum_unit: string;
  effective_date: string;
  exact_words: string;
  conditions_exact_words: string;
  source_url: string;
}

export interface SourceRow {
  row: number;
  source: string;
  date: string;
  /** The raw SOURCES.md cell, including its quote marks and any note. */
  exact_words: string;
  /** Just the quoted phrase, no quote marks: the site adds its own. */
  quoted: string;
  status: string;
  link: string;
}

export interface BriefFact {
  id: string;
  figure: string;
  label: string;
  sources: SourceRow[];
}

export const stations = stationsJson as Station[];
export const products = productsJson as Product[];
export const headlines = headlinesJson as Headline[];
export const spp = sppJson as StationPeriodProduct[];
export const weeklyRisk = weeklyRiskJson as WeeklyRisk[];
export const seasonColdest = seasonColdestJson as SeasonColdest[];
export const severeCold = severeColdJson as SevereCold[];
export const tariffs = tariffsJson as Tariff[];
export const params = (paramsJson as Record<string, number | string>[])[0] as {
  then_first_season: number;
  then_last_season: number;
  now_first_season: number;
  now_last_season: number;
  min_season_coverage: number;
  min_valid_seasons_per_period: number;
  headline_product: string;
  weekly_heat_threshold: number;
  rare_share_max: number;
  severe_tmin_f: number;
};
export const stationEligibility = stationEligibilityJson as {
  station_id: string;
  eligible_now: boolean;
  eligible_then_now: boolean;
  then_seasons: number;
  now_seasons: number;
}[];
export const briefFacts = briefFactsJson as { facts: BriefFact[]; quotes: SourceRow[] };

/** A headline metric. Throws at build time if the id is not in the ledger. */
export function h(metricId: string): Headline {
  const row = headlines.find((x) => x.metric_id === metricId);
  if (!row) throw new Error(`headlines.json has no metric "${metricId}"`);
  return row;
}

/** A brief figure by id. Throws at build time if it is missing. */
export function fact(id: string): BriefFact {
  const f = briefFacts.facts.find((x) => x.id === id);
  if (!f) throw new Error(`brief_facts.json has no fact "${id}"`);
  return f;
}

/** A SOURCES.md row by number, for quoting on the page. */
export function quote(row: number): SourceRow {
  const q = briefFacts.quotes.find((x) => x.row === row);
  if (!q) throw new Error(`brief_facts.json has no quote row ${row}`);
  return q;
}

export function product(id: string): Product {
  const p = products.find((x) => x.product_id === id);
  if (!p) throw new Error(`products.json has no product "${id}"`);
  return p;
}

/** Short city label, e.g. "Philadelphia, PA". */
export function cityLabel(stationId: string): string {
  const s = stations.find((x) => x.candidate_station_id === stationId);
  if (!s) return stationId;
  const [city] = s.city.split(" (");
  return city;
}

/** Just the city name, for tight chart axes. */
export function cityShort(stationId: string): string {
  return cityLabel(stationId).split(",")[0];
}

export const SEASON_WEEKS = 22;

/** Nov 1 + 7n, as a readable range. Week 22 is short by construction. */
export function weekLabel(week: number): string {
  const start = new Date(Date.UTC(2001, 10, 1));
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (week === SEASON_WEEKS ? 3 : 6));
  const f = (d: Date) =>
    `${d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} ${d.getUTCDate()}`;
  return `${f(start)} – ${f(end)}`;
}

export const fmtPct = (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`;
export const fmtF = (v: number) => `${v.toFixed(1)} °F`;
export const fmtInt = (v: number) => Math.round(v).toLocaleString("en-US");
/** One decimal, per Sofia: −7.45 displays as "7.5 fewer days". */
export const fmt1 = (v: number) => v.toFixed(1);
