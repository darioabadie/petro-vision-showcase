"""DDL de ClickHouse: creación de bases, raw y tablas core."""

from __future__ import annotations

import clickhouse_connect

RAW_COLUMNS: list[str] = [
    "idempresa", "anio", "mes", "idpozo", "prod_pet", "prod_gas", "prod_agua",
    "iny_agua", "iny_gas", "iny_co2", "iny_otro", "tef", "vida_util",
    "tipoextraccion", "tipoestado", "tipopozo", "observaciones", "fechaingreso",
    "rectificado", "habilitado", "idusuario", "empresa", "sigla", "formprod",
    "profundidad", "formacion", "idareapermisoconcesion", "areapermisoconcesion",
    "idareayacimiento", "areayacimiento", "cuenca", "provincia", "tipo_de_recurso",
    "proyecto", "clasificacion", "subclasificacion", "sub_tipo_recurso", "fecha_data",
]

TECH_META_COLUMNS: list[str] = [
    "_load_id", "_source_url", "_resource_id", "_resource_last_modified",
    "_retrieved_at", "_source_sha256", "_row_number",
]


def typed_raw_columns() -> list[str]:
    cls: list[str] = []
    for c in RAW_COLUMNS:
        cls.append(f"`{c}` Nullable(String)")
    for c in TECH_META_COLUMNS:
        cls.append(f"`{c}` String")
    cls.append("`_extra_payload` Nullable(String)")
    return cls


DDL_RAW_WELL_PRODUCTION = f"""
CREATE TABLE IF NOT EXISTS raw_energy.well_production (
    {',\n    '.join(typed_raw_columns())}
) ENGINE = MergeTree
PARTITION BY toYYYYMM(parseDateTimeBestEffort(_retrieved_at))
ORDER BY (_resource_id, _source_sha256, _row_number)
"""

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
    adjiv_fecha_inicio_perf Nullable(String),
    adjiv_fecha_fin_perf Nullable(String),
    adjiv_fecha_inicio_term Nullable(String),
    adjiv_fecha_fin_term Nullable(String),
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
) ENGINE = MergeTree
PARTITION BY toYYYYMM(_retrieved_at)
ORDER BY (_resource_id, _source_sha256, _row_number)
"""


def ensure_databases(client: clickhouse_connect.driver.Client) -> None:
    for db in ("raw_energy", "raw_reference", "raw_manual", "analytics"):
        client.command(f"CREATE DATABASE IF NOT EXISTS {db}")


def ensure_schema(client: clickhouse_connect.driver.Client) -> None:
    """Crea bases y tablas raw. Los modelos analíticos los crea dbt."""
    ensure_databases(client)
    client.command(DDL_RAW_WELL_PRODUCTION)
    client.command(DDL_RAW_WELLS)


def get_client() -> clickhouse_connect.driver.Client:
    from pvm import config

    return clickhouse_connect.get_client(
        host=config.CLICKHOUSE_HOST,
        port=config.CLICKHOUSE_PORT,
        username=config.CLICKHOUSE_USER,
        password=config.CLICKHOUSE_PASSWORD,
        database=config.CLICKHOUSE_DATABASE,
    )


def main() -> None:
    client = get_client()
    ensure_schema(client)
    print("Esquema ClickHouse listo.")


if __name__ == "__main__":
    main()