# ETL Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el pipeline ETL end-to-end (ingesta S01–S07 → ClickHouse → dbt → marts → exporter) produciendo releases reales (`app-data.json`, GeoJSON, CSVs, `latest.json`) que cumplan el contrato del frontend, con cutover de la maqueta mock a datos reales.

**Architecture:** Corte vertical primero: S01 completo (2006–2026) → staging/core → mart Home → exporter → `app-data.json` → validación en el frontend con `is_mock=false`; después expansión a las 7 fuentes, los 8 marts, mapa/descargas y QA completo. ClickHouse en Docker; ingesta/dbt/exporter con `uv` local.

**Tech Stack:** ClickHouse (container), Python 3.12 + Polars + clickhouse-connect + jsonschema (uv), dbt-core + dbt-clickhouse, JSON Schema + ajv (vitest), Makefile.

## Global Constraints

- Contrato de datos = `contracts/*.schema.json` (fuente de verdad) + `src/lib/contract.ts` (leído); ambos deben coincidir (ajv en vitest).
- Schema version major `1`; release real con `schema_version: "1.0"`, `is_mock=false`, `status` listo `"complete"|"warning"`.
- Ruta pública del release: `public/data/releases/<release_id>/app-data.json`; puntero `public/data/latest.json` (`base_path` + `app_data_file`).
- Valores numéricos faltantes = `null`, no strings. Fechas ISO 8601 (primer día del mes). Período canónico fecha `Date` (primer día del mes).
- Clave `(well_id, month_date)` UNIQUE en `fact_well_monthly_production` (dbt test, bloquea).
- Unidades oficiales S01: petróleo/agua en m³, gas en miles de m³. No convertir gas.
- `idpozo` = pozo-formación. `is_vaca_muerta = normalized(formation) = 'VACA MUERTA'`.
- Decisiones provisorias §22 (spec) → visibles en `quality` y `methodology`.
- ClickHouse bindea solo `127.0.0.1`; credenciales de desarrollo local (no secretos reales). No exponer nada público.
- El flujo completo se dispara con `make release` y cada paso con su target (`ingest`, `dbt`, `export`).
- Verificación final: Playwright sobre `wrangler dev` (puerto 8787) → 12 rutas 200, 0 errores de consola, banner ausente con `is_mock=false`.

## Task 0.1 — Infra y workspace

**Files:**
- Create `docker-compose.yml` (ClickHouse `clickhouse/clickhouse-server:24.8`, ports `127.0.0.1:8123:8123` + `127.0.0.1:9000:9000`, env usuario `default`/pass `pvm_dev`, volume `ch_data`)
- Create `Makefile`: `up`, `down`, `ingest`, `dbt`, `export`, `release`, `test`, `preview`
- Create `pipeline/pyproject.toml` (uv; deps: polars, clickhouse-connect, jsonschema; dev: pytest, requests)
- Modify `.gitignore`: `pipeline/landing/`, `pipeline/history/`, `pipeline/.venv/`
- Create `pipeline/src/pvm/__init__.py` + `pipeline/src/pvm/config.py` (constantes: URLs CKAN, rutas landing/history, creds CH desde env con defaults dev)

**Verificación:** `docker compose config` valida; `cd pipeline && uv sync` instala; `make help` lista targets.

## Task 0.2 — Contratos JSON Schema + validación vitest

**Files:**
- Create `contracts/release.schema.json` (ReleasePointer)
- Create `contracts/observatory-data.schema.json` (payload completo mirror de `src/lib/contract.ts`)
- Create `src/lib/contract-schema.test.ts` (vitest; carga schemas + ajv; valida `public/data/latest.json` + `app-data.json` mock)
- Modify `package.json` devDeps: `ajv` (+ `ajv-formats`)

**Interfaces:** `ajv.compile(observatoryDataSchema)` → `validate(payload)`.
**Verificación:** `npm test` pasa con mock actual.

## Task 0.3 — Esqueleto dbt

**Files:**
- Create `dbt/dbt_project.yml` (name `pvm`, profile `pvm`, model paths staging/core/marts, seeds, tests)
- Create `dbt/profiles.yml` (target `local`: type clickhouse, host `127.0.0.1`, port 9000, user/pass dev) — leído desde `DBT_PROFILES_DIR` (definido en Makefile) y creds env
- Create `dbt/seeds/seed_operator_aliases.csv` (S07 provisorio: `operator_raw`, `operator_canonical`, `review_status`, `notes`)

**Verificación:** `dbt debug` conecta a ClickHouse (requiere container arriba).

## Task 1.1 — Catálogo + estado (catalog.py)

**Files:** Create `pipeline/src/pvm/catalog.py`, `pipeline/tests/test_catalog.py`
**Interfaces:**
- `fetch_package_show(package_id) -> dict` (descubre recursos S01 per año)
- `ResourceRecord = dict(reource_id, url, name, format, last_modified, bytes)`
- `list_annual_resources(year_from=2006, year_to=2026) -> list[ResourceRecord]` (solo CSV "Producción")
- `StateStore(state_dir) -> {load_state(), save_state()}` (manifest JSON local: `{url: {sha256, size, last_modified}}`)
**Tests pytest:** parseo de respuesta CKAN; filtro por año; persistencia de estado.

## Task 1.2 — Ingesta S01 → raw

**Files:** Create `pipeline/src/pvm/ingest.py`, `pipeline/tests/test_ingest.py`
**Interfaces:**
- `download(url, dest_path)` con reintentos (3), timeout 120s; lanza `DownloadError`
- `verify_csv(path) -> dict` (rechaza: HTML, vacío, headers fuera de allowlist esperada; devuelve `{headers, rows, sha256, size}`)
- `load_raw_resource(conn, rec, path, meta) `: inserta a `raw_energy.well_production` (MergeTree, metadata §11)
- `schema.well_production` columns (38 raw + 8 metadatas) según muestreo perfilado
**Tests pytest:** HTML rechazado; vacío rechazado; headers cambian = rechazo; DDJJ double-check con fixture de 3 filas reales 2026.
**Corrida:** `make ingest` carga 2006–2026 (verifica conteos por año vs MANIFEST anterior; primer run full).

## Task 1.3 — dbt staging/core S01

**Files:** Create under `dbt/models/staging/`: `stg_energy__well_production.sql`; `dbt/models/core/`: `dim_date_month.sql`, `dim_operator.sql`, `fact_well_monthly_production.sql`
**Interfaces (dbt refs):** `ref('raw_energy.well_production')`, `ref('seed_operator_aliases')`; columns del fact: `well_id, month_date, operator_sk, basin, area, field, formation, resource_type, resource_subtype, oil_m3, gas_thousand_m3, water_m3, productive_flag, is_partial, is_rectified` + `_record_version`
**Tests dbt:** UNIQUE `(well_id, month_date)`; not_null `well_id|month_date|oil_m3` válidos; valid year/month.
**Verificación:** `make dbt -- --select stg_energy__well_production fact_well_monthly_production` pasa.

## Task 1.4 — Mart Home

**Files:** `dbt/models/marts/mart_argentina_monthly_production.sql`
**Columns:** `month_date, oil_m3, gas_thousand_m3, water_m3, oil_conventional_m3, oil_nonconventional_m3, gas_conventional_thousand_m3, gas_nonconventional_thousand_m3, productive_wells, is_complete`
**Verificación:** `make dbt -- --select mart_argentina_monthly_production`.

## Task 1.5 — Exporter Fase 1 (app-data.json parcial)

**Files:** Create `pipeline/src/pvm/export.py`, `pipeline/src/pvm/shape.py`, `pipeline/tests/test_export.py`
**Interfaces:**
- `query_clickhouse(query)` (clickhouse-connect)
- `build_release_metadata(cutoff)`, `build_site()`, `build_filter_options()` (desde distinct dims)
- `build_home(rows) -> HomeData` (kpis con MoM/YoY en python)
- `build_quality_minimal(rows) -> QualityData` (estado provisorio real de S01)
- Secciones sin marts → placeholders válidos (arrays vacíos): `explorer`, `operators`, `cohorts`, `completions`, `map`, `downloads`; `methodology` estático; `release_history` = [release 2026-08]
- `write_release(release_id, payload)` → `public/data/releases/<id>/app-data.json`
**Tests pytest:** shape de cada sección contra `contracts/*.schema.json` (jsonschema py).

## Task 1.6 — Validación precoz del cutover

**Files:** Create `src/lib/release-schema.test.ts` (ajv contra release real), script `scripts/preview-real-release.sh` (flip temporal `latest.json` → release real, `bun build`, wrangler dev, Playwright smoke)
**Verificación:** `npm test` valida el app-data real con schemas; Playwright: home con números reales, banner ausente, 0 errores consola.

## Task 1.7 — Release en seco + reportes

**Files:** Create `pipeline/src/pvm/reports.py` (escribe `history/run-<run_id>/run-manifest.json`, `ingestion-report.json`, `dbt-run-results.json`, `quality-summary.json`)
**Verificación:** `make release` completo de cero; reportes generados.

## Task 2.1 — S02 padrón y mapa wells

**Files:** ingest S02 (`ingest.py` extensión), `stg_energy__wells.sql`, `dim_well.sql`, `mart_map_wells.sql`, exporters wells GeoJSON (`shape.py`: `build_map()` → `wells_geojson`)
**Tests:** UNIQUE `well_id` en dim_well; join a fact ≥ umbral; cobertura publicada.

## Task 2.2 — S03 fracturas

**Files:** ingest S03, `stg_energy__fractures.sql`, `fact_fracture_job.sql`, `mart_completion_productivity.sql` (`is_future_dated` excluido)
**Tests:** UNIQUE `fracture_job_id`; 0 duplicados; normalización solo longitud>0.

## Task 2.3 — S04 trayectorias + GeoJSON

**Files:** ingest S04, `stg_energy__trajectories.sql`, `fact_well_trajectory.sql` (trajectory_id = hash), exporter `trajectories_geojson` simplificado
**Tests:** `trajectory_id` derivado estable; geometría parseable.

## Task 2.4 — S05 reconciliación

**Files:** ingest S05 (API series), `stg_reference__national_production.sql`, `fact_national_monthly_production.sql`, `mart_source_reconciliation.sql` (tolerancia 3%/5%)
**Tests:** diferencia calculada correcta; cobertura solo donde ambas fuentes existen.

## Task 2.5 — S06 Georef + S07 aliases

**Files:** `georef.py` (cache por coordenada redondeada), `dim_geography.sql`, reviews aliases seed
**Tests:** caché hit/miss; municipio nulo OK.

## Task 2.6 — Marts restantes

**Files:** `mart_operator_monthly_rankings.sql`, `mart_unconventional_share.sql`, `mart_well_cohort_curve.sql` (§15 MODELO_DE_DATOS: first production month, age, percentiles 25/50/75, n, mínimo 10 pozos), `mart_data_quality_status.sql`
**Tests:** conteo de pozos ≥ umbral; percentiles válidos; ranks 1..N sin huecos.

## Task 2.7 — Exporter final + descargas

**Files:** extender `export.py` a todas las secciones reales; generar CSVs `monthly-production.csv`, `operator-rankings.csv`, `cohorts.csv`, `completions.csv` con `size_bytes`/`updated_at`
**Tests:** schema completo (jsonschema) sobre app-data final; CSV filas > 0.

## Task 2.8 — QA completo + cutover

**Files:** `docs/OPERACION.md` (runbook mensual), update `CLAUDE.md`, commit `data/samples/` + manifest + `pipeline/src/pvm/profile/` (o regenerar desde ingesta), docs README final
**Verificación:** `make release` limpio; Playwright 12 rutas; flip `latest.json` definitivo; commit+push.

---

## Self-review notes (spec coverage)
- S01..S07 → Tasks 1.2, 2.1–2.5. 8 marts → 1.4, 2.1–2.6. Contrato/schemas → 0.2, 1.5, 2.7. Cutover → 1.6, 2.8. Runbook/reports → 1.7, 2.8. Muestras/CLAUDE → 2.8. §22 provisorias → constantes/config + quality/methodology en 1.5 y 2.6.