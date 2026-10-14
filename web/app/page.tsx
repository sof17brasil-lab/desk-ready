import Link from "next/link";
import type { ReactNode } from "react";

import { AcceptanceBar, DetentionGrid, OtriJumps } from "@/components/charts/brief-charts";
import { RejectionCalculator } from "@/components/calculators/rejection-calculator";
import { Marquee, Quote, Section, SectionHead, Source, Stat } from "@/components/site/bits";
import { ScrollFlyIn } from "@/components/ui/hero-section-3";
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

export default function HomePage() {
  return (
    <>
      {/* 1. Truck intro. The one bold moment on the site: Sofia's own image
          driving across the title as you scroll. */}
      <ScrollFlyIn
        imageUrl={asset("/media/hero-truck-branded.webp")}
        fallbackImageUrl={asset("/media/hero-truck-unbranded.webp")}
        imageAlt="Top view of a tractor-trailer"
        className="border-b border-line"
      >
        <div className="mx-auto max-w-[82rem] px-4 sm:px-6 lg:px-10">
          <p className="marker">Desk Ready · Sofia Mota</p>
          <h1 className="display display-xl mt-5 max-w-[16ch]">Why carriers say no</h1>
          <p className="lede mt-6">
            Four measured problems in 2026 freight, and the desk habits that move each one.
          </p>

          <div className="mt-12 grid items-end gap-8 border-t border-line pt-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14">
            <Stat
              size="lg"
              figure={acceptanceNow.figure}
              label={acceptanceNow.label}
              source={<Source rows={acceptanceNow.sources} />}
            />
            <div className="pb-2">
              <AcceptanceBar now={78} bandLow={90} bandHigh={94} />
            </div>
          </div>

          <p className="source mt-8">Truck image: Sofia Mota</p>
        </div>
      </ScrollFlyIn>

      {/* 2. Four problem panels, stacking over each other. */}
      <div>
        <StickyPanel tone="dark">
          <ProblemPanel
            n="01"
            kicker="Rejected tenders"
            figure={acceptanceNow.figure}
            against={`vs ${acceptancePrior.figure}`}
            line={
              <>
                Rejected loads cost more as they{" "}
                <em className="not-italic underline decoration-white/30 underline-offset-4">
                  &ldquo;{quote(23).exact_words}&rdquo;
                </em>
                .
              </>
            }
            habit={<>Book early: &ldquo;{leadAsk.sources[0].exact_words}&rdquo;</>}
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
            line={<>&ldquo;{quote(5).exact_words}&rdquo;</>}
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
                hygiene &ldquo;{hygiene.sources[0].exact_words}&rdquo;
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
            line={<>&ldquo;{fraud.sources[0].exact_words}&rdquo;</>}
            habit={<>&ldquo;{quote(21).exact_words}&rdquo;</>}
            sources={[...fraud.sources, quote(21)]}
          />
        </StickyPanel>
      </div>

      {/* 3. Marquee of real figures. */}
      <Marquee
        items={[
          `${acceptanceNow.figure} first-tender acceptance`,
          `${detentionShare.figure} of stops detained`,
          `${bulkLead.figure} bulk lead time`,
          `${fraud.figure} ownership-change fraud`,
          `${hygiene.figure} swing in rate evaluations`,
        ]}
      />

      {/* 4. Winter band. */}
      <section className="relative isolate overflow-hidden bg-ink text-paper">
        <img
          src={asset("/media/p1-winter-highway-truck.webp")}
          alt=""
          aria-hidden="true"
          className="photo absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
        />
        <div className="on-dark relative mx-auto max-w-[82rem] px-4 py-24 sm:px-6 lg:px-10">
          <p className="marker text-white/60">Winter</p>
          <p className="display display-md mt-4 max-w-[26ch]">
            Winter storms pushed tender rejections from {otri25.figure} in early Jan 2025.
          </p>
          <p className="source mt-4 text-white/65">
            FreightWaves, OTRI, Jan 18, 2025 · Jan 2024 moved {otri24.figure}
          </p>
          <Link href="/winter/" className="btn mt-8">
            Plan winter loads
          </Link>
        </div>
      </section>

      {/* 5. Calculator. */}
      <Section id="calculator" tone="surface">
        <SectionHead
          index={5}
          total={6}
          title="What rejections cost your network"
          lede="Your numbers, not ours. Nothing here is an Uber Freight figure."
        />
        <div className="mt-12">
          <RejectionCalculator acceptanceNow={78} bandLow={90} bandHigh={94} />
        </div>
      </Section>

      {/* Context quotes. */}
      <Section>
        <SectionHead index={6} total={6} title="In their words" />
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <Quote row={quote(31)} />
          <Quote row={quote(25)} />
          <Quote row={quote(30)} />
          <Quote row={quote(1)} />
        </div>
      </Section>

      {/* 6. Dark closing band. */}
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
          <p className="source mt-12 text-white/55">
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
        <p className="figure mt-6 text-[clamp(3.5rem,10vw,7rem)] leading-[0.85]">{figure}</p>
        <p className={`mt-3 text-sm ${muted}`}>{against}</p>
      </div>

      <div>
        <p className="text-[clamp(1.125rem,2vw,1.5rem)] leading-snug">{line}</p>
        <div className="mt-8 border-t border-current/20 pt-5">
          <p className={`marker ${muted}`}>Desk habit</p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed">{habit}</p>
        </div>
        <div className={`source mt-6 ${tone === "dark" ? "text-white/55" : ""}`}>
          <Source rows={sources} />
        </div>
      </div>
    </div>
  );
}
