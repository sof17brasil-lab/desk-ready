# Notes

## Style reference study: mvplogistics.eu (read 2026-10-13, Phase 3 step 0b)

Read by measuring computed styles in a browser, not by eye. Their type is fluid: the root
font-size is set from viewport width, so every size below is in **design units (u)**, where
1u = 1px at their reference width. The ratios are the real information.

**Colors (their hex)**
| Role | Hex | Count |
|---|---|---|
| Primary text, dark panels | `#1F1F61` deep navy | 215 text uses, 20 backgrounds |
| Light surface, buttons | `#F4F4F7` | 27 backgrounds |
| Page | `#FFFFFF` | 15 |
| Muted text | `#1F1F61` at 40%, white at 50% | — |
| Hairlines | `#1F1F61` at 15%, white at 15% | — |

Two colors carry the whole site: one deep navy and one near-white grey. No accent hue at all.
That is the single most useful thing about it, and it maps onto our monochrome rule exactly:
**their navy → our `#000000`, their `#F4F4F7` → our `#F6F6F6`.** Same structure, no hue.

**Fonts**
- Display: `BebasNeuePro` — condensed, weight 700, `text-transform: uppercase` on every
  heading and button. 534 elements.
- Body/UI: `Inter`, 45 elements. Letter-spacing: `normal` everywhere.

**Type scale (u)**
| Element | Size | Line-height | Case |
|---|---|---|---|
| Section title (H2) | 80u | 0.80 | upper |
| Section title, alt | 60u | 1.20 | upper |
| Hero H1 | 40u | 0.90 | upper |
| Card title (H3) | 40u | 0.85 | upper |
| Eyebrow | 15u | 1.20 | upper |
| Lead paragraph | 18u | 1.20 | sentence |
| Body | 16u | 1.00 | sentence |
| Button / nav | 20u (menu 14u) | — | upper |

Note the inversion: their **section titles (80u) are twice the hero H1 (40u)**. The page is
paced by giant section headings, not by one giant hero. Line-heights under 1.0 on the big type.

**Spacing** Section padding runs on a 40u / 50u / 80u rhythm — effectively a 40u base with an
80u step for major breaks.

**Buttons** `#F4F4F7` fill, navy text, hairline border the same colour as the fill, radius 5u,
60u horizontal padding, uppercase. One inverse variant: navy fill, white text.

**Motion** GSAP (`gsap`, `_gsap` on window). No Lenis, no AOS, no Swiper.

**Structure confirmed** The `01 / 06` section counter the design brief mentions is real. A
marquee band repeats "Over 20 years on the market". Nav is plain text links, no icons.

### What I am taking, and the two places I am deliberately not matching it

Taking: the two-value colour structure, the 40/80 spacing rhythm, giant section headings with
sub-1.0 line-height, the section counter, the marquee, the hairline-bordered button, GSAP.

**Not matching 1 — the condensed uppercase display face.** CLAUDE.md and DESIGN_BRIEF pin
**Inter**, and Uber's own brand voice is a neutral grotesque, not a condensed poster face.
Setting Inter in all-caps at 80u would read as an imitation of Bebas rather than a choice.
So: Inter throughout, tight tracking on the big sizes, headlines in **sentence case**, and
uppercase kept for the small structural markers only (section counter, eyebrows, nav).

**Not matching 2 — hue.** Theirs is navy. Ours is black, white and grey, per CLAUDE.md.

### Colour conflict inside DESIGN_BRIEF.md, and how I resolved it

The brief contradicts itself. Line 9 (in the block headed "Colors (FINAL, overrides every
other color note in this file)") says charts are monochrome, "No hues". Line 40 then says to
keep "a cold blue for risk marks and an amber for rare but severe".

I followed the FINAL block: **monochrome**. Three reasons. It says in its own text that it
overrides the other notes; CLAUDE.md and Sofia's build instruction both say black, white and
grey; and the amber was specified for "rare but severe", which Phase 2 returned as **zero
cities** and which is now reframed as "No lane is exempt". The case for the second hue has
gone. Risk is encoded by value (black = highest) plus a label, never by colour alone.

Line 46 also promises `screenshots/reference/clean-look.png` would override the palette.
That file does not exist, so there is nothing to override with.

## Screenshots
Save into screenshots/. One line each: file name, what it shows, date.

| File | What it shows | Date |
|---|---|---|
| | | |

## Decisions
| Date | Decision | Why |
|---|---|---|
| 2026-10-13 | Use NOAA daily station records (not the 1991-2020 normals files) | Lets us compare 1991-2000 winters with 2016-2025 winters from the same files |
| 2026-10-13 | Frame as "a construction-chemicals shipper" | Master Builders as the account is not publicly confirmed |
| 2026-10-13 | Product sheet links now point at `assets.ctfassets.net`, not `assets.master-builders-solutions.com` | Old asset host stopped accepting connections. Same documents (same DAT codes and revision dates), re-read word for word. See SOURCES.md Note A |
| 2026-10-13 | ODFL Item 810 ($3.50/cwt, min $45.00) is the labeled example default for the winter calculator's heat charge | Lower of the two published charges, and the simpler rule. Saia ($4.01 cwt, min $48.50) shown as the second reference |
| 2026-10-13 | Denver: keep DIA for the "now" window, leave it out of then-vs-now | DIA's record starts Nov 1994, so only 6 of 10 "then" seasons clear 90% coverage (params require 8). Sofia's call, option 1 |
| 2026-10-13 | Eligibility is per metric family, not one list for the site | `eligible_now` (8+ complete now winters) drives the heat map, H4-H7, rare but severe and the load check. `eligible_then_now` (8+ in both) drives then-vs-now only. A station with a short history is not dropped from numbers that do not need history. Same split implemented independently in SQL and check_pandas.py |
| 2026-10-13 | The ledger now checks sample size as well as value | The two metric families rest on different station counts, so a silent change there would change what a number means without changing the number |

## Phase 2 findings (run 2026-10-13, headline product pz80 = MasterPozzolith 80, risk day = TMIN <= 32 °F)

Sample: 15 stations for now-window numbers, 14 for then-vs-now (Denver excluded, see decisions).
43,862 quality-checked station-days — 22,680 now (15 stations x 10 winters) + 21,182 then (14 x 10).

- **Then vs now: every one of the 14 stations has fewer risk days now.** Median −7.45 risk days per
  winter. Range −13.3 (Chicago) to −2.9 (Charlotte). H3 = 1.00, which is unanimity, not a near-miss.
- **The data rule skips only 13.3% of calendar-rule city-weeks** (44 of 330, threshold 10%). That is a
  modest number and it is **concentrated**: Houston 17, Dallas-Fort Worth 9, Atlanta 9 — 35 of the 44.
  For Chicago, Detroit, Minneapolis, Denver, Pittsburgh, Columbus and Baltimore it skips **zero** weeks.
  Honest reading: a calendar rule is roughly right for a northern network. Its error is in southern
  lanes and in the shoulder weeks (week 1 = Nov 1-7, weeks 21-22 = late March).
- **"Rare but severe" returns zero cities** under rare_share_max = 0.05. The severity half passes for
  **all 15** stations: every city has had a day at or below 20 °F in the last 10 winters, including
  Houston (13.1 °F), Atlanta (8.2 °F) and Dallas-Fort Worth (−1.8 °F). No city is "rare" enough to
  clear the 5% gate. Houston misses by 0.004 (5.4% of winter days vs the < 5% rule).
- Thin data: Denver only (see decisions). Every other station has all 1,512-1,513 days in both windows.
- Week 22 is a short week by construction (Mar 28-31, or Mar 27-31 in leap seasons), so it holds 42
  station-days per city rather than 70. Shown with its day count wherever it appears.

## Phase 3 build notes

**Stack as built.** Next.js 16.4 (App Router) + TypeScript + Tailwind 4, static export with
`output: "export"`, `images.unoptimized`, `basePath` `/desk-ready` in production. Motion libraries
exactly as CLAUDE.md requires: `motion` for the hero truck and the stacking cards, GSAP only for
the horizontal reveal, Lenis for smooth scroll.

**Four things that needed fixing to work at all**, recorded so they are not re-introduced:
1. `hero-section-3.tsx` read `window.innerWidth` during render. Moved into state behind an effect
   with a resize listener; it also now parks the truck under the title for reduced motion, and the
   remote CDN `onError` fallback was replaced with a local file.
2. Tailwind 4 generated no utility classes: `create-next-app` wired `@tailwindcss/turbopack` but no
   PostCSS config, and automatic source detection from `app/globals.css` missed `components/` and
   `lib/`. Fixed with `postcss.config.mjs` + explicit `@source` lines.
3. My own custom classes beat Tailwind's utilities: `.btn { display: inline-flex }` has the same
   specificity as `.md\:hidden` and was defined later, so the phone Menu button showed on desktop.
   All custom classes now live in `@layer components`.
4. The GSAP horizontal reveal never pinned. Two causes: each card's sub-animation took its
   `containerAnimation` from `ScrollTrigger.getAll()[0]`, which is whichever trigger registered
   first globally, and Lenis was driving the scroll while ScrollTrigger watched native scroll.
   Fixed by holding a direct reference to the horizontal tween, wiring Lenis into
   `ScrollTrigger.update` off the GSAP ticker with `autoRaf: false`, and waiting for the card
   images to load before measuring.

**Photos are converted to real greyscale**, not just CSS-filtered. MEDIA_LIST.md says every photo
displays in black and white, and dropping the chroma channels bought enough headroom to keep all
six under the 200 KB budget at good quality. The CSS `filter: grayscale(1)` stays as a guard.

**brief_facts.json asserts, it does not trust.** Each display figure declares the SOURCES.md row it
comes from, and the build fails if that figure is not literally inside the row's exact words. So a
re-read that changes a source's wording stops the build instead of publishing a stale number.

## Open questions
- Ask Eden: does the Masterbuilders team plan winter protect-from-freeze loads, and how is it decided today?
- Which destination cities matter most for that account? Swap the city list if Eden shares anything.

## Interview talking points
- What I built, in one sentence:
- One number that surprised me:
- What I'd do in week one on the desk:
