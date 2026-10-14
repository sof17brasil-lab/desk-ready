"use client";

/**
 * "What rejections cost your network" (design/BRIEF_CONTENT.md).
 *
 * Every input is typed by the reader. There is no Uber Freight cost in here and
 * none is inferable from it: the extra cost per rejected load is whatever the
 * reader enters. Defaults are blank, and the two reference ticks on the
 * acceptance slider (78%, 90 to 94%) are published figures, labelled as such.
 */

import * as React from "react";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const usd = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RejectionCalculator({
  acceptanceNow,
  bandLow,
  bandHigh,
}: {
  acceptanceNow: number;
  bandLow: number;
  bandHigh: number;
}) {
  const [loads, setLoads] = React.useState("");
  const [current, setCurrent] = React.useState(String(acceptanceNow));
  const [target, setTarget] = React.useState(String(bandLow));
  const [cost, setCost] = React.useState("");

  const L = num(loads);
  const C = num(current);
  const T = num(target);
  const X = num(cost);

  const ready = L !== null && C !== null && X !== null && L > 0 && X >= 0;
  const rejectedNow = ready ? L * (1 - C / 100) : null;
  const weekly = ready ? rejectedNow! * X : null;
  const yearly = weekly !== null ? weekly * 52 : null;
  const recoverable =
    ready && T !== null && T > C ? ((T - C) / 100) * L * X * 52 : ready && T !== null ? 0 : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="rc-loads" className="block text-sm font-medium">
            Loads per week
          </label>
          <input
            id="rc-loads"
            className="field mt-1.5"
            inputMode="numeric"
            placeholder="your number"
            value={loads}
            onChange={(e) => setLoads(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="rc-current" className="block text-sm font-medium">
            Your first-tender acceptance rate
          </label>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              id="rc-current"
              type="range"
              min={50}
              max={100}
              step={1}
              value={C ?? acceptanceNow}
              onChange={(e) => setCurrent(e.target.value)}
              aria-describedby="rc-current-ticks"
            />
            <output className="figure w-16 shrink-0 text-right text-lg">{C ?? "—"}%</output>
          </div>
          <p id="rc-current-ticks" className="source mt-1">
            Reference ticks: {acceptanceNow}% Uber Freight network, Aug 2026 · {bandLow} to{" "}
            {bandHigh}% in the prior three years. Example input, replace with yours.
          </p>
        </div>

        <div>
          <label htmlFor="rc-target" className="block text-sm font-medium">
            Target acceptance rate
          </label>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              id="rc-target"
              type="range"
              min={50}
              max={100}
              step={1}
              value={T ?? bandLow}
              onChange={(e) => setTarget(e.target.value)}
            />
            <output className="figure w-16 shrink-0 text-right text-lg">{T ?? "—"}%</output>
          </div>
        </div>

        <div>
          <label htmlFor="rc-cost" className="block text-sm font-medium">
            Extra cost per rejected load
          </label>
          <input
            id="rc-cost"
            className="field mt-1.5"
            inputMode="decimal"
            placeholder="your number, in dollars"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            aria-describedby="rc-cost-help"
          />
          <p id="rc-cost-help" className="source mt-1">
            What a backup or spot carrier costs above the primary.
          </p>
        </div>
      </form>

      <div className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
        {!ready ? (
          <div className="flex h-full min-h-[14rem] items-center">
            <p className="max-w-[36ch] text-deep">
              Enter loads per week and a cost per rejected load to see the result. Nothing is
              pre-filled with a figure that is not yours.
            </p>
          </div>
        ) : (
          <div
            className="grid gap-8 sm:grid-cols-2"
            aria-live="polite"
          >
            <Out
              label="Rejected loads per week, now"
              value={rejectedNow!.toLocaleString("en-US", { maximumFractionDigits: 1 })}
              formula={`${L} × (1 − ${C}%)`}
            />
            <Out label="Extra cost per week" value={usd(weekly!)} formula="rejected × your cost" />
            <Out label="Extra cost per year" value={usd(yearly!)} formula="weekly × 52" />
            <Out
              label={`Money back at ${T}% acceptance`}
              value={recoverable !== null ? usd(recoverable) : "—"}
              formula={
                T !== null && T > (C ?? 0)
                  ? `(${T}% − ${C}%) × loads × cost × 52`
                  : "target is at or below your current rate"
              }
            />
          </div>
        )}

        <p className="source mt-10 max-w-[52ch] border-t border-line pt-4">
          Uses your inputs only. Uber Freight does not publish its cost per rejected load.
        </p>
      </div>
    </div>
  );
}

function Out({ label, value, formula }: { label: string; value: string; formula: string }) {
  return (
    <div>
      <p className="figure text-[clamp(1.75rem,3.4vw,2.5rem)] leading-none">{value}</p>
      <p className="mt-2 text-sm font-medium">{label}</p>
      <p className="source mt-1">{formula}</p>
    </div>
  );
}
