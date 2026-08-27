# Diseño del pipeline ETL — Pulso Vaca Muerta

**Fecha:** 27-08-2026
**Estado:** Aprobado en brainstorming; base para el plan de implementación.
**Decisiones confirmadas:** stack ClickHouse + dbt en Docker (ClickHouse container; ingesta y dbt con `uv` local, refinamiento aprobado); histórico completo 2006–2026; avanzar con decisiones provisorias §22 (1ª release `status="warning"`); construcción por corte vertical (Fase 1: S01 → `app-data.json` → validación en frontend), luego Fase 2 (expansión).

## Objetivo

Producir releases reales que cumplan el contrato del frontend (`src/lib/contract.ts`, schema_version 1.x): `public/data/releases/<release_id>/app-data.json` + artefactos (GeoJSON, CSVs), puntero `latest.json`, y los reportes de calidad que alimentan `/calidad`. El frontend no cambia; el banner de demo desaparece cuando `release.is_mock=false` (cutover §24 lovable.md).

## Estructura del monorepo

```text
pipeline/            # uv Python: catalog, ingest, export, manifest, quality
  ├── pyproject.toml
  ├── src/pvm/        # paquete
  ├── tests/
  ├── landing/       # gitignored: descargas + estado
  └── history/       # gitignored: reportes de corrida (run-*)
dbt/                 # proyecto dbt (stg/core/marts + seeds + tests)
contracts/           # JSON Schemas (fuente de verdad del contrato)
docker-compose.yml   # solo ClickHouse, bind 127.0.0.1, creds dev
Makefile             # up | down | ingest | dbt | export | release | test | preview
```

## Capas de datos (ClickHouse + dbt)

- **Raw** (`raw_energy.*`, `raw_reference.*`, `raw_manual.*`): MergeTree, `PARTITION BY toYYYYMM(_retrieved_at)`, `ORDER BY (_resource_id, _source_sha256, _row_number)`, metadata `_load_id`, `_source_url`, `_resource_id`, `_resource_last_modified`, `_retrieved_at`, `_source_sha256`, `_row_number`.
- **Staging** (`stg_*`): tipos, booleans `t/f`, normalización de formación, flags.
- **Core**: `dim_date_month`, `dim_operator`, `dim_well`, `dim_geography`, `fact_well_monthly_production` (ReplacingMergeTree por `_record_version`, UNIQUE `(well_id, month_date)`), `fact_fracture_job`, `fact_well_trajectory`, `fact_national_monthly_production`.
- **Marts** (8): argentina_monthly_production (Home), operator_monthly_rankings, unconventional_share, well_cohort_curve, completion_productivity, source_reconciliation, data_quality_status, map_wells.

## Contratos

- `contracts/*.schema.json` son la fuente de verdad (release, secciones del payload, geoJSON).
- Exporter valida con `jsonschema`; frontend re-valida con `ajv` en vitest (mock + release real).

## Decisiones provisorias §22 (documentadas en /calidad y /metodologia)

1. Unidades inyección oficiales + `unit_inferred` + warning. 2. UNIQUE en dbt bloquea recurso/año. 3. Canónica = recurso estándar relevado. 4. Regla explícita de mes completo + `is_partial`. 5. `idpozo` = pozo-formación. 6. Fechas futuras S03 → `is_future_dated`, excluidas de métricas. 7. Aliases: canónico provisorio = forma estable normalizada; seed `pending_review`. 8. `is_vaca_muerta = formación = 'VACA MUERTA'`. 9. Tolerancia reconciliación ±3% petróleo, ±5% gas. 10. Operador histórico = `empresa` del período (S01); S02 es estado actual.

## Fuentes (MODELO_DE_DATOS.md)

S01 producción por pozo (CSV anual 2006–2026, clave `(idpozo, anio, mes)`), S02 padrón, S03 fracturas, S04 trayectorias, S05 series nacionales (API), S06 Georef, S07 aliases (seed manual).

## Fases

- **Fase 1 (corte vertical):** S01 completo → staging/core → mart Home → exporter construye `app-data.json` (secciones sin mart en estado vacío/placeholder, `quality` real de S01) → validación schemas + vitest ajv + Playwright con `is_mock=false`. Release `2026-08`, `data_cutoff=2026-07-31`.
- **Fase 2 (expansión):** S02–S07 + marts restantes + GeoJSON/mapa + descargas CSV + `quality` completo → QA total → cutover definitivo → runbook mensual.

## Criterios de éxito / verificación

- `make release` de cero sobre ClickHouse limpio produce la release sin errores.
- Schemas pasan en exporter y en vitest (mock + real).
- Playwright: 12 rutas 200, 0 errores de consola, banner ausente con `is_mock=false`.
- Reportes `run-manifest`, `ingestion-report`, `dbt-run-results`, `quality-summary` generados.
- Cutover commiteado y pusheado; app publicada sirviendo la release real.