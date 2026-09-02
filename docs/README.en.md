# Pulso Vaca Muerta — Project documentation

*[Versión en español](README.md)*

An open observatory of Argentine oil, gas, well, and productivity data, with an editorial focus on Vaca Muerta.

## Documents

- [PRD](PRD.md) *(Spanish)* — Requirements, scope, and acceptance criteria
- [Architecture](architecture.md) / [English](architecture.en.md) — Pipeline design, contracts, and publishing
- [Data model](MODELO_DE_DATOS.md) *(Spanish)* — Sources, schemas, layers, and tests
- [dbt](dbt.md) / [English](dbt.en.md) — How the transformation pipeline is modeled and tested
- [ClickHouse](clickhouse.md) / [English](clickhouse.en.md) — Databases, table engines, and how to explore the data
- [Docker](docker.md) / [English](docker.en.md) — What's containerized today and why
- [Data updates](actualizacion-datos.md) / [English](actualizacion-datos.en.md) — Full release cycle, from source to frontend
- [Lovable spec](lovable.md) *(Spanish)* — JSON contract, routes, and visual criteria
- [Samples](../data/samples/README.md) *(Spanish)* — Sampling methodology

## Project status — September 2, 2026

### Data pipeline (Phase 1 complete, Phase 2 in progress)

| Component | Status | Detail |
|---|---|---|
| ClickHouse | **Operational** | v24.8, Docker Compose, 18.2M raw rows |
| S01 ingestion (well production) | **Complete** | CKAN, checksums, idempotent load, technical metadata |
| S02 ingestion (wells) | **Complete** | `raw_energy.wells`, `stg_energy__wells`, `dim_well` — registry + coordinates available |
| S03 ingestion (fractures) | Pending | Phase 2 |
| S04 ingestion (trajectories) | Pending | Phase 2 |
| dbt: staging | **Complete** | `stg_energy__well_production`, `stg_energy__wells` (views) |
| dbt: core | **Complete** | `dim_date_month`, `dim_operator`, `dim_well`, `fact_well_monthly_production` |
| dbt: marts | **Complete** | `mart_argentina_monthly_production` (national series) |
| dbt: tests | **Complete** | declarative tests + 3 singular tests — all green |
| Export | **Complete** | app-data.json, CSV, latest.json, jsonschema validation |
| Operator aliases | **Partial** | Seed with ~30 grouped operators (`approved`); the rest (101) stay `pending_review` by design — see [`dbt.md`](dbt.md) |
| Real quality checks | **Complete** | 6 dynamic checks via ClickHouse queries (duplicates, nulls, negatives, future dates, pending aliases) |
| Join coverage (production ↔ registry) | **Complete** | `quality.join_coverage` reports the match against `dim_well` (`build_quality()`) |
| Cohorts | Pending | Phase 2 |
| Completions | Pending | Phase 2 |
| Ingestion/dbt/exporter Dockerfiles | Pending, scope already defined | Only ClickHouse is containerized; ingestion/dbt/export run via `uv run` — see [`docker.md`](docker.md) |

### Bugs fixed (2026-08-27)

- **dim_operator.sql**: ClickHouse returns empty strings instead of NULL on a LEFT JOIN against an empty seed table. Fix: `nullIf(a.operator_canonical, '')` + `coalesce` so that `operator_canonical` correctly falls back to `operator_raw` and `review_status` becomes `pending_review`.
- Verified: `dbt run` ✅, `dbt test` ✅, `export` ✅ (app-data + CSV + latest.json).

### Frontend (mockup → real data)

| Component | Status | Detail |
|---|---|---|
| TypeScript | **OK** | `tsc --noEmit` with no errors |
| Tests (vitest) | **OK** | 24/24 tests passing (5 files) |
| Build (Bun + Vite + Nitro) | **OK** | Full build with no errors |
| Real data consumption | **OK** | `is_mock=false`, banner disappears, KPIs and rankings show real data |
| Map (MapLibre) | **OK** | ~3,520 wells, read from `dim_well` (no longer parsing raw CSVs on every export) |
| Alternative tables on home | Pending | Only present in the explorer and cohorts view |
| Map clustering | Pending | Loads all features at once |
| Lighthouse / accessibility | Pending | No formal audit yet |

### Prioritized next steps

1. **S03/S04 ingestion (fractures and trajectories)** — enables completions and trajectories on the map.
2. **Cohorts and completions** — Phase 2 marts (`mart_well_cohort_curve`, `mart_completion_productivity`).
3. **Frontend polish** — alternative tables on home, map clustering, Lighthouse.

## Frontend

- An observatory-style app with routes: Summary, Production (explorer with URL filters), Operators (+ per-slug profile), Wells and cohorts, Fractures, Map, Quality, Methodology, Downloads, and period archive.
- Data is loaded client-side only via `src/lib/data-client.ts`. A provider (`src/lib/observatory-data.tsx`) exposes `loading | ready | error | schema-incompatible` states.
- The synthetic-data banner and the "Demo ·" prefix depend on `release.is_mock`. With real data (`is_mock=false`) they disappear automatically.

### Implementation notes

- **Basemap**: Esri World Dark Gray Canvas (`World_Dark_Gray_Base`) + `World_Boundaries_and_Places`. Free, no API key.
- **Recharts**: chart primitives must always sit inside the chart wrapper. A loose fragment directly under `<ResponsiveContainer>` throws `Invariant failed`.
- **MapLibre**: doesn't understand `oklch()`. Use the hex palette `PALETTE_HEX` / `SERIES_COLORS_HEX` from `src/lib/palette.ts`.
- The contract is validated against the major `schema_version`. Unknown versions throw `schema-incompatible`.
- Verification: `bun run typecheck`, `bun test` (vitest), `bun run build`.

## Pipeline

```bash
# Start ClickHouse
make up

# Full pipeline
make release    # ingest → dbt run → dbt test → export

# Or step by step
make ingest     # Download and load S01
make dbt        # Transformations
make dbt-test   # Quality tests
make export     # Generate the release in public/data/
```

## Reproducing the samples

```bash
python3 -m pvm.pipelines sample
```

URLs, checksums, and observed row counts are in [`data/samples/manifest.json`](../data/samples/manifest.json).
