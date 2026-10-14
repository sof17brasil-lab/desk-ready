# Desk Ready: project rules

Independent portfolio project by Sofia Mota. Audience: the hiring manager and director for an Uber Freight Logistics Specialist II role (Exton, PA). Purpose, in two pieces on one site:
1. **Why carriers say no** (index.html): a one-page desk brief using only measured numbers from Uber Freight, ATRI, and FreightWaves. Proves she understands where the money goes.
2. **Winter Load Readiness** (winter.html): a planning tool on real NOAA data for a construction-chemicals shipper. Proves she can execute and analyze.
3. **Method & SQL** (method.html).

## How to work with Sofia
- Do all the SQL, Python, and site building yourself. No teaching, no quizzes.
- After each phase, give a short plain-English summary: what you did, what you found, with numbers and sample sizes. Bottom line first.
- Stop at each CHECKPOINT in PROMPT.md and wait for her "go".
- If something can't be done honestly, say so and propose the honest version.

## Data rules (non-negotiable)
1. Real, public, downloadable data only. Never invent, simulate, or "fill in" data. No synthetic rows anywhere in this repo.
2. Never estimate or invent Uber Freight's internal numbers (costs, volumes, margins, customers, savings).
3. Any money figure lives only in a calculator where the reader types their own inputs. Defaults in the calculator are labeled "example input, replace with yours".
4. Every outside fact on the site must appear in sources/SOURCES.md with link, exact words, date, and status. If it isn't there, it doesn't go on the site.
5. Quotes are copied word for word. If a source changed, update SOURCES.md and tell Sofia.
6. Every number on the site shows its sample size (stations, winters, days) when it comes from a subset.
7. Headline numbers are computed twice (SQL in sql/, separate pandas in pipeline/check_pandas.py). They must match in ledger/numbers_ledger.csv. If they don't, stop and fix; never publish a mismatch.
8. The site reads numbers only from web/public/data/*.json produced by pipeline/run_all.py. No numbers typed by hand into pages.

## Framing
- The winter tool is a planning tool a specialist would use. It makes NO savings claim. Its only money element is the reader-input calculator.
- The brief's dollar figures are industry-wide (ATRI) or reader inputs. Never present them as Uber Freight figures.

## Claims the data cannot support (never write these)
- That freezing costs Uber Freight or any competitor a specific amount. No public measurement exists.
- Uber Freight's cost per rejected load, margins, or volumes.
- That a specific load will freeze, or that a product "will be ruined". Product sheets differ: one says "Although freezing does not harm this product"; others only give thaw instructions.
- That Uber Freight lacks this capability. Say "a planning view a specialist could use", not "Uber's AI misses this".
- That Master Builders Solutions is an Uber Freight customer. It is not publicly confirmed. Refer to "a construction-chemicals shipper"; product sheets are cited as public examples.
- Trailer interior temperatures. We use outdoor daily minimum air temperature as a screening signal only.
- Forecasts. Long-term records describe past winters, not next week. Link to the National Weather Service for day-of decisions.
- Climate causation. We show what the station records say, then vs now. We do not attribute it.

## Brand and legal
- Visual style follows design/DESIGN_BRIEF.md: black, white, and grey like the Uber brand, layout ideas from mvplogistics.eu. Never copy that site's logo, text, images, video, or code. No Uber or Uber Freight logo or wordmark ANYWHERE EXCEPT the markings on Sofia's own hero truck image (her decision). Nothing else may look like official Uber material: no Uber logo in the nav, favicon, share image, or footer, and the independent-project disclaimer stays visible on every page.
- No Master Builders Solutions logos. Name products only as cited examples with links to their public sheets.
- Footer on every page: "Independent portfolio project by Sofia Mota. Not affiliated with, endorsed by, or using data from Uber Freight or Master Builders Solutions. Data: NOAA; published reports cited on each page."

## Tech
- Data: Python 3.11+, DuckDB, pandas (unchanged).
- Website: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui structure, in a `web/` folder. Static export (`output: "export"`, `images: { unoptimized: true }`, `basePath` = repo name) so it runs on GitHub Pages. Deploy with a GitHub Actions workflow.
- Sofia's four animated components are in design/components/COMPONENT_PROMPTS.md. Install them into `web/components/ui/` as written, then adapt (see design/DESIGN_BRIEF.md "Page flow"). Replace ALL demo text, demo images, and emojis with our content.
- Known fixes needed: hero-section-3 reads `window.innerWidth` during render, which breaks the static build; move it into a `useEffect`/state. Use one motion library (`motion`, the current name of framer-motion) for the hero and stacking cards; GSAP only for the horizontal reveal; Lenis for smooth scroll.
- Images: only files in `web/public/media/` listed in design/MEDIA_LIST.md with their license and credit. Do not hotlink. Do not invent Unsplash URLs; use the files Sofia downloads.
- Speed: under 1.5 MB per page excluding fonts; every photo WebP, max 1600 px wide, under 200 KB; JSON files under 500 KB each. Test on a phone.
- Respect prefers-reduced-motion: turn off the truck animation, smooth scroll, horizontal pinning, and card stacking, and show the content as a normal page.
- The `site/` folder from the earlier plan is replaced by `web/`. Pipeline exports go to `web/public/data/` instead of `site/data/`.

## Folder map
- data/raw/ghcn/ : NOAA files Sofia downloads (never edited)
- data/reference/ : products.csv (from public product sheets), stations_candidates.csv (IDs to verify)
- config/params.json : every adjustable choice in one place
- sql/ : 01_load, 02_clean, 03_metrics, 04_headlines (DuckDB)
- pipeline/ : run_all.py (runs everything), check_pandas.py (independent check)
- ledger/ : numbers_ledger.csv (SQL vs pandas)
- web/ : Next.js site. Pages: / (brief), /winter (tool), /method. web/public/data/ is generated, never hand-edited. web/public/media/ holds approved images
- sources/ : SOURCES.md and saved PDFs
- design/DESIGN_BRIEF.md (layout), design/BRIEF_CONTENT.md (locked brief numbers), notes.md, screenshots/
