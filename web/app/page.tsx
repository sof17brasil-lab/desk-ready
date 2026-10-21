import Link from "next/link";
import type { ReactNode } from "react";

import { AcceptanceSquares, DetentionGrid, OtriJumps } from "@/components/charts/brief-charts";
import { RejectionCalculator } from "@/components/calculators/rejection-calculator";
import { QuoteCarousel } from "@/components/ui/testimonals-carousel";
import { Section, SectionHead, Source, Stat } from "@/components/site/bits";
import { BlizzardIntro } from "@/components/ui/blizzard-intro";
import { StickyPanel } from "@/components/ui/smooth-scroll";
import { fact, quote, type SourceRow } from "@/lib/data";
import { asset } from "@/lib/utils";

// Content locked in design/BRIEF_CONTENT.md. Figures and quotes are read from
// brief_facts.json, which is built from SOURCES.md and fails the build if any
// figure stops matching the exact words of the row it cites.
const acceptanceNow = fact("acceptance_now");
const acceptancePrior = fact("acceptance_prior");
const bulkLead = fact("bulk_lead_time");
const leadAsk = fact("lead_time_ask");
const detentionShare = fact("detention_share");
const detentionCost = fact("detention_cost");
const hygiene = fact("hygiene_swing");
const fraud = fact("fraud_share");
const otri25 = fact("winter_otri_2025");
const otri24 = fact("winter_otri_2024");

// The same four quotes as before, word for word from SOURCES.md. Attribution
// is split out so the carousel can show who said it under each one.
const carouselQuotes = [
  {
    row: 31,
    speaker: "Zach Strickland",
    speakerTitle: "FreightWaves",
    publication: "FreightWaves",
  },
  { row: 25, publication: "Uber Freight, Q2 freight market update" },
  {
    row: 30,
    publication: "ATRI, truck driver detention research",
    speakerTitle: "ATRI's interpretation of GPS data",
  },
  {
    row: 1,
    speaker: "Greg Umstead",
    speakerTitle: "VP of commercial operations, Uber Freight",
    publication: "Uber Freight blog, chemical supply chains",
  },
].map((q) => {
  const row = quote(q.row);
  return {
    text: row.quoted,
    speaker: q.speaker,
    speakerTitle: q.speakerTitle,
    publication: q.publication,
    date: row.date,
    link: row.link,
    sourceRow: row.row,
  };
});

// Parsed from the verified facts rather than typed in, so these cannot drift
// from SOURCES.md: the build already asserts each figure against its row.
const ACCEPTANCE_NOW = Number(acceptanceNow.figure.replace(/[^0-9.]/g, ""));
const [BAND_LOW, BAND_HIGH] = (acceptancePrior.figure.match(/\d+/g) ?? []).map(Number);
if (!ACCEPTANCE_NOW || !BAND_LOW || !BAND_HIGH) {
  throw new Error("Could not read the acceptance figures from brief_facts.json");
}

export default function HomePage() {
  return (
    <>
      {/* 1-3. The opening: title, a blizzard that sweeps across it, then
          the statement revealed as the storm clears. */}
      <BlizzardIntro
        title="Uber Freight portfolio project"
        disclaimer="Independent project. Not affiliated with Uber Freight."
        byline="Sofia Mota"
        statement="See why carriers say no"
      />

      {/* Who this is, what it is, and what she wants to own. Placed directly
          after the opening so a reader meets the ask before the analysis. */}
      <section className="border-b border-line bg-surface px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[82rem] gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-end md:gap-16">
          <div>
            <p className="statement-sm">Sofia Mota</p>
            <p className="mt-4 max-w-[52ch] text-[clamp(1.0625rem,1.6vw,1.25rem)] leading-[1.5]">
              I am applying for the Logistics Specialist II role in Exton, Pennsylvania. This is an
              independent project built entirely on public records: a desk brief on why carriers
              reject loads, and a planning tool that says which winter loads need heat.
            </p>
            <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-deep">
              What I would want to own: winter protect-from-freeze planning for the chemical
              accounts — booking the right equipment before the cold week rather than during it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <a href="mailto:sof17.brasil@gmail.com" className="btn btn-solid">
              Contact Sofia
            </a>
            <Link href="/winter/" className="btn">
              See the tool
            </Link>
          </div>
        </div>
      </section>

      {/* The brief proper. */}
      <Section>
        <h2 className="display display-xl max-w-[16ch]">Why carriers say no</h2>
        <p className="statement-sm mt-8 max-w-[22ch]">Four measured problems in 2026 freight</p>
        <p className="statement-sm mt-2 max-w-[22ch] text-quiet">
          The desk habits that move each one
        </p>

        {/* 5. The headline number, written so anyone gets it at a glance. */}
        <div className="mt-16 grid items-start gap-10 border-t border-line pt-12 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div>
            <p className="text-[clamp(1.375rem,3vw,2.125rem)] leading-[1.25]">
              <strong className="figure">{ACCEPTANCE_NOW}</strong> of every 100 loads were accepted by the first
              carrier asked (August 2026).
            </p>
            <p className="mt-5 max-w-[44ch] text-[0.9375rem] leading-relaxed text-deep">
              In the prior three years it ran at {acceptancePrior.figure}. The gap is the loads that
              fall through to a backup carrier, and each one costs more.
            </p>
            <div className="source mt-6 max-w-[48ch]">
              <Source rows={[...acceptanceNow.sources, ...acceptancePrior.sources]} />
            </div>
          </div>

          <AcceptanceSquares now={ACCEPTANCE_NOW} bandLow={BAND_LOW} bandHigh={BAND_HIGH} />
        </div>

      </Section>

      {/* 6. Four problem panels, each labelled THE PROBLEM / THE FIX. */}
      <div>
        <StickyPanel tone="dark">
          <ProblemPanel
            n="01"
            kicker="Rejected tenders"
            figure={acceptanceNow.figure}
            against={`vs ${acceptancePrior.figure}`}
            line={
              <>
                Rejected loads mean{" "}
                <em className="not-italic underline decoration-white/30 underline-offset-4">
                  &ldquo;{quote(23).quoted}&rdquo;
                </em>
                .
              </>
            }
            habit={<>Book early: &ldquo;{leadAsk.sources[0].quoted}&rdquo;</>}
            sources={[...acceptanceNow.sources, ...acceptancePrior.sources, quote(23), ...leadAsk.sources]}
          />
        </StickyPanel>

        <StickyPanel tone="light">
          <ProblemPanel
            tone="light"
            n="02"
            kicker="Short notice"
            figure={bulkLead.figure}
            against="up from 24 to 72 hours"
            line={<>&ldquo;{quote(5).quoted}&rdquo;</>}
            habit="Plan bulk and heated equipment a week ahead."
            sources={[...bulkLead.sources, quote(5)]}
          />
        </StickyPanel>

        <StickyPanel tone="dark">
          <ProblemPanel
            n="03"
            kicker="Waiting at the dock"
            figure={detentionShare.figure}
            against="of all stops, 2023"
            line={
              <>
                {detentionCost.figure} lost to detention in 2023, industry-wide. Poor shipping
                hygiene &ldquo;{hygiene.sources[0].quoted}&rdquo;
              </>
            }
            habit={<>Clean appointments, paperwork ready, track detention by facility.</>}
            sources={[...detentionShare.sources, ...detentionCost.sources, ...hygiene.sources, quote(26)]}
          />
        </StickyPanel>

        <StickyPanel tone="light">
          <ProblemPanel
            tone="light"
            n="04"
            kicker="Fraud"
            figure={fraud.figure}
            against="of reported incidents, Q2"
            line={<>&ldquo;{fraud.sources[0].quoted}&rdquo;</>}
            habit={<>&ldquo;{quote(21).quoted}&rdquo;</>}
            sources={[...fraud.sources, quote(21)]}
          />
        </StickyPanel>
      </div>

      {/* 8. Winter band: bigger type, taller photo, truck kept in frame. */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <img
          src={asset("/media/p1-winter-highway-truck.webp")}
          alt=""
          aria-hidden="true"
          // object-position keeps the truck itself in frame rather than
          // centring on empty road and sky.
          className="photo absolute inset-0 h-full w-full object-cover object-[50%_38%] opacity-40"
          loading="lazy"
        />
        <div className="on-dark relative mx-auto flex min-h-[78vh] max-w-[82rem] flex-col justify-center px-4 py-32 sm:px-6 lg:px-10">
          <p className="marker">Winter</p>
          <p className="figure mt-6 text-[clamp(3.5rem,11vw,9rem)] leading-[0.85]">
            {otri25.figure}
          </p>
          <p className="mt-6 max-w-[22ch] text-[clamp(1.5rem,3.4vw,2.5rem)] leading-[1.15]">
            Winter storms pushed tender rejections up in early January 2025.
          </p>
          <p className="source mt-6">
            FreightWaves, OTRI, Jan 18, 2025 · January 2024 moved {otri24.figure}
          </p>
          <div className="mt-10">
            <Link href="/winter/" className="btn">
              Plan winter loads
            </Link>
          </div>
        </div>
      </section>

      {/* Calculator. */}
      <Section id="calculator" tone="surface">
        <SectionHead
          title="What rejections cost your network"
          lede="Your numbers, not ours. Nothing here is an Uber Freight figure."
        />
        <div className="mt-12">
          <RejectionCalculator acceptanceNow={ACCEPTANCE_NOW} bandLow={BAND_LOW} bandHigh={BAND_HIGH} />
        </div>
      </Section>

      {/* 9. In their words, as a carousel. */}
      <Section>
        <SectionHead title="In their words" />
        <div className="mt-12">
          <QuoteCarousel quotes={carouselQuotes} />
        </div>
      </Section>

      {/* Dark closing band. */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <img
          src={asset("/media/p9-closing-band-aerial-terminal.webp")}
          alt=""
          aria-hidden="true"
          className="photo absolute inset-0 h-full w-full object-cover opacity-35"
          loading="lazy"
        />
        <div className="on-dark relative mx-auto max-w-[82rem] px-4 py-28 sm:px-6 lg:px-10">
          <p className="display display-lg max-w-[18ch]">Which winter loads need heat?</p>
          <p className="mt-5 max-w-[46ch] text-white/75">
            The same question, answered from 10 winters of station records instead of a calendar.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/winter/" className="btn">
              Winter Load Readiness
            </Link>
            <Link href="/method/" className="btn">
              Method &amp; SQL
            </Link>
          </div>
          <p className="source mt-12">
            Detention figures are industry-wide (ATRI, 2023), not Uber Freight figures.
          </p>
        </div>
      </section>
    </>
  );
}

function ProblemPanel({
  n,
  kicker,
  figure,
  against,
  line,
  habit,
  sources,
  tone = "dark",
}: {
  n: string;
  kicker: string;
  figure: string;
  against: string;
  line: ReactNode;
  habit: ReactNode;
  sources: SourceRow[];
  tone?: "dark" | "light";
}) {
  const muted = tone === "dark" ? "text-white/60" : "text-quiet";
  return (
    <div className="grid w-full gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:gap-16">
      <div>
        <p className={`marker ${muted}`}>
          {n} · {kicker}
        </p>
        <p className={`marker mt-6 ${muted}`}>The problem</p>
        <p className="figure mt-3 text-[clamp(3.5rem,10vw,7rem)] leading-[0.85]">{figure}</p>
        <p className={`mt-3 text-sm ${muted}`}>{against}</p>
      </div>

      <div>
        <p className="text-[clamp(1.125rem,2vw,1.5rem)] leading-snug">{line}</p>
        <div className="mt-8 border-t border-current/20 pt-5">
          <p className={`marker ${muted}`}>The fix</p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed">{habit}</p>
        </div>
        <div className="source mt-6">
          <Source rows={sources} />
        </div>
      </div>
    </div>
  );
}
