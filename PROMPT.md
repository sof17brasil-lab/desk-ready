# Build prompt: Desk Ready (brief + winter tool)

Read CLAUDE.md, sources/SOURCES.md, data/README.md, config/params.json, design/DESIGN_BRIEF.md, and design/BRIEF_CONTENT.md first. Follow CLAUDE.md over anything else. Work in four phases. Stop at each checkpoint and wait for Sofia to say "go".

The site answers two questions:
1. **Why do carriers say no, and what does a specialist do about it?** (brief, measured numbers only)
2. **For a construction-chemicals shipper, which winter loads need heat?** (planning tool on NOAA data)

---

## Phase 1: Check the inputs

1. Confirm every file in START_HERE.md section 2 is in place. If Sofia asks you to, download missing NOAA files and direct-link PDFs yourself with curl into the exact paths listed there (download ghcnd-stations.txt first and verify the station IDs before downloading station files). Web pages that need Print > Save as PDF stay with Sofia. List anything still missing.
2. Verify each station ID in data/reference/stations_candidates.csv against NOAA's station list (data/raw/ghcnd-stations.txt, which Sofia downloads). The station name must match the city. Replace any wrong ID with the correct first-order airport station (ID starting with USW) and mark the row VERIFIED.
3. Peek at one raw file: confirm the 8 columns described in data/README.md, whether there is a header row, and that TMIN values look like tenths of degrees C.
4. Check sources/pdfs/ against the "PDFs to save" list in SOURCES.md.
5. Open the Old Dominion and Saia rules tariffs (SOURCES rows 33, 34). Find Item 810 (protect from freezing). Copy the exact charge, unit, and conditions into SOURCES.md and data/reference/pff_tariffs.csv (carrier, item, exact words, charge, unit, effective date, link). If a charge can't be read, say so; don't guess. These become the labeled example default for the winter calculator's heat charge, shown as "published LTL charge, [carrier], [date]".
6. Re-check every quote in design/BRIEF_CONTENT.md against its saved PDF.

**CHECKPOINT 1.** Report: files found and missing, station ID fixes, file format confirmed, PDFs missing, tariff charges found, any brief quote that changed. Wait for "go".

## Phase 2: Run the numbers

1. `pip install -r requirements.txt`, then `python pipeline/run_all.py`.
2. If any headline mismatches, find and fix the cause (do not loosen the tolerance). Rerun until all match.
3. Report in plain English, with sample sizes:
   - stations analyzed, winters per window, total station-days used
   - median change in risk days per winter, then (1991 to 2000 winters) vs now (2016 to 2025 winters)
   - share of calendar-rule city-weeks that the data rule would not heat (and the threshold used)
   - which cities are "rare but severe"
   - anything surprising, and any station with thin data
4. Flag any result that rests on few stations or few winters, and anything the site must not claim.

**CHECKPOINT 2.** Show the ledger table and the plain-English findings. Sofia may change params.json (thresholds, windows). Rerun after any change. Wait for "go".

## Phase 3: Build the site

Step 0a: confirm the frontend-design and ui-ux-pro-max skills are installed (SETUP_SKILLS.md); if not, stop and tell Sofia. Use both for all design work in this phase.

Step 0b: study the style reference as described in design/DESIGN_BRIEF.md and record its colors, fonts, and spacing in notes.md. Show Sofia that note before building.

Set up `web/` (Next.js + TypeScript + Tailwind + shadcn, static export for GitHub Pages). Install Sofia's four components from design/components/COMPONENT_PROMPTS.md into web/components/ui/ and wire them into the page flow in design/DESIGN_BRIEF.md. Use only the images in design/media/ (copy to web/public/media/, convert photos to WebP, max 1600 px), exactly as assigned in design/MEDIA_LIST.md.

Build three pages following design/DESIGN_BRIEF.md: / (the brief, content exactly from design/BRIEF_CONTENT.md), /winter (the tool), /method.
- The winter tool's recommendations use the "now" window (2016 to 2025 winters) only. Then vs now appears as one chart only.
- All numbers come from web/public/data/*.json. Nothing typed by hand. For the brief, write a small script that builds web/public/data/brief_facts.json from design/BRIEF_CONTENT.md and the matching SOURCES.md rows (number, exact words, source, date, link).
- Every chart and number has a source line and sample size.
- Footer disclaimer from CLAUDE.md on every page.
- The Method & SQL page shows the four SQL files (read from /sql at build time or copied verbatim by a script), the ledger table, the data sources, and the limits list.
- Test locally (`npm run build` then serve `web/out`) at desktop and phone widths. Take screenshots into screenshots/ and list them in notes.md.

**CHECKPOINT 3.** Send Sofia the local link and screenshots, plus a list of every outside fact used on the site with its SOURCES.md row. Wait for "go".

## Phase 4: Check, then publish

1. Fresh-eyes review before publishing (use a subagent if available; it has not seen the build):
   - Every number on the site matches web/public/data/*.json and the ledger.
   - Every quote matches SOURCES.md word for word.
   - No forbidden claims (CLAUDE.md list). No Uber or Master Builders logos. Footer present.
   - Page weight, phone layout, reduced motion, keyboard access, color contrast.
2. Fix what the review finds.
3. Create a public GitHub repo named `desk-ready` under Sofia's account (she is signed in to GitHub), push, add a GitHub Actions workflow that builds `web/` and deploys `web/out` to GitHub Pages, and turn Pages on. Give her the live URL.
4. Write README.md for the repo: one-line purpose, live link, how to rerun, sources, disclaimer.

**CHECKPOINT 4.** Send the live URL, the review results, and anything left open. Done.
