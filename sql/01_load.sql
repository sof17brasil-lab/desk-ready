-- 01_load.sql
-- Load real NOAA GHCN-Daily station files (by_station format) and the reference tables.
-- File format (NOAA readme-by_station.txt): ID, YYYYMMDD, ELEMENT, DATA VALUE, M-FLAG, Q-FLAG, S-FLAG, OBS-TIME.
-- TMIN is "Minimum temperature (tenths of degrees C)" (NOAA ghcn daily readme.txt).
-- All columns are read as text so a header row, if present, cannot break the load; it is dropped by the ELEMENT filter.

CREATE OR REPLACE TABLE params AS
SELECT * FROM read_json_auto('config/params.json');

CREATE OR REPLACE TABLE products AS
SELECT * FROM read_csv('data/reference/products.csv', header = true, all_varchar = false);

CREATE OR REPLACE TABLE stations AS
SELECT * FROM read_csv('data/reference/stations_candidates.csv', header = true);

-- Published LTL protect-from-freezing charges, read from the saved rules tariffs.
-- Supplies the labeled example default for the winter calculator's heat charge and
-- the exact carrier wording shown next to it. See sources/SOURCES.md rows 33 to 40.
CREATE OR REPLACE TABLE pff_tariffs AS
SELECT * FROM read_csv('data/reference/pff_tariffs.csv', header = true, all_varchar = true);

CREATE OR REPLACE TABLE raw_tmin AS
SELECT
    column0 AS station_id,
    column1 AS ymd,
    column2 AS element,
    column3 AS value_txt,
    column5 AS qflag,
    filename AS source_file
FROM read_csv(
    'data/raw/ghcn/*.csv*',
    header = false,
    all_varchar = true,
    filename = true,
    columns = {
        'column0': 'VARCHAR', 'column1': 'VARCHAR', 'column2': 'VARCHAR', 'column3': 'VARCHAR',
        'column4': 'VARCHAR', 'column5': 'VARCHAR', 'column6': 'VARCHAR', 'column7': 'VARCHAR'
    }
)
WHERE column2 = 'TMIN';
