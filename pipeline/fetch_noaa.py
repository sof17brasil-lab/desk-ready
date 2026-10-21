"""Download the 15 NOAA station files the pipeline reads.

The raw files are public and ~22 MB, so they are not committed; this fetches
them into data/raw/ghcn/ on a clean checkout. The deploy workflow runs it
before pipeline/run_all.py so the SQL-vs-pandas ledger gate still runs in CI.

Usage:  python pipeline/fetch_noaa.py
"""
import csv
import sys
import urllib.request
from pathlib import Path

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
OUT = ROOT / "data/raw/ghcn"
BASE = "https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = list(csv.DictReader((ROOT / "data/reference/stations_candidates.csv").open()))
    ids = [r["candidate_station_id"] for r in rows]
    if not ids:
        print("No station ids in data/reference/stations_candidates.csv")
        return 1

    missing = 0
    for sid in ids:
        dst = OUT / f"{sid}.csv.gz"
        if dst.exists() and dst.stat().st_size > 0:
            print(f"have  {dst.name}")
            continue
        url = f"{BASE}/{sid}.csv.gz"
        try:
            with urllib.request.urlopen(url, timeout=120) as r, dst.open("wb") as f:
                f.write(r.read())
            print(f"got   {dst.name}  {dst.stat().st_size / 1024:.0f} KB")
        except Exception as e:  # noqa: BLE001 - report and keep going
            print(f"FAIL  {sid}: {e}")
            missing += 1

    if missing:
        print(f"\n{missing} station file(s) could not be downloaded.")
        return 1
    print(f"\n{len(ids)} station files in {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
