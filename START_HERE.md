# Start here

## 1. Install on your computer (one time)

| # | What | Where | Check it worked |
|---|---|---|---|
| 1 | Python 3 | https://www.python.org/downloads/ | `python3 --version` (Windows: `python --version`) |
| 2 | Node.js, LTS version (v24 at the time of writing) | https://nodejs.org/en/download | `node --version` |
| 3 | Git | https://git-scm.com/downloads | `git --version` |
| 4 | Claude Code (needs a paid Claude plan: Pro, Max, Team, or Enterprise) | Mac: `curl -fsSL https://claude.ai/install.sh \| bash` · Windows PowerShell: `irm https://claude.ai/install.ps1 \| iex` · Guide: https://code.claude.com/docs/en/setup | `claude --version` |
| 5 | The two design skills | Follow SETUP_SKILLS.md | Type `/skills` in Claude Code |

You already have a GitHub account. Claude Code will ask you to log in to it when it publishes the site.

## 2. Download (put each file exactly where shown)

Tip: you can skip A and B and the direct links in C. In Phase 1, tell Claude Code "download them for me", and it will fetch them into these same places. You only need to save the five web pages in C yourself.

### A. NOAA station list (1 file) → `data/raw/`
| File | Link |
|---|---|
| `ghcnd-stations.txt` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt |

### B. NOAA daily weather, one file per city (15 files) → `data/raw/ghcn/`
Keep the original names. Do not unzip. The station IDs are checked against the station list in Phase 1. If a link says "Not Found", skip it and Claude Code will give you the corrected link.

| City | File | Link |
|---|---|---|
| Philadelphia, PA (nearest to Exton) | `USW00013739.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013739.csv.gz |
| New York, NY (LaGuardia) | `USW00014732.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014732.csv.gz |
| Boston, MA | `USW00014739.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz |
| Baltimore, MD | `USW00093721.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00093721.csv.gz |
| Pittsburgh, PA | `USW00094823.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00094823.csv.gz |
| Columbus, OH | `USW00014821.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014821.csv.gz |
| Detroit, MI | `USW00094847.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00094847.csv.gz |
| Chicago, IL (O'Hare) | `USW00094846.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00094846.csv.gz |
| Minneapolis, MN | `USW00014922.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014922.csv.gz |
| Denver, CO | `USW00003017.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00003017.csv.gz |
| Charlotte, NC | `USW00013881.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013881.csv.gz |
| Nashville, TN | `USW00013897.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013897.csv.gz |
| Atlanta, GA | `USW00013874.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013874.csv.gz |
| Dallas-Fort Worth, TX | `USW00003927.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00003927.csv.gz |
| Houston, TX (Intercontinental) | `USW00012960.csv.gz` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00012960.csv.gz |

### C. Source copies (13 files) → `sources/pdfs/`
Saved copies keep the site defensible if a page changes later.

Direct downloads (open the link, save the file under this name):
| # | Save as | Link |
|---|---|---|
| 1 | `UberFreight_Q3_Market_Update_Sept2026.pdf` | https://insights.uberfreight.com/hubfs/UberFreight_Market_Update_Report.pdf |
| 2 | `MasterAir_AE90_TDS.pdf` | https://assets.master-builders-solutions.com/en-us/mbs-masterair-ae-90-tds.pdf |
| 3 | `MasterSure_Z60_TDS.pdf` | https://assets.master-builders-solutions.com/en-us/mbs-mastersure-z-60-tds.pdf |
| 4 | `MasterPozzolith_80_TDS.pdf` | https://assets.master-builders-solutions.com/en-us/mbs-masterpozzolith-80-tds.pdf |
| 5 | `ODFL_100Q_tariff.pdf` | https://www.odfl.com/content/dam/odfl/us/en/documents/rates-and-tariffs/Complete%20ODFL%20100-Q%20Tariff.pdf |
| 6 | `Saia_170D_tariff.pdf` | https://assets.ctfassets.net/kjv8gs2ccggb/3Y5vAsxznsXornATV1AG5D/6b84a348d1a24f4338f8f954633e28de/Saia_170D_10212024.pdf |
| 7 | `NOAA_ghcnd_readme.txt` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/readme.txt |
| 8 | `NOAA_readme-by_station.txt` | https://www.ncei.noaa.gov/pub/data/ghcn/daily/readme-by_station.txt |

Web pages (open the link, then Print and choose Save as PDF):
| # | Save as | Link |
|---|---|---|
| 9 | `UberFreight_Q2_update_Jun2026.pdf` | https://www.uberfreight.com/en-US/blog/q2-freight-market-update-market-pressures-converge-and-create-urgency |
| 10 | `UberFreight_chemical_blog_Aug2025.pdf` | https://www.uberfreight.com/en-US/blog/building-smarter-chemical-supply-chains-with-rail-bulk-and-intermodal |
| 11 | `ATRI_detention_Sept2024.pdf` | https://truckingresearch.org/2024/09/new-research-documents-substantial-financial-and-safety-impacts-from-truck-driver-detention/ |
| 12 | `FreightWaves_winter_Jan2025.pdf` | https://www.freightwaves.com/news/winter-weather-has-been-more-disruptive-to-transportation-than-hurricanes |
| 13 | `ClimateCentral_winter_warming_Jan2026.pdf` | https://www.climatecentral.org/climate-matters/winter-warming-2026 |

### D. Photos
Nothing to download. All images are already in `design/media/` and `design/media/photos/`.

## 3. Open this folder in Claude Code and paste:

> Read CLAUDE.md and PROMPT.md, then start Phase 1. Stop at each checkpoint and give me a short plain-English summary with numbers and sample sizes. In Phase 3, use the ui-ux-pro-max and frontend-design skills to build a website worth $10k for hiring managers: elegant, animated, loaded with every chart in the design brief, very professional, in black, white, and grey like the Uber brand.

## 4. At each checkpoint
Read the summary, then reply "go" (or tell it what to change).
