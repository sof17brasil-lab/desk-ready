"use client";

/**
 * H12 — an illustrative arithmetic result, shown with its assumptions.
 *
 *   shipments x H6 (share of city-weeks the data rule would not heat)
 *             x the carrier's published Item 810 MINIMUM charge
 *
 * Two things this is not, and the page says so in words:
 *  - it is not an Uber Freight figure, and none is used to derive it. Both
 *    inputs are public: our own measured H6 and a published LTL rules tariff;
 *  - it is not a promise of savings. It is what the arithmetic gives if the
 *    stated assumptions hold.
 *
 * The shipment count is a reader input (CLAUDE.md rule 3: money figures live in
 * a calculator the reader drives). It starts at 100 so the default matches the
 * ledger's H12 exactly, and is labelled as an example to replace.
 */

import * as React from "react";

export interface TariffMinimum {
  carrier: string;
  item: string;
  minimum_charge: string;
  minimum_unit: string;
  effective_date: string;
  source_url: string;
}

const usd = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function IllustrativeSaving({
  h6,
  tariffs,
  ledger,
  thresholdPct,
}: {
  h6: number;
  tariffs: TariffMinimum[];
  ledger: { odfl: number; saia: number };
  thresholdPct: number;
}) {
  const [shipments, setShipments] = React.useState("100");
  const n = Number(shipments.replace(/[^0-9.]/g, ""));
  const valid = Number.isFinite(n) && n > 0;
  const atDefault = n === 100;

  return (
    <div className="bg-paper p-6 text-ink sm:p-8">
      <p className="marker">If you wanted to put a number on it</p>

      <div className="mt-5 max-w-xs">
        <label htmlFor="ill-shipments" className="block text-sm font-medium">
          Winter LTL shipments
        </label>
        <input
          id="ill-shipments"
          className="field mt-1.5"
          inputMode="numeric"
          value={shipments}
          onChange={(e) => setShipments(e.target.value)}
          aria-describedby="ill-help"
        />
        <p id="ill-help" className="source mt-1">
          Example input, replace with yours.
        </p>
      </div>

      <div className="mt-7 grid gap-7 sm:grid-cols-2" aria-live="polite">
        {tariffs.map((t) => {
          const min = Number(t.minimum_charge);
          const value = valid ? n * h6 * min : null;
          return (
            <div key={t.carrier}>
              <p className="figure text-[clamp(1.75rem,3.6vw,2.5rem)] leading-none">
                {value === null ? "—" : usd(value)}
              </p>
              <p className="mt-2 text-sm font-medium">
                {t.carrier.replace(" Freight Line", "")} Item {t.item} minimum, ${min.toFixed(2)}{" "}
                {t.minimum_unit}
              </p>
              <p className="source mt-1">
                {valid ? `${n} × ${(h6 * 100).toFixed(1)}% × $${min.toFixed(2)}` : "enter a number"}
                {" · "}
                <a href={t.source_url} target="_blank" rel="noopener noreferrer">
                  eff. {t.effective_date}
                </a>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 border-t border-line pt-5">
        <p className="marker">What has to be true for this to hold</p>
        <ul className="mt-3 space-y-2 text-[0.8125rem] leading-relaxed text-deep">
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-mute" />
            The shipments are spread <strong>evenly across the city-weeks analysed</strong>. A real
            lane mix is not even, and a network weighted towards Minneapolis or Denver would save
            nothing here: those cities heat all 22 weeks.
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-mute" />
            Every shipment would otherwise be billed the <strong>published minimum charge</strong>.
            The minimum only binds on light shipments — at Old Dominion&rsquo;s $3.50 per cwt it
            stops applying above roughly 1,286 lb, and a heavier shipment costs more than this.
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-mute" />
            You were buying protect-from-freezing on <strong>all</strong> of them to begin with.
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-mute" />
            The {thresholdPct}% weekly threshold is your own choice, not a measurement. Move the
            slider in section 03 and this moves with it.
          </li>
        </ul>

        <p className="source mt-5">
          Published LTL tariffs and our own measured share only.{" "}
          <strong>No Uber Freight figure is used or implied</strong>, and none is public. This is
          arithmetic under the assumptions above, not a forecast and not a promise of savings.
          {atDefault && (
            <>
              {" "}
              At 100 shipments these equal the ledger: H12 = {usd(ledger.odfl)}, H12b ={" "}
              {usd(ledger.saia)}.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
