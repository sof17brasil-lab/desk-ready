"""Independent pandas recomputation of the headline numbers.

This file does NOT read any table the SQL created. It starts again from the raw
NOAA files in data/raw/ghcn/ so that a mistake in the SQL cannot hide here too.
"""
import glob
import json
from pathlib import Path

import numpy as np
import pandas as pd


def load_raw(root: Path) -> pd.DataFrame:
    files = sorted(glob.glob(str(root / "data/raw/ghcn/*.csv*")))
    if not files:
        raise SystemExit("No NOAA files in data/raw/ghcn/. See data/README.md.")
    cols = ["station_id", "ymd", "element", "value", "mflag", "qflag", "sflag", "obs_time"]
    parts = []
    for f in files:
        df = pd.read_csv(f, header=None, names=cols, dtype=str, keep_default_na=False)
        parts.append(df[df["element"] == "TMIN"])
    return pd.concat(parts, ignore_index=True)


def headlines(root: Path) -> tuple[dict, dict]:
    """Return (values, n_stations): the headline value and sample size per metric."""
    params = json.loads((root / "config/params.json").read_text())
    products = pd.read_csv(root / "data/reference/products.csv")

    raw = load_raw(root)
    raw = raw[raw["qflag"].str.strip() == ""].copy()
    raw["v10c"] = pd.to_numeric(raw["value"], errors="coerce")
    raw = raw[raw["v10c"].notna() & (raw["v10c"] != -9999)].copy()
    raw["d"] = pd.to_datetime(raw["ymd"], format="%Y%m%d")
    raw = raw[raw["d"].dt.month.isin([11, 12, 1, 2, 3])].copy()

    raw["tmin_f"] = raw["v10c"] / 10.0 * 9 / 5 + 32
    m = raw["d"].dt.month
    raw["season"] = np.where(m >= 11, raw["d"].dt.year, raw["d"].dt.year - 1)
    start = pd.to_datetime(raw["season"].astype(str) + "-11-01")
    raw["season_week"] = ((raw["d"] - start).dt.days // 7) + 1

    # Season coverage
    cov = raw.groupby(["station_id", "season"]).size().rename("valid_days").reset_index()
    s0 = pd.to_datetime(cov["season"].astype(str) + "-11-01")
    s1 = pd.to_datetime((cov["season"] + 1).astype(str) + "-04-01")
    cov["coverage"] = cov["valid_days"] / (s1 - s0).dt.days
    good_seasons = cov[cov["coverage"] >= params["min_season_coverage"]][["station_id", "season"]]
    df = raw.merge(good_seasons, on=["station_id", "season"])

    def period(s):
        if params["then_first_season"] <= s <= params["then_last_season"]:
            return "then"
        if params["now_first_season"] <= s <= params["now_last_season"]:
            return "now"
        return None

    df["period"] = df["season"].map(period)
    df = df[df["period"].notna()].copy()

    # Eligibility is per metric family, not one list for the whole site.
    #   eligible_now       -> enough complete NOW winters. Drives the heat map,
    #                         H4 to H7, rare but severe, and the load check.
    #   eligible_then_now  -> enough complete winters in BOTH windows. Drives
    #                         then-vs-now only (H2, H3), which needs a baseline.
    # Denver International fails the second test: its record starts Nov 1994.
    n_seasons = df.groupby(["station_id", "period"])["season"].nunique().unstack()
    for col in ("then", "now"):
        if col not in n_seasons.columns:
            n_seasons[col] = 0
    n_seasons = n_seasons.fillna(0)
    need = params["min_valid_seasons_per_period"]
    eligible_now = n_seasons[n_seasons["now"] >= need].index
    eligible_then_now = n_seasons[(n_seasons["now"] >= need)
                                  & (n_seasons["then"] >= need)].index

    # Keep every NOW day for eligible_now stations, and THEN days only for the
    # stations that qualify for the comparison, so a partial baseline cannot
    # reach any number.
    df = df[df["station_id"].isin(eligible_now)
            & ((df["period"] == "now") | df["station_id"].isin(eligible_then_now))].copy()

    prod = products.set_index("product_id").loc[params["headline_product"]]
    if "<=" in prod["risk_rule"]:
        df["at_risk"] = df["tmin_f"] <= prod["min_safe_f"]
    else:
        df["at_risk"] = df["tmin_f"] < prod["min_safe_f"]

    spp = df.groupby(["station_id", "period"]).agg(
        n_seasons=("season", "nunique"),
        n_days=("d", "size"),
        risk_days=("at_risk", "sum"),
        coldest_f=("tmin_f", "min"),
    ).reset_index()
    spp["risk_share"] = spp["risk_days"] / spp["n_days"]
    spp["rdpw"] = spp["risk_days"] / spp["n_seasons"]

    piv = spp.pivot(index="station_id", columns="period", values="rdpw")
    piv = piv[piv.index.isin(eligible_then_now)]
    delta = (piv["now"] - piv["then"]).dropna()

    nowdays = df[df["period"] == "now"]
    thendays = df[df["period"] == "then"]
    wk = nowdays.groupby(["station_id", "season_week"])["at_risk"].mean()
    thr = params["weekly_heat_threshold"]

    now = spp[spp["period"] == "now"]
    rare = now[(now["risk_share"] < params["rare_share_max"])
               & (now["coldest_f"] <= params["severe_tmin_f"])]

    def days(frame):
        return float(frame[["station_id", "d"]].drop_duplicates().shape[0])

    # Days below 10 F in the now window. 10 F is the gate in Saia's published
    # Item 810 ("forecast to be 10 degrees Fahrenheit or higher"), so strictly
    # below 10 is where that service may not be offered. Recorded lows, not a
    # forecast. Product-independent: temperature only.
    severe = nowdays[["station_id", "season", "d", "tmin_f"]].drop_duplicates()
    sev = severe.groupby("station_id").agg(
        n_seasons=("season", "nunique"),
        n_days=("d", "size"),
        days_below_10f=("tmin_f", lambda s: int((s < 10).sum())),
        coldest_f=("tmin_f", "min"),
    )
    sev["days_below_10f_per_winter"] = sev["days_below_10f"] / sev["n_seasons"]

    return {
        "H1_stations_now_window": float(len(eligible_now)),
        "H1b_stations_then_vs_now": float(len(eligible_then_now)),
        "H2_median_change_risk_days_per_winter": float(delta.median()) if len(delta) else float("nan"),
        "H3_share_stations_fewer_risk_days": float((delta < 0).mean()) if len(delta) else float("nan"),
        "H4_calendar_rule_city_weeks": float(len(wk)),
        "H5_data_rule_city_weeks": float((wk >= thr).sum()),
        "H6_share_city_weeks_not_needing_heat": float(1 - (wk >= thr).mean()) if len(wk) else float("nan"),
        "H7_rare_but_severe_stations": float(len(rare)),
        "H8_station_days_used": days(df),
        "H9_station_days_now_window": days(nowdays),
        "H10_station_days_then_window": days(thendays),
        "H11_cities_any_day_below_10f": float((sev["days_below_10f"] > 0).sum()),
        "H11b_days_below_10f_total": float(sev["days_below_10f"].sum()),
    }, {
        "H1_stations_now_window": float(len(eligible_now)),
        "H1b_stations_then_vs_now": float(len(eligible_then_now)),
        "H2_median_change_risk_days_per_winter": float(len(delta)),
        "H3_share_stations_fewer_risk_days": float(len(delta)),
        "H4_calendar_rule_city_weeks": float(nowdays["station_id"].nunique()),
        "H5_data_rule_city_weeks": float(nowdays["station_id"].nunique()),
        "H6_share_city_weeks_not_needing_heat": float(nowdays["station_id"].nunique()),
        "H7_rare_but_severe_stations": float(len(eligible_now)),
        "H8_station_days_used": float(df["station_id"].nunique()),
        "H9_station_days_now_window": float(nowdays["station_id"].nunique()),
        "H10_station_days_then_window": float(thendays["station_id"].nunique()),
        "H11_cities_any_day_below_10f": float(len(sev)),
        "H11b_days_below_10f_total": float(len(sev)),
    }


if __name__ == "__main__":
    import sys
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
    vals, n_stations = headlines(root)
    for k, v in vals.items():
        print(f"{k}\t{v}\tn_stations={n_stations[k]:g}")
