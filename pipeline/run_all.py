"""Run the full pipeline: SQL -> independent pandas check -> numbers ledger -> website data.

Usage (from the project folder):  python pipeline/run_all.py
Stops with an error, and exports nothing, if any headline number differs between SQL and pandas.
"""
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import duckdb
import pandas as pd

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_pandas import headlines as pandas_headlines  # noqa: E402

TOL = 1e-9
SQL_FILES = ["01_load.sql", "02_clean.sql", "03_metrics.sql", "04_headlines.sql"]


def run_sql(con):
    for name in SQL_FILES:
        con.execute((ROOT / "sql" / name).read_text())
        print(f"ran sql/{name}")


def same(a, b):
    if isinstance(a, float) and isinstance(b, float) and math.isnan(a) and math.isnan(b):
        return True
    return abs(a - b) <= TOL


def write_ledger(sql_vals, pd_vals, sql_n, pd_n, basis):
    """Compare both the value and its sample size, metric by metric.

    The sample size is checked too, because the two metric families rest on
    different station counts; a silent change there would change what a number
    means without changing the number.
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    rows, ok = [], True
    for k in sorted(set(sql_vals) | set(pd_vals)):
        s, p = sql_vals.get(k, float("nan")), pd_vals.get(k, float("nan"))
        sn, pn = sql_n.get(k, float("nan")), pd_n.get(k, float("nan"))
        value_match, n_match = same(s, p), same(sn, pn)
        match = value_match and n_match
        ok &= match
        rows.append({"metric_id": k, "sql_value": s, "pandas_value": p,
                     "abs_diff": (abs(s - p) if not (math.isnan(s) or math.isnan(p)) else None),
                     "value_match": value_match,
                     "sql_n_stations": sn, "pandas_n_stations": pn, "n_stations_match": n_match,
                     "match": match, "basis": basis.get(k, ""), "computed_at": now})
    pd.DataFrame(rows).to_csv(ROOT / "ledger/numbers_ledger.csv", index=False)
    return ok, rows


def export_site(con):
    out = ROOT / "web/public/data"
    out.mkdir(parents=True, exist_ok=True)
    tables = {
        "headlines": "SELECT * FROM headlines",
        "station_period_product": "SELECT * FROM station_period_product ORDER BY station_id, period, product_id",
        "weekly_risk": "SELECT * FROM weekly_risk ORDER BY station_id, period, product_id, season_week",
        "season_coldest": "SELECT * FROM season_coldest ORDER BY station_id, season",
        "station_eligibility": "SELECT * FROM station_eligibility ORDER BY station_id",
        "severe_cold_now": "SELECT * FROM severe_cold_now ORDER BY days_below_10f DESC, station_id",
        "stations": "SELECT * FROM stations",
        "products": "SELECT * FROM products",
        "pff_tariffs": "SELECT * FROM pff_tariffs ORDER BY carrier",
        "params": "SELECT * EXCLUDE (_notes) FROM params",
    }
    for name, q in tables.items():
        df = con.execute(q).df()
        (out / f"{name}.json").write_text(df.to_json(orient="records", double_precision=6))
    print(f"exported {len(tables)} files to web/public/data/")


def main():
    os.chdir(ROOT)
    con = duckdb.connect()
    run_sql(con)
    h = con.execute("SELECT metric_id, value, n_stations, basis FROM headlines").fetchall()
    f = lambda v: float(v) if v is not None else float("nan")
    sql_vals = {m: f(v) for m, v, _, _ in h}
    sql_n = {m: f(n) for m, _, n, _ in h}
    basis = {m: b for m, _, _, b in h}
    pd_vals, pd_n = pandas_headlines(ROOT)
    ok, rows = write_ledger(sql_vals, pd_vals, sql_n, pd_n, basis)
    for r in rows:
        flag = "OK " if r["match"] else "MISMATCH"
        print(f"{flag} {r['metric_id']}: sql={r['sql_value']} pandas={r['pandas_value']} "
              f"(n_stations sql={r['sql_n_stations']:g} pandas={r['pandas_n_stations']:g})")
    if not ok:
        print("\nLedger check FAILED. Nothing exported. Fix the cause before building the site.")
        sys.exit(1)
    export_site(con)
    # The brief page's quotes and figures come from SOURCES.md, not typed text.
    import build_brief_facts
    if build_brief_facts.main() != 0:
        print("\nbrief_facts build failed. Fix SOURCES.md before building the site.")
        sys.exit(1)
    print("\nLedger check passed: ledger/numbers_ledger.csv")


if __name__ == "__main__":
    main()
