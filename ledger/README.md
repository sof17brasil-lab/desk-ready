# Numbers ledger

`numbers_ledger.csv` is written by `python pipeline/run_all.py`.

Each headline number is computed twice:
1. SQL (DuckDB): `sql/04_headlines.sql`
2. Separate pandas code starting again from the raw files: `pipeline/check_pandas.py`

They must match to within 0.000000001. If any row says `match = False`, the pipeline stops and nothing is exported to the website.

| ID | What it is |
|---|---|
| H1 | Stations with enough complete winters in both windows |
| H2 | Median change in risk days per winter, now minus then (headline product) |
| H3 | Share of stations with fewer risk days now |
| H4 | Calendar-rule city-weeks (every week Nov 1 to Mar 31) |
| H5 | Data-rule city-weeks (at or above the weekly heat threshold) |
| H6 | Share of calendar-rule weeks the data rule would not heat |
| H7 | "Rare but severe" stations |
| H8 | Quality-checked station-days behind every number |
