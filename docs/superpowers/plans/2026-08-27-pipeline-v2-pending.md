# Pipeline v2 — Lo Faltante Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el pipeline de Pulso Vaca Muerta con aliases de operadores, ingesta S02, quality checks reales y pulido de visualización.

**Architecture:** Cada tarea es independiente y produce un entregable verificable. Las tareas 1-3 son de pipeline/datos (dbt, Python), la 4 es de export/quality, y la 5 cierra con verificación end-to-end.

**Tech Stack:** Python 3.12, polars, clickhouse-connect, dbt-core 1.11, dbt-clickhouse 1.10, ClickHouse 24.8, React/TypeScript, Recharts, MapLibre

## Global Constraints

- Pipeline se ejecuta con `uv run` desde `pipeline/`
- dbt usa `--project-dir ../dbt --profiles-dir ../dbt`
- ClickHouse corre en Docker Compose (`make up`)
- Frontend verificado con `bun run typecheck`, `bun test`, `bun run build`
- Releases se publican en `public/data/releases/<RELEASE_ID>/`
- Los contratos JSON Schema en `contracts/` son la fuente de verdad del formato de export
- No romper el contrato `app-data.schema.json` existente

---

## Estado previo

| Componente | Estado |
|---|---|
| ClickHouse raw_energy.well_production | 18.2M filas, S01 completa |
| dbt: 5 modelos | OK (5/5) |
| dbt: 17 tests | OK (17/17) |
| Export: app-data.json + CSV + latest.json | OK |
| Frontend: typecheck + vitest + build | OK |
| dim_operator.operator_canonical | Tiene valor raw (pending_review) |
| seed_operator_aliases.csv | Vacío (solo headers) |

---

### Task 1: Poblar seed de aliases de operadores

**Files:**
- Modify: `dbt/seeds/seed_operator_aliases.csv`

**Produces:** Seed con aliases normalizados para operadores con variantes de nombre.

- [ ] **Step 1: Escribir la seed con aliases**

Agrupar los 121 operadores en nombres canónicos. Los casos claros de variantes:

| operator_raw | operator_canonical | review_status |
|---|---|---|
| PAN AMERICAN ENERGY (SUCURSAL ARGENTINA) LLC | PAN AMERICAN ENERGY | approved |
| PAN AMERICAN ENERGY SL | PAN AMERICAN ENERGY | approved |
| PAN AMERICAN FUEGUINA S.A. | PAN AMERICAN ENERGY | approved |
| PLUSPETROL S.A. | PLUSPETROL | approved |
| PLUSPETROL CUENCA NEUQUINA S.R.L. | PLUSPETROL | approved |
| PLUSPETROL ENERGY S.A. | PLUSPETROL | approved |
| VISTA ENERGY ARGENTINA SAU | VISTA ENERGY | approved |
| VISTA OIL & GAS ARGENTINA SAU | VISTA ENERGY | approved |
| Vista Oil & Gas Argentina SA | VISTA ENERGY | approved |
| WINTERSHALL DEA ARGENTINA S.A | WINTERSHALL | approved |
| WINTERSHALL ENERGIA S.A. | WINTERSHALL | approved |
| YPF S.A. | YPF | approved |
| SHELL ARGENTINA S.A. | SHELL | approved |
| CHEVRON ARGENTINA S.R.L. | CHEVRON | approved |
| TECPETROL S.A. | TECPETROL | approved |
| CAPETROL S.A. | CAPETROL | approved |
| CAPETROL ARGENTINA S.A. | CAPETROL | approved |
| SINOPEC ARGENTINA EXPLORATION AND PRODUCTION, INC. | SINOPEC | approved |
| TOTAL AUSTRAL S.A. | TOTALENERGIES | approved |
| PETROBRAS ARGENTINA S.A. | PETROBRAS | approved |
| PECOM SERVICIOS ENERGIA SAU | PECOM | approved |
| CAPEX S.A. | CAPEX | approved |
| CGC ENERGIA SAU | CGC | approved |
| PAMPA ENERGIA S.A. | PAMPA ENERGIA | approved |
| PETROQUIMICA COMODORO RIVADAVIA S.A. | PCR | approved |
| OCCIDENTAL ARGENTINA EXPLORATION AND PRODUCTION, INC. | OCCIDENTAL | approved |
| ENAP SIPETROL ARGENTINA S.A. | ENAP | approved |
| COMPAÑÍAS ASOCIADAS PETROLERAS S.A. | CAPSA | approved |
| PETROLERA ENTRE LOMAS S.A. | ENTRE LOMAS | approved |
| PETRO ANDINA RESOURCES LTD. | PETRO ANDINA | approved |
| EXXONMOBIL EXPLORATION ARGENTINA S.R.L. | EXXONMOBIL | approved |

Los demás operadores sin variantes quedan en `pending_review` (usan su propio nombre como canonical por el fallback de dbt — no necesitan fila en la seed).

- [ ] **Step 2: Verificar que el CSV es válido**

```bash
cd pipeline && uv run dbt seed --project-dir ../dbt --profiles-dir ../dbt
```

- [ ] **Step 3: Regenerar dbt con la seed**

```bash
# Dropear dim_operator para recrear desde cero
docker compose exec -T clickhouse clickhouse-client --query "DROP TABLE IF EXISTS analytics.dim_operator"
make dbt && make dbt-test
```

Esperado: los operadores con alias muestran `operator_canonical` normalizado y `review_status = 'approved'`.

- [ ] **Step 4: Regenerar export y verificar rankings**

```bash
make export
```

Verificar que los rankings agrupan correctamente (ej: Pan American aparece una vez, no dos).

- [ ] **Step 5: Commit**

```bash
git add dbt/seeds/seed_operator_aliases.csv
git commit -m "feat: populate operator aliases seed with canonical names"
```

---

### Task 2: Quality checks reales en el exporter

**Files:**
- Modify: `pipeline/src/pvm/export.py` (función `build_quality` y `versioned_payload`)

**Produces:** Quality checks que consultan ClickHouse para validar datos reales en lugar de hardcodear `"passed"`.

- [ ] **Step 1: Reemplazar checks hardcodeados con queries reales**

En `pipeline/src/pvm/export.py`, función `build_quality`, reemplazar el array `checks` con:

```python
def build_quality(sources: list[dict], total_rows: int, series: list[dict], cutoff: str) -> dict:
    client = get_client()
    
    # Check 1: unique (well_id, month_date) en fact
    dup_fact = _query(client, """
        SELECT count() FROM (
            SELECT well_id, month_date, count() AS n
            FROM analytics.fact_well_monthly_production
            GROUP BY well_id, month_date
            HAVING n > 1
        )
    """)[0][0]
    
    # Check 2: null keys en fact
    null_keys = _query(client, """
        SELECT count() FROM analytics.fact_well_monthly_production
        WHERE well_id = '' OR month_date IS NULL OR operator_slug = ''
    """)[0][0]
    
    # Check 3: meses sin produccion positiva
    zero_months = _query(client, """
        SELECT count() FROM analytics.mart_argentina_monthly_production
        WHERE oil_m3 <= 0 AND gas_thousand_m3 <= 0
    """)[0][0]
    
    # Check 4: pozos con produccion negativa
    neg_production = _query(client, """
        SELECT count() FROM analytics.stg_energy__well_production
        WHERE oil_m3 < 0 OR gas_thousand_m3 < 0 OR water_m3 < 0
    """)[0][0]
    
    # Check 5: operadores pending_review
    pending_ops = _query(client, """
        SELECT count() FROM analytics.dim_operator
        WHERE review_status = 'pending_review'
    """)[0][0]
    
    # Check 6: fechas futuras en raw
    future_dates = _query(client, """
        SELECT count() FROM analytics.stg_energy__well_production
        WHERE month_date > toDate('2026-09-01')
    """)[0][0]
    
    checks = [
        {
            "check_id": "unique_well_monthly",
            "label": "Sin duplicados (pozo, mes) en el hecho de producción",
            "severity": "critical",
            "status": "passed" if dup_fact == 0 else "failed",
            "affected_rows": int(dup_fact),
        },
        {
            "check_id": "null_keys_fact",
            "label": "Sin claves nulas en el hecho",
            "severity": "critical",
            "status": "passed" if null_keys == 0 else "failed",
            "affected_rows": int(null_keys),
        },
        {
            "check_id": "monthly_sanity",
            "label": "Todos los meses con producción positiva",
            "severity": "high",
            "status": "passed" if zero_months == 0 else "failed",
            "affected_rows": int(zero_months),
        },
        {
            "check_id": "negative_production",
            "label": "Sin producción negativa en staging",
            "severity": "warning",
            "status": "passed" if neg_production == 0 else "warning",
            "affected_rows": int(neg_production),
        },
        {
            "check_id": "operator_canonical_review",
            "label": "Operadores con nombre canónico pendiente de revisión",
            "severity": "warning",
            "status": "passed" if pending_ops == 0 else "warning",
            "affected_rows": int(pending_ops),
        },
        {
            "check_id": "future_dates",
            "label": "Fechas futuras en datos de producción",
            "severity": "warning",
            "status": "passed" if future_dates == 0 else "warning",
            "affected_rows": int(future_dates),
        },
    ]
    
    failed = sum(1 for c in checks if c["status"] == "failed")
    warnings = sum(1 for c in checks if c["status"] == "warning")
    passed = sum(1 for c in checks if c["status"] == "passed")
    score = round(passed / len(checks) * 100, 1) if checks else 100
    
    return {
        "overall": {
            "status": "failed" if failed > 0 else ("warning" if warnings > 0 else "ok"),
            "score_pct": score,
            "critical_tests_failed": failed,
            "warnings": warnings,
            "last_successful_run": iso_now(),
            "rows_processed": total_rows,
        },
        "sources": sources,
        "checks": checks,
        "join_coverage": [],
        "reconciliation": [],
        "revisions": [],
    }
```

Nota: eliminar la query anidada de `pending_ops` que actualmente se hace al inicio de la función (se integra dentro del array de checks). También eliminar el `get_client()` duplicado (la función ya recibe `client` como parámetro en el flujo actual o usa uno nuevo). Ajustar `versioned_payload` para pasar `client` a `build_quality` si es necesario.

- [ ] **Step 2: Verificar que export no rompe**

```bash
make export
```

Esperado: `quality.checks` muestra valores reales (ej: `operator_canonical_review` muestra cuántos operadores siguen en `pending_review`) y `quality.overall.status` refleja estado real.

- [ ] **Step 3: Commit**

```bash
git add pipeline/src/pvm/export.py
git commit -m "feat: real quality checks from ClickHouse queries instead of hardcoded values"
```

---

### Task 3: Ingesta S02 — Padrón de pozos

**Files:**
- Create: `dbt/models/staging/stg_energy__wells.sql`
- Create: `dbt/models/core/dim_well.sql`
- Modify: `pipeline/src/pvm/ingest.py` (agregar `run_s02`)
- Modify: `pipeline/src/pvm/catalog.py` (si es necesario)
- Modify: `pipeline/src/pvm/ddl.py` (agregar tabla `raw_energy.wells`)
- Modify: `pipeline/src/pvm/pipelines.py` (agregar source `s02`)
- Modify: `dbt/models/schema.yml` (agregar modelos + tests)

**Produces:** Tabla raw_energy.wells, staging y dim_well con coordenadas, join coverage en quality.

- [ ] **Step 1: Agregar DDL para wells en ddl.py**

```python
DDL_RAW_WELLS = """
CREATE TABLE IF NOT EXISTS raw_energy.wells (
    idpozo Nullable(String),
    sigla Nullable(String),
    empresa Nullable(String),
    area Nullable(String),
    cod_area Nullable(String),
    yacimiento Nullable(String),
    cod_yacimiento Nullable(String),
    cuenca Nullable(String),
    provincia Nullable(String),
    formacion Nullable(String),
    tipo_recurso Nullable(String),
    sub_tipo_recurso Nullable(String),
    cota Nullable(String),
    profundidad Nullable(String),
    clasificacion Nullable(String),
    subclasificacion Nullable(String),
    tipopozo Nullable(String),
    tipoextraccion Nullable(String),
    tipoestado Nullable(String),
    gasplus Nullable(String),
    inicio_perforacion Nullable(String),
    fin_perforacion Nullable(String),
    inicio_terminacion Nullable(String),
    fin_terminacion Nullable(String),
    geojson Nullable(String),
    geom Nullable(String),
    _load_id String,
    _source_url String,
    _resource_id LowCardinality(String),
    _resource_last_modified Nullable(DateTime64),
    _retrieved_at DateTime64,
    _source_sha256 FixedString(64),
    _row_number UInt64,
    _extra_payload Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(_retrieved_at)
ORDER BY (_resource_id, _source_sha256, _row_number)
"""
```

Agregar la creación de esta tabla en `ensure_schema`:

```python
client.command(DDL_RAW_WELLS)
```

- [ ] **Step 2: Agregar `run_s02` en ingest.py**

Siguiendo el mismo patrón que `run_s01` pero para el recurso "Capítulo IV - Pozos" del mismo CKAN package. El resource no es anual: es un solo archivo CSV.

```python
def run_s02(client):
    from pvm.catalog import fetch_package, sha256_file
    
    package = fetch_package(config.PRODUCTION_PACKAGE_ID)
    wells_resource = None
    for r in package.get("resources", []):
        if (r.get("name") or "") == "Capítulo IV - Pozos":
            wells_resource = r
            break
    if not wells_resource:
        raise RuntimeError("recurso Capítulo IV - Pozos no encontrado")
    
    rec = ResourceRecord(
        resource_id=wells_resource["id"],
        url=_public_url(wells_resource["url"]),
        name="Capítulo IV - Pozos",
        last_modified=str(wells_resource.get("last_modified") or ""),
        format=wells_resource.get("format", "CSV"),
    )
    
    state = StateStore()
    prev = state.get(rec.resource_id)
    log.info("descargando %s ...", rec.url)
    landing_file = config.LANDING_DIR / "s02" / "capitulo-iv-pozos.csv"
    landing_file.parent.mkdir(parents=True, exist_ok=True)
    sha = download(rec.url, landing_file)
    
    if prev and prev.get("sha256") == sha:
        log.info("S02 sin cambios, omitiendo")
        return {"updated": [], "skipped": [rec.resource_id], "errors": []}
    
    rows = _count_rows(str(landing_file))
    log.info("S02: %d filas", rows)
    
    df = read_annual(str(landing_file))
    # Mapear columnas del padrón
    load_id = str(uuid4())
    retrieved_at = datetime.now(timezone.utc).isoformat()
    
    # Construir INSERT
    existing = set(client.query(f"SELECT name FROM system.columns WHERE table='wells' AND database='raw_energy'").result_columns[0].values)
    columns = [c for c in RAW_WELLS_COLUMNS if c in existing or c.startswith('_')]
    extra_cols = [c for c in df.columns if c not in columns and not c.startswith('_')]
    
    if extra_cols:
        df = df.with_columns(pl.concat_str(extra_cols, separator="\x1F").alias("_extra_payload"))
    
    tech_meta = pl.DataFrame({
        "_load_id": [load_id] * len(df),
        "_source_url": [rec.url] * len(df),
        "_resource_id": [rec.resource_id] * len(df),
        "_resource_last_modified": [rec.last_modified] * len(df),
        "_retrieved_at": [retrieved_at] * len(df),
        "_source_sha256": [sha] * len(df),
        "_row_number": list(range(1, len(df) + 1)),
    })
    
    # Normalizar nombres de columna (lowercase)
    rename_map = {c: c.lower() for c in df.columns}
    df = df.rename(rename_map)
    
    final_df = df.with_columns(tech_meta)
    insert_cols = [c for c in final_df.columns if c in columns or c == '_extra_payload']
    
    client.command(f"ALTER TABLE raw_energy.wells DELETE WHERE _resource_id = '{rec.resource_id}'")
    
    chunk_size = 100_000
    for i in range(0, len(final_df), chunk_size):
        chunk = final_df.slice(i, min(chunk_size, len(final_df) - i))
        client.insert(
            "raw_energy.wells",
            chunk.select(insert_cols).rows(),
            column_names=insert_cols,
        )
    
    state.set(rec.resource_id, {"sha256": sha, "last_modified": rec.last_modified, "rows": rows})
    state.save()
    return {"updated": [rec.resource_id], "skipped": [], "errors": []}
```

Agregar `RAW_WELLS_COLUMNS` como constante en el módulo con las columnas del CSV de pozos.

- [ ] **Step 3: Agregar staging y core en dbt**

`dbt/models/staging/stg_energy__wells.sql`:
```sql
SELECT
    coalesce(NULLIf(trim(idpozo), ''), '') AS well_id,
    if(isNull(sigla) OR trim(sigla) = '', '', trim(sigla)) AS well_label,
    if(isNull(empresa) OR trim(empresa) = '', '', trim(empresa)) AS operator_raw,
    if(isNull(area) OR trim(area) = '', '', trim(area)) AS area,
    if(isNull(yacimiento) OR trim(yacimiento) = '', '', trim(yacimiento)) AS field,
    if(isNull(cuenca) OR trim(cuenca) = '', '', trim(cuenca)) AS basin,
    if(isNull(provincia) OR trim(provincia) = '', '', trim(provincia)) AS province,
    lower(trim(coalesce(formacion, ''))) AS formation,
    lower(trim(coalesce(tipo_recurso, ''))) AS resource_type,
    lower(trim(coalesce(sub_tipo_recurso, ''))) AS resource_subtype,
    if(isNull(geojson) OR trim(geojson) = '', NULL, geojson) AS geojson_raw,
    toFloat64OrZero(cota) AS cota_m,
    toFloat64OrZero(profundidad) AS profundidad_m,
    lower(trim(coalesce(tipoestado, ''))) AS well_status,
    lower(trim(coalesce(clasificacion, ''))) AS classification,
    if(isNull(inicio_perforacion) OR trim(inicio_perforacion) = '', NULL, trim(inicio_perforacion)) AS inicio_perforacion,
    if(isNull(fin_perforacion) OR trim(fin_perforacion) = '', NULL, trim(fin_perforacion)) AS fin_perforacion,
    if(isNull(inicio_terminacion) OR trim(inicio_terminacion) = '', NULL, trim(inicio_terminacion)) AS inicio_terminacion,
    if(isNull(fin_terminacion) OR trim(fin_terminacion) = '', NULL, trim(fin_terminacion)) AS fin_terminacion
FROM raw_energy.wells
WHERE idpozo <> '' AND idpozo IS NOT NULL
```

`dbt/models/core/dim_well.sql`:
```sql
{{ config(materialized='table', order_by='well_id') }}

WITH first_prod AS (
    SELECT well_id, min(month_date) AS first_production_month
    FROM {{ ref('fact_well_monthly_production') }}
    WHERE productive_flag = 1
    GROUP BY well_id
)
SELECT
    w.well_id,
    w.well_label,
    w.operator_raw,
    w.area,
    w.field,
    w.basin,
    w.province,
    w.formation,
    w.resource_type,
    w.resource_subtype,
    w.geojson_raw,
    w.cota_m,
    w.profundidad_m,
    w.well_status,
    w.classification,
    w.inicio_perforacion,
    w.fin_perforacion,
    w.inicio_terminacion,
    w.fin_terminacion,
    fp.first_production_month,
    if(fp.first_production_month IS NOT NULL, 1, 0) AS has_production
FROM {{ ref('stg_energy__wells') }} w
LEFT JOIN first_prod fp ON w.well_id = fp.well_id
```

- [ ] **Step 4: Agregar tests en schema.yml**

```yaml
  - name: stg_energy__wells
    columns:
      - name: well_id
        tests:
          - not_null
      - name: geojson_raw
        tests: []

  - name: dim_well
    columns:
      - name: well_id
        tests:
          - unique
          - not_null
```

- [ ] **Step 5: Agregar `s02` a la CLI**

En `pipeline/src/pvm/pipelines.py`:
- Agregar `"s02"` a `choices` del argumento `--source`
- En la función principal del comando ingest, agregar rama:

```python
if args.source == "s02":
    ingest.run_s02(client)
```

- [ ] **Step 6: Agregar join coverage al exporter**

En `build_quality`, agregar un query que mida cuántos pozos de producción matchean con el padrón:

```python
join_coverage = _query(client, """
    WITH prod AS (
        SELECT DISTINCT well_id FROM analytics.fact_well_monthly_production
    ),
    wells AS (
        SELECT DISTINCT well_id FROM analytics.dim_well
    )
    SELECT
        (SELECT count() FROM prod) AS total_production_wells,
        (SELECT count() FROM prod p INNER JOIN wells w ON p.well_id = w.well_id) AS matched,
        (SELECT count() FROM wells) AS total_padron_wells
""")
# ...
"join_coverage": [
    {
        "label": "Pozos de producción con match en padrón",
        "matched": int(matched),
        "total": int(total_production_wells),
        "pct": round(matched / total_production_wells * 100, 2) if total_production_wells else 0,
    }
]
```

- [ ] **Step 8: Verificar pipeline completo**

```bash
make ingest  # ahora incluye S02
make dbt && make dbt-test
make export
```

Esperado: `quality.join_coverage` muestra el porcentaje de match entre producción y padrón.

- [ ] **Step 9: Commit**

```bash
git add pipeline/src/pvm/ddl.py pipeline/src/pvm/ingest.py pipeline/src/pvm/pipelines.py pipeline/src/pvm/export.py dbt/models/staging/stg_energy__wells.sql dbt/models/core/dim_well.sql dbt/models/schema.yml
git commit -m "feat: add S02 ingestion (well registry), dim_well, and join coverage"
```

---

### Task 4: Mapa con join de coordenadas reales

**Files:**
- Modify: `pipeline/src/pvm/export.py` (función `build_map_data`)

**Produces:** El mapa usa coordenadas de `dim_well` en lugar de descargar y procesar CSVs raw cada vez.

- [ ] **Step 1: Migrar build_map_data a usar dim_well**

Reemplazar la función actual (que descarga CSVs locales y los parsea) por una que consulte `dim_well` y `fact_well_monthly_production`:

```python
def build_map_data(client, last_complete_period: str) -> dict:
    rows = _query(client, f"""
        SELECT 
            w.well_id, w.well_label, w.geojson_raw,
            w.well_status, w.formation, w.resource_type,
            w.area, w.province,
            f.operator_slug, o.operator_canonical AS operator_name,
            f.oil_m3, f.gas_thousand_m3
        FROM analytics.dim_well w
        JOIN analytics.fact_well_monthly_production f 
            ON w.well_id = f.well_id 
            AND f.month_date = toDate('{last_complete_period}')
        JOIN analytics.dim_operator o ON f.operator_slug = o.operator_slug
        WHERE w.geojson_raw IS NOT NULL AND w.geojson_raw <> ''
    """)
    
    well_features = []
    traj_set = set()  # S04 pendiente, trayectorias se quedan vacías
    
    for row in rows:
        try:
            geometry = json.loads(row[2])
        except:
            continue
        well_features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": {
                "well_id": row[0],
                "label": row[1] or row[0],
                "operator_slug": row[8],
                "operator_name": row[9],
                "area": row[6] or "",
                "formation": (row[4] or "").upper(),
                "resource_type": row[5] or "",
                "well_status": row[3] or "Sin dato",
                "last_oil_m3": round(float(row[10] or 0)),
                "last_gas_thousand_m3": round(float(row[11] or 0)),
            }
        })
    
    return {
        "initial_view": {"longitude": -69.25, "latitude": -38.35, "zoom": 6},
        "color_modes": ["wells", "operator", "area"],
        "wells_geojson": {"type": "FeatureCollection", "features": well_features},
        "trajectories_geojson": {"type": "FeatureCollection", "features": []},
    }
```

Nota: al eliminar las descargas de CSV raw, también se pueden eliminar las dependencias en `pipeline/src/pvm/export.py` de `_resource_by_name`, `_ensure_landing_file`, `_read_csv_as_strings` (si no se usan en otro lado). Conservarlas por ahora para S03/S04 futuro.

- [ ] **Step 2: Verificar mapa**

```bash
make export
python3 -c "
import json
with open('public/data/releases/2026-08/app-data.json') as f:
    d = json.load(f)
print(f'Pozos en mapa: {len(d[\"map\"][\"wells_geojson\"][\"features\"])}')
"
```

Esperado: el mapa ahora tiene los mismos pozos pero obtenidos desde ClickHouse en lugar de CSVs raw.

- [ ] **Step 3: Commit**

```bash
git add pipeline/src/pvm/export.py
git commit -m "refactor: build_map_data from dim_well instead of parsing raw CSVs"
```

---

### Task 5: Verificación end-to-end y documentación final

**Files:**
- Verify: `docs/README.md` (ya actualizado)
- Verify: `docs/architecture.md` (ya actualizado)
- Modify: `docs/architecture.md` (agregar nota de S02)

**Produces:** Pipeline completo verificado con todos los cambios integrados.

- [ ] **Step 1: Ejecutar pipeline completo**

```bash
make down && make up
make ingest   # S01 + S02
make dbt && make dbt-test
make export
```

Esperado: todas las tareas sin errores.

- [ ] **Step 2: Verificar frontend**

```bash
bun run typecheck
bun test
bun run build
```

Esperado: 0 errores de tipo, 24/24 tests, build exitoso.

- [ ] **Step 3: Actualizar architecture.md**

Agregar una nota en §4.1 indicando que S02 está implementado y `dim_well` disponible.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: update architecture with S02 and quality checks status"
```

---

## Resumen de cambios

| Tarea | Archivos | Lo que entrega |
|---|---|---|
| 1. Seed aliases | `dbt/seeds/seed_operator_aliases.csv` | ~30 operadores normalizados, rankings agrupados |
| 2. Quality checks reales | `pipeline/src/pvm/export.py` | 6 checks dinámicos con queries a ClickHouse |
| 3. Ingesta S02 | `ddl.py`, `ingest.py`, `pipelines.py`, 2 modelos dbt + tests | Padrón de pozos, dim_well, join coverage |
| 4. Mapa desde dim_well | `pipeline/src/pvm/export.py` | Mapa que consulta dim_well en vez de parsear CSVs |
| 5. Verificación | `docs/architecture.md` | Pipeline completo verificado |