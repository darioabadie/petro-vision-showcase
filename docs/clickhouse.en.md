# ClickHouse — analytics engine

*[Versión en español](clickhouse.md)*

**Scope:** why ClickHouse, how databases and tables are organized, which table engines are used, and how to connect and explore the data by hand.

ClickHouse is the project's only database. It runs in a single Docker container, locally, and is never exposed outside `127.0.0.1` — the public site never talks to it directly (see [`docker.en.md`](docker.en.md) and [`architecture.en.md`](architecture.en.md)).

## Why ClickHouse

- **Columnar engine**: aggregating 18M+ rows by month/operator/province runs in seconds, with no need to pre-aggregate in Python.
- **Open source and lightweight**: a single binary, a single container, no license or managed service — consistent with the portfolio scope (run everything on a laptop).
- **Mature `dbt-clickhouse`**: lets you model in dbt just like you would with Postgres/Snowflake/BigQuery, but on an engine built for this volume.
- **`ReplacingMergeTree`**: natively solves "the source published a revision of the same month" without manual upsert logic in Python.

## Databases

| Database | Who writes | Content |
|---|---|---|
| `raw_energy` | Ingestion pipeline (Python) | Raw tables from energy sources: `well_production` (S01), `wells` (S02). Immutable, with provenance metadata. |
| `raw_reference` | Ingestion pipeline (Phase 2) | National control series and Georef — not populated yet. |
| `raw_manual` | — (reserved) | Space for manual sources that don't come from automated ingestion. |
| `analytics` | dbt | Everything the exporter sees: staging (views), core (dimensions/facts), and marts. This is the `schema` configured in `dbt/profiles.yml`. |

`ensure_databases()` (`pipeline/src/pvm/ddl.py`) creates all four databases if they don't exist, every time `make ingest` runs. dbt is the only writer to `analytics` — the Python pipeline never writes there.

## Raw tables: physical design

Both raw tables (`well_production`, `wells`) share the same pattern, defined in `pipeline/src/pvm/ddl.py`:

```sql
CREATE TABLE raw_energy.well_production (
    idpozo Nullable(String), anio Nullable(String), ..., -- original columns, all String
    _load_id String,                    -- UUID of the ingestion run
    _source_url String,                 -- exact URL downloaded
    _resource_id LowCardinality(String),-- CKAN resource ID
    _resource_last_modified Nullable(DateTime64),
    _retrieved_at DateTime64,           -- when it was actually downloaded
    _source_sha256 FixedString(64),     -- checksum of the source file
    _row_number UInt64,                 -- position in the CSV
    _extra_payload Nullable(String)     -- unexpected new columns, without losing them
) ENGINE = MergeTree
PARTITION BY toYYYYMM(_retrieved_at)
ORDER BY (_resource_id, _source_sha256, _row_number)
```

The decisions behind this:

- **Every business column is `Nullable(String)` in raw.** Real typing (dates, floats) happens in `staging` in dbt, never during load. That way an unexpected value in a CSV doesn't break ingestion.
- **`PARTITION BY toYYYYMM(_retrieved_at)`**: partitions by *when it was downloaded*, not by the data's period. This lets you delete/reprocess a full run without touching earlier ones.
- **`ORDER BY (_resource_id, _source_sha256, _row_number)`**: the sort key includes the checksum — two downloads of the same resource with different content (a source revision) coexist as different rows, never overwriting each other. The full audit trail lives in raw; dbt resolves the "current" version in `core`.
- **`_extra_payload`**: if a source adds a column not covered by the DDL, it gets concatenated here instead of failing the load or silently dropping it.

## `analytics` tables: engines by layer

| Layer | Engine | Why |
|---|---|---|
| `staging.*` | `View` (dbt materialization) | No engine of its own — just a query over raw. |
| `dim_*` | `MergeTree` (plain table) | Rebuilt in full on every `dbt run`; no need for versioning. |
| `fact_well_monthly_production` | `ReplacingMergeTree(_record_version)`, `ORDER BY (well_id, month_date)`, `PARTITION BY toYear(month_date)` | Business grain `(well_id, month_date)`; if a month gets reprocessed, the row with the highest `_record_version` (`now64()` at build time) wins. |
| `mart_*` | `MergeTree` (plain table) | Final aggregates, rebuilt in full. |

`ReplacingMergeTree` doesn't dedupe at `INSERT` time: it does it in the background while merging parts, or when queried with `FINAL`. That's not an issue here because every model gets fully rebuilt (`+materialized: table` in `dbt_project.yml`) on each run — there are no incremental inserts yet that would depend on on-the-fly deduplication.

## Connection and credentials

These are all **local development** credentials, defined in `docker-compose.yml`, never used in an exposed environment:

| Protocol | Port | Who uses it |
|---|---|---|
| HTTP | `127.0.0.1:8123` | `clickhouse-connect` (Python: ingestion and exporter) |
| Native (TCP) | `127.0.0.1:9000` | dbt (`dbt-clickhouse`, `native` protocol in `profiles.yml`) |

User `default` / password `pvm_dev`. No port is published outside `localhost` (see [`docker.en.md`](docker.en.md#security)).

## Exploring the data by hand

```bash
# interactive client inside the container
docker compose exec clickhouse clickhouse-client

# or via HTTP with curl
curl 'http://127.0.0.1:8123/?query=SELECT+count()+FROM+raw_energy.well_production'
```

Useful queries to inspect the real state (the same ones `build_quality()` runs in the exporter):

```sql
-- raw rows loaded
SELECT count() FROM raw_energy.well_production;

-- duplicate business key in the fact (should be 0)
SELECT well_id, month_date, count() AS n
FROM analytics.fact_well_monthly_production
GROUP BY well_id, month_date
HAVING n > 1;

-- operators still without an approved alias
SELECT count() FROM analytics.dim_operator WHERE review_status = 'pending_review';

-- disk size per table
SELECT database, table, formatReadableSize(sum(bytes_on_disk)) AS size
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY sum(bytes_on_disk) DESC;
```

## Resetting state

```bash
make down                      # stops the container, keeps the ch_data volume
docker compose down -v         # stops the container AND deletes the volume (all raw data is lost)
make up                        # starts fresh; make ingest reloads raw
```

Deleting the volume is safe: everything in ClickHouse is reproducible from public sources via `make ingest && make dbt`. Nothing in ClickHouse is the only copy of anything — that's exactly why raw (rebuildable) is kept separate from `public/data/releases/` (the artifact versioned in Git).

## See also

- [`docker.en.md`](docker.en.md) — how (or whether) each component is containerized.
- [`dbt.en.md`](dbt.en.md) — what dbt transforms on top of these tables.
- [`MODELO_DE_DATOS.md`](MODELO_DE_DATOS.md) *(Spanish)* — full physical design and per-source type decisions (§17).
