-- 03_metrics.sql
-- Station, week, and season summaries the website draws from. Every row carries its sample size.

-- in_then_now marks the stations that carry a real 'then' baseline, so the site
-- can label the sample size of each chart (then-vs-now vs now-only).
CREATE OR REPLACE TABLE station_period_product AS
SELECT
    r.station_id, r.period, r.product_id,
    count(DISTINCT r.season)                          AS n_seasons,
    count(*)                                          AS n_days,
    sum(CASE WHEN r.at_risk THEN 1 ELSE 0 END)        AS risk_days,
    sum(CASE WHEN r.at_risk THEN 1 ELSE 0 END) / count(*)                 AS risk_share,
    sum(CASE WHEN r.at_risk THEN 1 ELSE 0 END) / count(DISTINCT r.season) AS risk_days_per_winter,
    min(r.tmin_f)                                     AS coldest_f,
    (etn.station_id IS NOT NULL)                      AS in_then_now
FROM risk_days r
LEFT JOIN eligible_then_now etn ON etn.station_id = r.station_id
GROUP BY r.station_id, r.period, r.product_id, (etn.station_id IS NOT NULL);

CREATE OR REPLACE TABLE weekly_risk AS
SELECT
    station_id, period, product_id, season_week,
    count(*)                                        AS n_days,
    sum(CASE WHEN at_risk THEN 1 ELSE 0 END) / count(*) AS risk_share
FROM risk_days
GROUP BY station_id, period, product_id, season_week;

-- Coldest day of each winter, for the stations behind the now-window numbers.
-- Only seasons that are actually used appear here (see risk_days).
CREATE OR REPLACE TABLE season_coldest AS
SELECT
    r.station_id, r.season, r.period,
    min(r.tmin_f) AS coldest_f,
    count(DISTINCT r.d) AS n_days,
    (etn.station_id IS NOT NULL) AS in_then_now
FROM risk_days r
LEFT JOIN eligible_then_now etn ON etn.station_id = r.station_id
GROUP BY r.station_id, r.season, r.period, (etn.station_id IS NOT NULL);

-- Days below 10 °F in the now window, per station.
--
-- 10 °F is not our threshold: it is the gate in Saia's published Item 810, which
-- provides Protect from Freezing Service only when "Outside temperature is forecast
-- to be 10 degrees Fahrenheit or higher" (sources/SOURCES.md row 37). Strictly below
-- 10 °F is therefore the range where that published service may not be offered.
--
-- One difference the site must state: the tariff condition is written on a FORECAST,
-- while these are RECORDED daily lows. This is a planning signal about how often a
-- lane has run that cold, not a prediction of any future day.
-- Product-independent: it reads the temperature only.
CREATE OR REPLACE TABLE severe_cold_now AS
WITH now_days AS (
    SELECT DISTINCT g.station_id, g.season, g.d, g.tmin_f
    FROM good_days g
    JOIN eligible_now USING (station_id)
    WHERE g.period = 'now'
)
SELECT
    station_id,
    count(DISTINCT season)                                   AS n_seasons,
    count(*)                                                 AS n_days,
    sum(CASE WHEN tmin_f < 10 THEN 1 ELSE 0 END)             AS days_below_10f,
    sum(CASE WHEN tmin_f < 10 THEN 1 ELSE 0 END)
        / count(DISTINCT season)                             AS days_below_10f_per_winter,
    min(tmin_f)                                              AS coldest_f,
    (sum(CASE WHEN tmin_f < 10 THEN 1 ELSE 0 END) > 0)       AS any_below_10f
FROM now_days
GROUP BY station_id;

-- Station eligibility, exported so each page can state its own sample size.
CREATE OR REPLACE TABLE station_eligibility AS
SELECT
    s.station_id,
    (en.station_id  IS NOT NULL) AS eligible_now,
    (etn.station_id IS NOT NULL) AS eligible_then_now,
    coalesce(max(CASE WHEN sc.period = 'then' THEN sc.n_seasons END), 0) AS then_seasons,
    coalesce(max(CASE WHEN sc.period = 'now'  THEN sc.n_seasons END), 0) AS now_seasons
FROM (SELECT DISTINCT station_id FROM season_days) s
LEFT JOIN eligible_now        en  ON en.station_id  = s.station_id
LEFT JOIN eligible_then_now   etn ON etn.station_id = s.station_id
LEFT JOIN season_counts       sc  ON sc.station_id  = s.station_id
GROUP BY s.station_id, (en.station_id IS NOT NULL), (etn.station_id IS NOT NULL);
