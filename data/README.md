# Data: what to download and where it goes

Everything here is real, public NOAA data. Nothing is made up. Do not edit raw files.

## 1. NOAA station list (1 file)

| Download | Save as |
|---|---|
| https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt | `data/raw/ghcnd-stations.txt` |

Used only to check that each station ID matches its city.

## 2. Daily temperature records, one file per station (15 files)

Pattern: `https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/<STATION_ID>.csv.gz`
Save each into `data/raw/ghcn/` with its original name (for example `USW00013739.csv.gz`). Do not unzip.

| City | Station ID (to be verified in Phase 1) | Link |
|---|---|---|
| Philadelphia, PA (origin, nearest to Exton) | USW00013739 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013739.csv.gz |
| New York, NY (LaGuardia) | USW00014732 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014732.csv.gz |
| Boston, MA | USW00014739 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz |
| Baltimore, MD | USW00093721 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00093721.csv.gz |
| Pittsburgh, PA | USW00094823 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00094823.csv.gz |
| Columbus, OH | USW00014821 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014821.csv.gz |
| Detroit, MI | USW00094847 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00094847.csv.gz |
| Chicago, IL (O'Hare) | USW00094846 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00094846.csv.gz |
| Minneapolis, MN | USW00014922 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014922.csv.gz |
| Denver, CO | USW00003017 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00003017.csv.gz |
| Charlotte, NC | USW00013881 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013881.csv.gz |
| Nashville, TN | USW00013897 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013897.csv.gz |
| Atlanta, GA | USW00013874 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00013874.csv.gz |
| Dallas-Fort Worth, TX | USW00003927 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00003927.csv.gz |
| Houston, TX (Intercontinental) | USW00012960 | https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00012960.csv.gz |

The station IDs are my best candidates and have NOT been checked against NOAA's list yet. Claude Code checks and fixes them in Phase 1. If one is wrong, Claude Code will give you the right link.

If a link doesn't open: go to https://www.ncei.noaa.gov/cdo-web/ , search the city, choose "Daily Summaries", and tell Claude Code; it will adjust the loader.

## File format (from NOAA's readme-by_station.txt)

Comma-separated, in this order: ID, YYYYMMDD date, ELEMENT, DATA VALUE, M-FLAG, Q-FLAG, S-FLAG, OBS-TIME.
- We use ELEMENT = `TMIN`, "Minimum temperature (tenths of degrees C)" (NOAA readme.txt).
- Q-FLAG blank means the value "did not fail any quality assurance check". Any other Q-FLAG is dropped.
- -9999 means missing and is dropped.

## Reference tables (already filled in, from public sources)

- `data/reference/products.csv`: storage rules copied word for word from three public product sheets. See sources/SOURCES.md.
- `data/reference/stations_candidates.csv`: the city list above.

## What ends up in data/raw

```
data/raw/
  ghcnd-stations.txt
  ghcn/
    USW00013739.csv.gz
    ... (15 files)
```
