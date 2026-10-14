-- 02_clean.sql
-- Keep quality-checked winter days, convert to Fahrenheit, assign season and week, and keep complete seasons.
-- Quality rule: Q-FLAG blank = "did not fail any quality assurance check" (NOAA readme.txt). -9999 = missing.
-- Season = Nov 1 to Mar 31, labeled by its start year (2025 = Nov 2025 to Mar 2026).
-- Week 1 = Nov 1 to Nov 7. Week 22 is a short week (Mar 28 to Mar 31), so its day count is shown with it.

CREATE OR REPLACE TABLE season_days AS
WITH typed AS (
    SELECT
        station_id,
        strptime(ymd, '%Y%m%d')::DATE AS d,
        TRY_CAST(value_txt AS INTEGER) AS v10c
    FROM raw_tmin
    WHERE coalesce(trim(qflag), '') = ''
),
valid AS (
    SELECT * FROM typed
    WHERE v10c IS NOT NULL AND v10c <> -9999
      AND month(d) IN (11, 12, 1, 2, 3)
)
SELECT
    station_id,
    d,
    v10c,
    v10c / 10.0 * 9 / 5 + 32 AS tmin_f,
    CASE WHEN month(d) >= 11 THEN year(d) ELSE year(d) - 1 END AS season,
    CAST(floor(date_diff('day',
        make_date(CASE WHEN month(d) >= 11 THEN year(d) ELSE year(d) - 1 END, 11, 1), d) / 7) AS INTEGER) + 1 AS season_week
FROM valid;

CREATE OR REPLACE TABLE season_coverage AS
SELECT
    station_id,
    season,
    count(*) AS valid_days,
    date_diff('day', make_date(season, 11, 1), make_date(season + 1, 4, 1)) AS expected_days,
    count(*) / date_diff('day', make_date(season, 11, 1), make_date(season + 1, 4, 1)) AS coverage
FROM season_days
GROUP BY station_id, season;

-- Label the two comparison windows and keep only seasons with enough valid days.
CREATE OR REPLACE TABLE good_days AS
SELECT
    s.*,
    CASE
        WHEN s.season BETWEEN p.then_first_season AND p.then_last_season THEN 'then'
        WHEN s.season BETWEEN p.now_first_season  AND p.now_last_season  THEN 'now'
    END AS period
FROM season_days s
JOIN season_coverage c USING (station_id, season)
CROSS JOIN params p
WHERE c.coverage >= p.min_season_coverage
  AND (s.season BETWEEN p.then_first_season AND p.then_last_season
    OR s.season BETWEEN p.now_first_season  AND p.now_last_season);

-- How many complete seasons each station has in each window.
CREATE OR REPLACE TABLE season_counts AS
SELECT station_id, period, count(DISTINCT season) AS n_seasons
FROM good_days
GROUP BY station_id, period;

-- ELIGIBILITY IS PER METRIC FAMILY, not one list for the whole site.
--
-- eligible_now: enough complete winters in the NOW window. Drives every
-- now-window number: the heat map, H4 to H7, rare but severe, and the load
-- check. A short historical record is irrelevant to these, so it does not
-- disqualify a station here.
CREATE OR REPLACE TABLE eligible_now AS
SELECT sc.station_id
FROM season_counts sc CROSS JOIN params p
WHERE sc.period = 'now'
  AND sc.n_seasons >= p.min_valid_seasons_per_period;

-- eligible_then_now: enough complete winters in BOTH windows. Drives then-vs-now
-- only (H2, H3, the dumbbell chart), because that comparison needs a real
-- baseline. Denver International fails this: its record starts Nov 1994, so only
-- 6 of 10 'then' winters reach min_season_coverage.
CREATE OR REPLACE TABLE eligible_then_now AS
SELECT n.station_id
FROM season_counts n
JOIN season_counts t ON t.station_id = n.station_id AND t.period = 'then'
CROSS JOIN params p
WHERE n.period = 'now'
  AND n.n_seasons >= p.min_valid_seasons_per_period
  AND t.n_seasons >= p.min_valid_seasons_per_period;

-- One row per station-day-product: did this day break the product's storage rule?
-- Keeps every NOW day for eligible_now stations, and THEN days only for stations
-- that qualify for the comparison. A partial baseline therefore cannot reach any
-- chart or headline, even by mistake.
CREATE OR REPLACE TABLE risk_days AS
SELECT
    g.station_id, g.season, g.period, g.season_week, g.d, g.tmin_f,
    pr.product_id,
    CASE WHEN pr.risk_rule LIKE '%<=%' THEN g.tmin_f <= pr.min_safe_f
         ELSE g.tmin_f < pr.min_safe_f END AS at_risk
FROM good_days g
JOIN eligible_now USING (station_id)
LEFT JOIN eligible_then_now etn ON etn.station_id = g.station_id
CROSS JOIN products pr
WHERE g.period = 'now' OR etn.station_id IS NOT NULL;
