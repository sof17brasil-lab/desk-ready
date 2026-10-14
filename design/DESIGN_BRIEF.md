# Design brief

## Quality bar and audience
Build it like a $10,000 agency site made for hiring managers and a logistics director: elegant, animated, professional, every chart polished. Use the frontend-design and ui-ux-pro-max skills (see SETUP_SKILLS.md) for every design decision.

## Colors (FINAL, overrides every other color note in this file)
Black, white, and greys only, in the spirit of the Uber brand (no Uber logo, wordmark, or proprietary font).
- Black #000000 (headlines, key numbers, dark panels), white #FFFFFF (page), greys #F6F6F6, #E2E2E2, #AFAFAF, #6B6B6B, #333333.
- Charts are monochrome: data in black and grey ramps; the one thing to look at is solid black, everything else grey. "Rare but severe" = black outline. No hues.
- Font: Inter (free; Uber Move is proprietary). Tight tracking on big headlines, tabular figures for numbers.
- The color screenshot, if Sofia adds one, is for layout and spacing only.

## Feel
Style reference: https://mvplogistics.eu/en/main-en/ (a European freight company site). Match its structure and mood as closely as possible: corporate, clean, reassuring, cinematic hero, generous spacing, numbered sections, big confident headlines. Content stays ours: numbers first, words second.

## What to take from the reference (layout and style only)
- **Hero:** REPLACED by Sofia's choice: a white hero with the title and a tank truck driving through it (component 1 below). Keep the reference's very large headline and a small "01 / 06" section counter in the corner.
- **Numbered sections and cards:** every section and card carries a number (01, 02 ...), like the reference's numbered service cards.
- **Advantages-style grid:** short bold heading plus one line per tile. We use it for the four problem cards and the stat tiles.
- **Marquee band:** a thin repeating line of text across the page (the reference repeats "Over 20 years on the market"). We repeat real figures, for example "78% first-tender acceptance · 39.3% of stops detained · 7 to 10 day bulk lead time".
- **Dark closing band before the footer** with a second background media, then a dark footer with link columns and a "Back to top" link.
- **Menu:** text mark left, links right, one outlined button, collapsible menu on phones.
- **Preloader:** skip it. It slows the page.

## What NOT to take (legal and honesty)
- Do not copy their logo, name, wording, photos, videos, icons, or code. Inspiration only.
- No partner or client logos section (we have no clients). Replace it with a "Sources" strip: names of the public sources, as plain text.
- No contact form collecting data. Use a "Contact Sofia" mailto link and her GitHub.

## Before building (Phase 3, step 0)
Open the reference site in a browser. Write down in notes.md: its main colors (hex), fonts, heading sizes, section spacing, button style, and motion. Build our site with the same feel using free fonts and our own colors and media. If Sofia adds screenshots to screenshots/reference/, match those.

## Rules
- Max 25 words of body text per section. Let numbers and charts carry it.
- Every number: big figure, short label, and a small grey source line with sample size (for example "NOAA GHCN-Daily · 15 stations · 10 winters each").
- Every number comes from web/public/data/*.json. Show "n" whenever a number rests on a subset.
- One idea per screen. Generous white space.

## Look
- Colors: the reference's palette family (record it in notes.md first). Keep two data colors on top: a cold blue for "risk" marks and an amber for "rare but severe". Text contrast at least 4.5:1, including on the dark overlay.
- Fonts: the closest free Google Fonts to the reference's headline and body fonts. Big numbers 56 to 72 px, tabular figures.
- Media: only the files in design/MEDIA_LIST.md (the tank-truck drawing plus 9 free-license photos). No video.
- Grid: 12 columns desktop, single column on phones, 16 px side margins.
- Motion: subtle, like the reference. Numbers count up once on scroll; sections fade and rise 12 px in 300 ms; the marquee scrolls slowly. All off with prefers-reduced-motion.
- No Uber, Uber Freight, Master Builders, or reference-site logos. Text mark "Desk Ready" top left.
- Colors: Sofia will add a screenshot at screenshots/reference/clean-look.png. Use its colors exactly; it overrides the palette notes above.
- Page weight: under 1.5 MB per page excluding fonts.

## Page flow with Sofia's four components
Source code: design/components/COMPONENT_PROMPTS.md. Install each into web/components/ui/. Replace every demo text, image, and emoji.

### Home ( / ) · Why carriers say no
1. **Truck intro** = `hero-section-3.tsx` (ScrollFlyIn). White background. Eyebrow `Desk Ready · Sofia Mota`, headline `Why carriers say no`. Image = /media/hero-truck-branded.webp (Sofia's own top-view truck image, as she made it, with its Uber Freight markings; her decision, Oct 13, 2026) driving left to right across the title as you scroll. Show it at no more than about 2x its 733 px width so it stays sharp. Small credit under the hero: "Truck image: Sofia Mota". Backups: hero-truck-unbranded.webp, truck-top-view.svg. Fix the `window.innerWidth` render bug.
2. **Four problem panels** = `smooth-scroll.tsx` (Lenis + sticky full-screen sections stacking over each other). One panel per problem from design/BRIEF_CONTENT.md: `01 · 78%`, `02 · 7 to 10 days`, `03 · 39.3%`, `04 · 25.6%`. Each panel: number, one line, the desk habit, source line. Keep the grid background; use the screenshot colors, alternating dark and light.
3. **Marquee band** of real figures (reference site style).
4. **Winter band** with p1-winter-highway-truck and the button `Plan winter loads →`.
5. **Calculator** "What rejections cost your network".
6. Dark closing band (p9-closing-band-aerial-terminal), footer.

### Winter ( /winter ) · Winter Load Readiness
1. Short white header (same style as home, no truck animation).
2. **01 · The rule on the drum** = `horizontal-feature-reveal.tsx` (GSAP, horizontal scroll). Three cards: "Drums and totes · 55 and 275 gal" (p2-steel-drums), "Bulk · tank truck" (p4-bulk-tank-trailer), "Every load starts at a dock" (p9-closing-band-aerial-terminal). Each card: packaging, the product rules (31 °F, 32 °F, 40 °F from products.csv), source line. SplitText titles. Rail is named in text only.
3. **02 to 05**: charts and the load check, as specified above.
4. **06 · Desk playbook** = `stacking-cards.tsx`. Three cards that stack as you scroll: Before booking (p1-winter-highway-truck), Cold snap in transit (p7-cold-snap-street), Arrived cold (p8-arrived-cold). Each with a short checklist and a collapsible email template.
5. Solid black closing band (no photo), footer.

### Method ( /method )
No animation. Plain, readable: Data, Rules, SQL, Numbers ledger, Limits, Credits ("Truck image: Sofia Mota. Photos: Unsplash.").

### Chart inventory (all from real data; every chart has a source line and n)
Home:
1. 78% vs 90 to 94%: one horizontal bar against a grey band (SOURCES 19, 20).
2. Winter rejection jump: two small before/after bars, Jan 2024 4.2% to 5.4% and Jan 2025 6.6% to 8.7% (SOURCES 32).
3. Detention: 39.3% of stops as a 100-square grid (SOURCES 27).
4. Calculator outputs as three animated big numbers.
Winter:
5. Then vs now dumbbell chart by city (risk days per winter).
6. City x week heat map with threshold slider; calendar-rule vs data-rule weeks update live.
7. Coldest-day strips per winter for "rare but severe" cities.
8. Load check result card.
Method:
9. Numbers ledger table, SQL vs pandas.
Do not add charts whose numbers are not in web/public/data or SOURCES.md.

### Motion budget
- One heavy effect per screen. On phones: keep the truck and stacking cards, turn the horizontal reveal into a normal vertical list.
- prefers-reduced-motion: no truck movement (show it parked under the title), no smooth scroll, no pinning; everything as a normal page.


## Site map
- **index.html · Why carriers say no** (the brief). Content locked in design/BRIEF_CONTENT.md.
- **winter.html · Winter Load Readiness** (the tool).
- **method.html · Method & SQL**.
Top nav on every page: `Why carriers say no` · `Winter loads` · `Method & SQL`. Small text mark `Desk Ready · Sofia Mota` top left.

## Page 1: Why carriers say no (index.html)
Layout, top to bottom, one idea per screen:
1. Hero: title, subhead, giant **78%** with a faint marker band at 90 to 94%.
2. Four cards in a 2x2 grid on desktop, stacked on phones. Each card: number (top, 48 px), one line, then a "Desk habit" row with a small check icon. Source line at the bottom of each card.
3. Winter strip: thin full-width band, one line with the 6.6% to 8.7% jump, button `Plan winter loads →`.
4. Calculator: inputs on the left, outputs on the right (stacked on phones). Outputs as three big numbers: rejected loads per week, extra cost per year, money back at target.
5. Footer with the detention-is-industry-wide note.

## Page 2: Winter Load Readiness (winter.html)

Section headings below are final. Use them as written.

**Header:** `Winter Load Readiness`
Subhead: `Which winter loads need heat, by city and week, from the last 10 winters of NOAA records.`
Tag under subhead: `A planning tool for the desk. Not a forecast, not a savings claim.`
Three stat tiles: stations analyzed (H1) · quality-checked days used (H8) · product storage rules checked (3).

**01 · The rule on the drum**
Three product cards, from data/reference/products.csv: product type, minimum storage temperature in big type (31 °F, 32 °F, 40 °F), the exact sheet words, packaging (drums, totes, bulk), source link.
One line under: Uber Freight's Greg Umstead quote (SOURCES row 1), attributed.

**02 · Warmer winters, same calendar**
The ONLY then-vs-now section. Everything after it uses the last 10 winters (2016 to 2025).
Big number: H2, median change in risk days per winter, then (1991 to 2000) vs now (2016 to 2025).
Chart: dumbbell chart, one row per city, then dot vs now dot for risk days per winter, sorted by "now". Product selector (31 / 32 / 40 °F rule).
Small line: H3 as a percentage of cities with fewer risk days.
Context line: Climate Central 76% fastest-warming season (SOURCES row 13).

**03 · Where heat is worth it**
Heat map: rows = cities, columns = 22 winter weeks (Nov 1 to Mar 31), cell = share of days that break the selected product's rule in the "now" window. Hover/tap shows share, days, winters.
Slider: weekly heat threshold (default from params, labeled "example threshold, set your own"). As it moves, recolor cells and update the two numbers below.
Two numbers side by side: calendar rule weeks heated (H4) vs data rule weeks heated (H5), and the share not needing heat (H6). These recompute live in the browser from weekly_risk.json; at the default threshold they must equal the ledger values.

**04 · Rare but severe**
Cities with low average risk but at least one very cold day in the "now" window (H7). Small multiples: per city, a strip of each winter's coldest day (season_coldest.json), with the product line drawn across.
One line: "Plan by the worst week, not the average."

**05 · Check a load**
Calculator (all inputs typed by the reader):
- Product rule (31 / 32 / 40 °F), origin, destination, ship week, transit days (1 to 5).
- Output: highest risk share among origin, destination, and (for 2+ day transit) the overnight city if chosen; a clear "Heat recommended / Watch / Not needed" result using the reader's threshold.
- Cost block (optional): heat charge per load (default = published LTL protect-from-freeze charge from data/reference/pff_tariffs.csv, labeled with carrier and date, if Phase 1 found one; otherwise blank), redelivery or rework cost. Shows expected cost without heat (risk share x cost) vs heat charge. Labeled "example inputs, replace with yours". No Uber numbers.
- Link: "Check the forecast before dispatch" to https://www.weather.gov/

**06 · Desk playbook**
Three cards, short checklist each:
1. Before booking: check the load in section 05; request heated or protect-from-freeze equipment early. Cite SOURCES row 3 (bulk lead time 7 to 10 days) and row 4 (48 to 72 hours lead time).
2. Cold snap in transit: confirm equipment and set point with the carrier, update the receiver, escalate if no heat.
3. Arrived cold: follow the product sheet's thaw words (SOURCES rows 8, 10, 11); never use "pressurized air" if the sheet says not to; document for the claim.
Each card ends with a short email template (subject + 3 lines), collapsible.

**Footer:** disclaimer from CLAUDE.md, links to Method & SQL and GitHub repo.

## Page 3: Method & SQL (method.html)
Headings: `Data` · `Rules` · `SQL` · `Numbers ledger` · `Limits`
- Data: table of sources with links and dates (NOAA, product sheets, tariffs, Uber Freight reports, ATRI, FreightWaves).
- Rules: season definition, quality filter, coverage rule, the two windows, risk rule per product, thresholds from params.json.
- SQL: the four files, syntax highlighted, collapsible, copied verbatim.
- Numbers ledger: the ledger table (metric, SQL value, pandas value, match).
- Limits (bullets): outdoor air, not trailer temperature · past winters, not a forecast · station = city airport, not the exact site · product rules differ, freezing does not always harm the product · not affiliated with Uber Freight or Master Builders Solutions.

## Performance
- Charts in SVG. One pinned chart library at most (for example d3@7.9.0 from cdnjs) or hand-written SVG.
- Test on a phone width of 390 px. No horizontal scrolling.
