-- 04_headlines.sql
-- The headline numbers. Each one is recomputed independently in pipeline/check_pandas.py
-- and must match before anything is exported to the website.
--
-- Every metric carries its own sample size, because the two metric families rest on
-- different station counts: then-vs-now needs a real baseline in both windows
-- (eligible_then_now), while the now-window numbers only need the now window
-- (eligible_now). See sql/02_clean.sql.

CREATE OR REPLACE TABLE headlines AS
WITH p AS (SELECT * FROM params),
hp AS (
    SELECT s.* FROM station_period_product s, p WHERE s.product_id = p.headline_product
),
change AS (
    SELECT n.station_id,
           n.risk_days_per_winter - t.risk_days_per_winter AS delta
    FROM hp n
    JOIN hp t ON t.station_id = n.station_id
    JOIN eligible_then_now e ON e.station_id = n.station_id
    WHERE n.period = 'now' AND t.period = 'then'
),
wk AS (
    SELECT w.* FROM weekly_risk w, p
    WHERE w.product_id = p.headline_product AND w.period = 'now'
),
now_hp AS (
    SELECT * FROM hp WHERE period = 'now'
)
SELECT 'H1_stations_now_window' AS metric_id,
       CAST(count(*) AS DOUBLE) AS value,
       CAST(count(*) AS DOUBLE) AS n_stations,
       'stations with enough complete winters in the now window; drives the heat map, H4 to H7, rare but severe, and the load check' AS basis
FROM eligible_now
UNION ALL
SELECT 'H1b_stations_then_vs_now',
       CAST(count(*) AS DOUBLE),
       CAST(count(*) AS DOUBLE),
       'stations with enough complete winters in BOTH windows; drives then-vs-now only'
FROM eligible_then_now
UNION ALL
SELECT 'H2_median_change_risk_days_per_winter',
       median(delta),
       CAST(count(*) AS DOUBLE),
       'median across stations, now minus then, headline product'
FROM change
UNION ALL
SELECT 'H3_share_stations_fewer_risk_days',
       avg(CASE WHEN delta < 0 THEN 1.0 ELSE 0.0 END),
       CAST(count(*) AS DOUBLE),
       'share of then-vs-now stations with fewer risk days now'
FROM change
UNION ALL
SELECT 'H4_calendar_rule_city_weeks',
       CAST(count(*) AS DOUBLE),
       CAST(count(DISTINCT station_id) AS DOUBLE),
       'every station-week Nov 1 to Mar 31, now window'
FROM wk
UNION ALL
SELECT 'H5_data_rule_city_weeks',
       CAST(sum(CASE WHEN risk_share >= (SELECT weekly_heat_threshold FROM p) THEN 1 ELSE 0 END) AS DOUBLE),
       CAST(count(DISTINCT station_id) AS DOUBLE),
       'station-weeks at or above the weekly heat threshold'
FROM wk
UNION ALL
SELECT 'H6_share_city_weeks_not_needing_heat',
       1 - sum(CASE WHEN risk_share >= (SELECT weekly_heat_threshold FROM p) THEN 1 ELSE 0 END) / count(*),
       CAST(count(DISTINCT station_id) AS DOUBLE),
       'share of calendar-rule weeks the data rule would not heat'
FROM wk
UNION ALL
SELECT 'H7_rare_but_severe_stations',
       CAST(count(*) AS DOUBLE),
       CAST((SELECT count(*) FROM eligible_now) AS DOUBLE),
       'now window: low risk share but at least one very cold day'
FROM now_hp, p
WHERE now_hp.risk_share < p.rare_share_max AND now_hp.coldest_f <= p.severe_tmin_f
UNION ALL
SELECT 'H8_station_days_used',
       CAST(count(DISTINCT (station_id, d)) AS DOUBLE),
       CAST(count(DISTINCT station_id) AS DOUBLE),
       'quality-checked winter days behind every number'
FROM risk_days
UNION ALL
SELECT 'H9_station_days_now_window',
       CAST(count(DISTINCT (station_id, d)) AS DOUBLE),
       CAST(count(DISTINCT station_id) AS DOUBLE),
       'quality-checked winter days in the now window'
FROM risk_days WHERE period = 'now'
UNION ALL
SELECT 'H10_station_days_then_window',
       CAST(count(DISTINCT (station_id, d)) AS DOUBLE),
       CAST(count(DISTINCT station_id) AS DOUBLE),
       'quality-checked winter days in the then window'
FROM risk_days WHERE period = 'then'
UNION ALL
SELECT 'H11_cities_any_day_below_10f',
       CAST(sum(CASE WHEN any_below_10f THEN 1 ELSE 0 END) AS DOUBLE),
       CAST(count(*) AS DOUBLE),
       'now window: cities with at least one recorded daily low below 10 F, the gate in Saia Item 810'
FROM severe_cold_now
UNION ALL
SELECT 'H11b_days_below_10f_total',
       CAST(sum(days_below_10f) AS DOUBLE),
       CAST(count(*) AS DOUBLE),
       'now window: total recorded days below 10 F across cities; checks the per-city table'
FROM severe_cold_now;
