"use client";

/**
 * 06 · Desk playbook (DESIGN_BRIEF). Three stacking cards, each with a short
 * checklist and a collapsible email template.
 *
 * The "Cold snap in transit" card carries the Saia Item 810 condition in the
 * carrier's exact words: the published LTL service has a floor, which is a
 * thing to plan around rather than discover on the day.
 */

import * as React from "react";

import { EmailDialog, type EmailTemplate } from "@/components/winter/email-dialog";
import StackingCards, { StackingCardItem } from "@/components/ui/stacking-cards";

export interface PlaybookCard {
  n: string;
  title: string;
  image: string;
  checklist: React.ReactNode[];
  note?: React.ReactNode;
  email: EmailTemplate;
}

export function Playbook({ cards }: { cards: PlaybookCard[] }) {
  return (
    <StackingCards
      totalCards={cards.length}
      scaleMultiplier={0.04}
      className="relative"
      style={{ height: `${cards.length * 100}vh` }}
    >
      {cards.map((c, i) => (
        <StackingCardItem key={c.n} index={i} topPosition={`${6 + i * 3}%`} className="h-screen">
          <article className="mx-auto flex h-[82vh] w-full max-w-[72rem] overflow-hidden border border-line bg-paper shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
            <div className="hidden w-[34%] shrink-0 md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt=""
                aria-hidden="true"
                className="photo h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-7 sm:p-10">
              <p className="marker">{c.n}</p>
              <h3 className="display display-md mt-3">{c.title}</h3>

              <ul className="mt-6 space-y-3">
                {c.checklist.map((item, ii) => (
                  <li key={ii} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="mt-1 shrink-0"
                    >
                      <path
                        d="M2.5 8.5l3.5 3.5 7.5-8"
                        fill="none"
                        stroke="#000"
                        strokeWidth="1.8"
                        strokeLinecap="square"
                      />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {c.note && <div className="mt-6 border-l-2 border-ink bg-surface p-4">{c.note}</div>}

              <div className="mt-auto border-t border-line pt-5">
                <EmailDialog title={c.title} email={c.email} />
              </div>
            </div>
          </article>
        </StackingCardItem>
      ))}
    </StackingCards>
  );
}
