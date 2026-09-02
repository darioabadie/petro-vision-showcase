# ClickHouse — motor analítico

*[English version](clickhouse.en.md)*

**Alcance:** por qué ClickHouse, cómo están organizadas las bases y tablas, motores de tabla usados y cómo conectarse para explorar los datos a mano.

ClickHouse es la única base de datos del proyecto. Corre en un solo container Docker, en local, y nunca se expone fuera de `127.0.0.1` — el sitio público no le habla directamente (ver [`docker.md`](docker.md) y [`architecture.md`](architecture.md)).

## Por qué ClickHouse

- **Motor columnar**: agregar 18M+ filas por mes/operador/provincia corre en segundos, sin necesidad de pre-agregar en Python.
- **Open source y liviano**: un solo binario, un solo container, sin licencia ni servicio gestionado — coherente con el alcance de portfolio (correr todo en una laptop).
- **`dbt-clickhouse` maduro**: permite modelar en dbt igual que con Postgres/Snowflake/BigQuery, pero sobre un motor pensado para este volumen.
- **`ReplacingMergeTree`**: resuelve nativamente el problema de "la fuente publicó una revisión del mismo mes" sin lógica de upsert manual en Python.

## Bases de datos

| Base | Quién escribe | Contenido |
|---|---|---|
| `raw_energy` | Pipeline de ingesta (Python) | Tablas raw de fuentes energéticas: `well_production` (S01), `wells` (S02). Inmutables, con metadata de procedencia. |
| `raw_reference` | Pipeline de ingesta (Fase 2) | Series nacionales de control y Georef — todavía no pobladas. |
| `raw_manual` | — (reservada) | Espacio para fuentes manuales que no vienen de ingesta automática. |
| `analytics` | dbt | Todo lo que ve el exporter: staging (vistas), core (dimensiones/hechos) y marts. Es el `schema` configurado en `dbt/profiles.yml`. |

`ensure_databases()` (`pipeline/src/pvm/ddl.py`) crea las cuatro bases si no existen, cada vez que corre `make ingest`. `analytics` la puebla dbt solo — el pipeline de Python nunca escribe ahí.

## Tablas raw: diseño físico

Ambas tablas raw (`well_production`, `wells`) comparten el mismo patrón, definido en `pipeline/src/pvm/ddl.py`:

```sql
CREATE TABLE raw_energy.well_production (
    idpozo Nullable(String), anio Nullable(String), ..., -- columnas originales, todas String
    _load_id String,                    -- UUID de la corrida de ingesta
    _source_url String,                 -- URL exacta descargada
    _resource_id LowCardinality(String),-- ID del recurso CKAN
    _resource_last_modified Nullable(DateTime64),
    _retrieved_at DateTime64,           -- cuándo se descargó de verdad
    _source_sha256 FixedString(64),     -- checksum del archivo origen
    _row_number UInt64,                 -- posición en el CSV
    _extra_payload Nullable(String)     -- columnas nuevas no esperadas, sin perderlas
) ENGINE = MergeTree
PARTITION BY toYYYYMM(_retrieved_at)
ORDER BY (_resource_id, _source_sha256, _row_number)
```

Decisiones detrás de esto:

- **Todas las columnas de negocio son `Nullable(String)` en raw.** El tipado real (fechas, floats) pasa a `staging` en dbt, nunca en la carga. Así un CSV con un valor inesperado no rompe la ingesta.
- **`PARTITION BY toYYYYMM(_retrieved_at)`**: particiona por cuándo se descargó, no por el período del dato. Permite borrar/reprocesar una corrida completa sin tocar corridas anteriores.
- **`ORDER BY (_resource_id, _source_sha256, _row_number)`**: la clave de orden incluye el checksum — dos descargas del mismo recurso con contenido distinto (revisión de la fuente) conviven como filas distintas, nunca se pisan. La auditoría completa queda en raw; la versión "vigente" la resuelve dbt en `core`.
- **`_extra_payload`**: si la fuente agrega una columna no contemplada en el DDL, se concatena ahí en vez de fallar la carga o perderla silenciosamente.

## Tablas `analytics`: motores por capa

| Capa | Engine | Por qué |
|---|---|---|
| `staging.*` | `View` (materialización dbt) | Sin motor propio — son solo una consulta sobre raw. |
| `dim_*` | `MergeTree` (tabla simple) | Se reconstruyen enteras en cada `dbt run`; no necesitan versión. |
| `fact_well_monthly_production` | `ReplacingMergeTree(_record_version)`, `ORDER BY (well_id, month_date)`, `PARTITION BY toYear(month_date)` | Grano de negocio `(well_id, month_date)`; si se reprocesa un mes, la fila con `_record_version` (`now64()` al momento del build) más alta gana. |
| `mart_*` | `MergeTree` (tabla simple) | Agregados finales, se recalculan enteros. |

`ReplacingMergeTree` no deduplica en el momento del `INSERT`: lo hace en background al mergear partes, o al consultar con `FINAL`. Para este proyecto no es un problema porque cada modelo se reconstruye completo (`+materialized: table` en `dbt_project.yml`) en cada corrida — no hay inserts incrementales todavía que dependan de la deduplicación en caliente.

## Conexión y credenciales

Todo son credenciales de **desarrollo local**, definidas en `docker-compose.yml` y jamás usadas en un entorno expuesto:

| Protocolo | Puerto | Quién lo usa |
|---|---|---|
| HTTP | `127.0.0.1:8123` | `clickhouse-connect` (Python: ingesta y exporter) |
| Nativo (TCP) | `127.0.0.1:9000` | dbt (`dbt-clickhouse`, protocolo `native` en `profiles.yml`) |

Usuario `default` / password `pvm_dev`. Ningún puerto se publica fuera de `localhost` (ver [`docker.md`](docker.md#seguridad)).

## Explorar los datos a mano

```bash
# cliente interactivo dentro del container
docker compose exec clickhouse clickhouse-client

# o vía HTTP con curl
curl 'http://127.0.0.1:8123/?query=SELECT+count()+FROM+raw_energy.well_production'
```

Consultas útiles para inspeccionar el estado real (las mismas que corre `build_quality()` en el exporter):

```sql
-- filas raw cargadas
SELECT count() FROM raw_energy.well_production;

-- duplicados de clave de negocio en el hecho (debe dar 0)
SELECT well_id, month_date, count() AS n
FROM analytics.fact_well_monthly_production
GROUP BY well_id, month_date
HAVING n > 1;

-- operadores todavía sin alias aprobado
SELECT count() FROM analytics.dim_operator WHERE review_status = 'pending_review';

-- tamaño en disco por tabla
SELECT database, table, formatReadableSize(sum(bytes_on_disk)) AS size
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY sum(bytes_on_disk) DESC;
```

## Resetear el estado

```bash
make down                      # baja el container, conserva el volumen ch_data
docker compose down -v         # baja el container Y borra el volumen (raw completo se pierde)
make up                        # levanta de cero; make ingest recarga raw
```

Borrar el volumen es seguro: todo lo que hay en ClickHouse es reproducible desde las fuentes públicas vía `make ingest && make dbt`. Nada en ClickHouse es la única copia de algo — esa es justamente la razón de separar raw (reconstruible) de `public/data/releases/` (el artefacto versionado en Git).

## Ver también

- [`docker.md`](docker.md) — cómo está containerizado (o no) cada componente.
- [`dbt.md`](dbt.md) — qué transforma dbt sobre estas tablas.
- [`MODELO_DE_DATOS.md`](MODELO_DE_DATOS.md) — diseño físico completo y decisiones de tipos por fuente (§17).
