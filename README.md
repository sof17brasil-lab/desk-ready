# Desk Ready

A desk brief on why carriers reject loads, and a winter load planning tool built on 10 winters of
NOAA station records. Independent portfolio project by Sofia Mota.

**Live site:** _(added once GitHub Pages is on)_

## What is here

| Page | What it answers |
|---|---|
| `/` — Why carriers say no | Four measured problems in 2026 freight, and the desk habit that moves each one |
| `/winter` — Winter Load Readiness | Which winter loads need heat, by city and week |
| `/method` — Method & SQL | Every rule, the four SQL files, the numbers ledger, and the limits |

## How the numbers work

Every figure on the site is computed **twice**: once in DuckDB SQL (`sql/`) and once, independently,
in pandas (`pipeline/check_pandas.py`), which re-reads the raw NOAA files rather than any table the
SQL produced. The two runs are compared in `ledger/numbers_ledger.csv` on **both the value and its
sample size**. If any metric disagrees, `run_all.py` exits non-zero and exports nothing.

The site reads numbers only from `web/public/data/*.json`. Nothing is typed by hand into a page.

Quotes and figures on the brief page come from `sources/SOURCES.md` via
`pipeline/build_brief_facts.py`, which asserts that each displayed figure appears literally inside
the exact words of the source row it cites. If a source is re-read and its wording changes, the
build stops rather than publishing a number its own quote no longer supports.

### Sample

15 stations, 10 winters per window, **43,862 quality-checked station-days**. Station eligibility is
per metric family: a station needs 8+ complete winters in the *now* window for any now-window
number, and 8+ in *both* windows for the then-versus-now comparison, which needs a real baseline.
Denver International meets the first test but not the second — its record starts November 1994 —
so then-versus-now rests on 14 stations and everything else on 15. Each number on the site states
which.

## Rerunning it

```bash
pip install -r requirements.txt
python pipeline/run_all.py
```

That loads the NOAA files, runs the four SQL steps, runs the independent pandas check, writes the
ledger, and exports `web/public/data/*.json`. Then:

```bash
python pipeline/build_media.py
cd web && npm ci && npm run build
```

`web/out/` is the static site. To preview it locally:

```bash
python3 -m http.server 4321 --directory web/out
```

### Getting the raw data

The NOAA files are not committed. `data/README.md` lists the 15 station files and the station list;
they download from `https://www.ncei.noaa.gov/pub/data/ghcn/daily/`. Verify each station ID against
`ghcnd-stations.txt` before use.

## Sources

- **Weather:** NOAA GHCN-Daily, daily minimum temperature (TMIN), quality-flag filtered.
- **Product storage rules:** public technical data sheets for MasterAir AE 90, MasterPozzolith 80
  and MasterSure Z 60, cited as public examples.
- **Protect-from-freezing charges:** Old Dominion ODFL 100-Q and Saia 170-D published rules tariffs,
  Item 810.
- **Market figures:** Uber Freight Q2 and Q3 2026 market updates, ATRI driver detention research
  (Sept 2024), FreightWaves (Jan 2025), Climate Central (Jan 2026).

Every one is listed in `sources/SOURCES.md` with its link, exact words, date and status, and saved
to `sources/pdfs/`.

## Limits

Outdoor air temperature, not trailer interior. Past winters, not a forecast. A station is a city's
airport, not the exact dock. Product rules differ, and freezing does not always harm the product.
The weekly threshold is an assumption the reader can change, not a measurement. We show what the
records say; we do not attribute the change to any cause.

## Disclaimer

Independent portfolio project by Sofia Mota. Not affiliated with, endorsed by, or using data from
Uber Freight or Master Builders Solutions. Data: NOAA; published reports cited on each page.

No Uber Freight cost, volume, margin or savings figure appears anywhere on this site. None is
public. Every money figure is industry-wide (ATRI), a published carrier tariff, or typed in by the
reader.

Truck image: Sofia Mota. Photos: Unsplash.
