"""Ingesta de fuentes: descarga con verificación, checksum y carga a raw.

La verificación rechaza respuestas HTML, archivos vacíos y cambios de esquema
no aprobados (faltan columnas críticas). Todo guarda la evidencia original en
raw con metadata técnica (§11 del modelo de datos).
"""

from __future__ import annotations

import json
import logging
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import clickhouse_connect
import polars as pl

from pvm import config
from pvm.catalog import ResourceRecord, StateStore, sha256_file
from pvm.ddl import RAW_COLUMNS, TECH_META_COLUMNS, ensure_databases, get_client

log = logging.getLogger("pvm.ingest")

_HTML_RE = re.compile(rb"<(?:\?xml|!DOCTYPE|html)\b", re.IGNORECASE)
CRITICAL_COLUMNS = ("idpozo", "anio", "mes", "empresa", "prod_pet")

EXTRA_COLUMN = "_extra_payload"


class DownloadError(Exception):
    pass


class VerifyError(Exception):
    pass


def download(url: str, dest: Path, retries: int = 3, timeout: int = 300) -> str:
    """Descarga a dest con reintentos; devuelve el SHA-256 mientras escribe."""
    import requests

    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, retries + 1):
        try:
            with requests.get(url, stream=True, timeout=(30, timeout)) as resp:
                resp.raise_for_status()
                h = hashlib_sha256()
                size = 0
                with dest.open("wb") as f:
                    for chunk in resp.iter_content(chunk_size=1 << 20):
                        if chunk:
                            f.write(chunk)
                            h.update(chunk)
                            size += len(chunk)
                if size == 0:
                    raise DownloadError(f"archivo vacío: {url}")
                return h.hexdigest()
        except (DownloadError, Exception) as exc:  # noqa: BLE001
            if attempt == retries:
                raise DownloadError(f"falló descarga de {url} tras {retries} intentos: {exc}") from exc
            log.warning("reintento %d de %d para %s (%s)", attempt + 1, retries, url, exc)
            time.sleep(5 * attempt)


def hashlib_sha256():
    import hashlib

    return hashlib.sha256()


def verify_csv(path: Path) -> dict:
    """Valida el archivo y devuelve {columns, rows}. Rechaza con VerifyError."""
    raw = path.read_bytes()
    if _HTML_RE.search(raw[:2048]):
        raise VerifyError(f"{path.name}: respuesta HTML (probable redirect/error)")
    try:
        schema = pl.scan_csv(path).collect_schema()
    except Exception as exc:  # noqa: BLE001
        raise VerifyError(f"{path.name}: no es un CSV válido: {exc}") from exc
    columns = sorted(schema.names())
    missing = [c for c in CRITICAL_COLUMNS if c not in columns]
    if missing:
        raise VerifyError(f"{path.name}: cambió el esquema, faltan columnas críticas {missing}")
    rows = _count_rows(path)
    if rows == 0:
        raise VerifyError(f"{path.name}: archivo sin filas de datos")
    return {"columns": columns, "rows": rows}


def _count_rows(path: Path) -> int:
    """Conteo aproximado de filas físicas del CSV (correcto si no hay newlines
    embebidos en comillas; suficiente para el umbral de sanity)."""
    count = 0
    with path.open("rb") as f:
        for _ in f:
            count += 1
    return max(count - 1, 0)


def read_annual(path: Path) -> pl.DataFrame:
    """Lee el CSV anual completo con todas las columnas como String."""
    schema = pl.scan_csv(path).collect_schema()
    overrides = {name: pl.String for name in schema.names()}
    return pl.read_csv(path, schema_overrides=overrides, null_values=[""])


def ingest_s01_resource(
    client: clickhouse_connect.driver.Client,
    rec: ResourceRecord,
    landing_file: Path,
    verified: dict,
    sha: str,
    load_id: str,
    retrieved_at: str,
) -> dict:
    """Carga un recurso anual a raw_energy.well_production.

    Idempotente: antes de insertar borra cualquier versión previa del mismo
    recurso, de modo que un re-run reemplaza en vez de duplicar.
    """
    table = "raw_energy.well_production"
    client.command(
        "ALTER TABLE raw_energy.well_production DELETE WHERE _resource_id = {rid:String}",
        parameters={"rid": rec.resource_id},
    )
    df = read_annual(landing_file)

    present = set(df.columns)
    ordered: list[pl.Expr] = []
    for col in RAW_COLUMNS:
        if col in present:
            ordered.append(pl.col(col).cast(pl.String))
        else:
            ordered.append(pl.lit(None, dtype=pl.String).alias(col))

    extra_cols = sorted(present - set(RAW_COLUMNS))
    if extra_cols:
        extra_expr = pl.concat_str(
            [pl.col(c).alias(f"__{c}") for c in extra_cols],
            separator="\u001f",
        )
        ordered.append(extra_expr.alias(EXTRA_COLUMN))
    else:
        ordered.append(pl.lit(None, dtype=pl.String).alias(EXTRA_COLUMN))

    df = df.select(ordered)
    df = df.with_row_index("__idx")
    n = df.height
    df = df.with_columns(
        pl.lit(load_id, dtype=pl.String).alias("_load_id"),
        pl.lit(rec.url, dtype=pl.String).alias("_source_url"),
        pl.lit(rec.resource_id, dtype=pl.String).alias("_resource_id"),
        pl.lit(rec.last_modified, dtype=pl.String).alias("_resource_last_modified"),
        pl.lit(retrieved_at, dtype=pl.String).alias("_retrieved_at"),
        pl.lit(sha, dtype=pl.String).alias("_source_sha256"),
    )
    df = df.with_columns(pl.col("__idx").cast(pl.String).alias("_row_number")).drop("__idx")

    cols = RAW_COLUMNS + TECH_META_COLUMNS + [EXTRA_COLUMN]
    chunk = 100_000
    inserted = 0
    for start in range(0, n, chunk):
        sub = df.slice(start, chunk).to_dicts()
        rows = [[subrow[c] for c in cols] for subrow in sub]
        client.insert(table, rows, column_names=cols)
        inserted += len(rows)
    return {"resource_id": rec.resource_id, "rows": inserted, "columns": list(present)}


def run_s01(
    client: clickhouse_connect.driver.Client | None = None,
    only_year: int | None = None,
) -> dict:
    from pvm import config as cfg
    from pvm.catalog import annual_production_resources, fetch_package

    client = client or get_client()
    ensure_databases(client)
    state = StateStore()
    package = fetch_package(cfg.PRODUCTION_PACKAGE_ID)
    resources = annual_production_resources(package)
    load_id = str(uuid.uuid4())
    retrieved_at = datetime.now(timezone.utc).isoformat()
    summary: dict = {"updated": [], "skipped": [], "errors": []}

    for year, rec in resources.items():
        if only_year and year != only_year:
            continue
        dest = cfg.LANDING_DIR / "s01" / f"well_production_{year}.csv"
        prev = state.get(rec.resource_id)
        try:
            if dest.exists() and prev and prev.get("sha256"):
                sha = prev["sha256"]
                log.info("S01 %d ya descargado (skipping download)", year)
            else:
                rec_url = rec.url
                base = rec_url if rec_url.startswith("http") else f"http://datos.energia.gob.ar{rec_url}"
                sha = download(base, dest)
            verified = verify_csv(dest)
            if (
                prev
                and prev.get("loaded")
                and prev.get("sha256") == sha
                and prev.get("last_modified") == rec.last_modified
            ):
                log.info("S01 %d ya cargado con mismo sha (skip)", year)
                summary["skipped"].append({"year": year, "resource_id": rec.resource_id})
                continue
            if verified["rows"] < cfg.MIN_ANNUAL_ROWS:
                n = verified["rows"]
                log.warning("S01 %d tiene %d filas (umbral %d)", year, n, cfg.MIN_ANNUAL_ROWS)
            summary_rows = ingest_s01_resource(
                client, rec, dest, verified, sha, load_id, retrieved_at
            )
            state.set(rec.resource_id, {"sha256": sha, "rows": verified["rows"], "last_modified": rec.last_modified, "loaded": True})
            summary["updated"].append({"year": year, **summary_rows})
            log.info("S01 %d cargado: %d filas", year, verified["rows"])
        except Exception as exc:  # noqa: BLE001
            summary["errors"].append({"year": year, "error": str(exc)})
            log.error("S01 %d falló: %s", year, exc)
    return summary


def _public_url(url: str) -> str:
    return url if url.startswith("http") else f"http://datos.energia.gob.ar{url}"


def run_s02(
    client: clickhouse_connect.driver.Client | None = None,
) -> dict:
    from pvm.catalog import fetch_package

    client = client or get_client()
    ensure_databases(client)
    state = StateStore()
    load_id = str(uuid.uuid4())
    retrieved_at = datetime.now(timezone.utc).isoformat()

    package = fetch_package(config.PRODUCTION_PACKAGE_ID)
    wells_resource = None
    for r in package.get("resources", []):
        if (r.get("name") or "") == "Capítulo IV - Pozos":
            wells_resource = r
            break
    if not wells_resource:
        raise RuntimeError("recurso Capítulo IV - Pozos no encontrado en CKAN")

    rec = ResourceRecord(
        resource_id=wells_resource["id"],
        url=_public_url(wells_resource["url"]),
        name="Capítulo IV - Pozos",
        last_modified=str(wells_resource.get("last_modified") or ""),
        format=wells_resource.get("format", "CSV"),
    )

    prev = state.get(rec.resource_id)
    dest = config.LANDING_DIR / "s02" / "capitulo-iv-pozos.csv"
    dest.parent.mkdir(parents=True, exist_ok=True)

    sha = download(rec.url, dest)

    if prev and prev.get("sha256") == sha and prev.get("loaded"):
        log.info("S02 sin cambios, omitiendo")
        return {"updated": [], "skipped": [rec.resource_id], "errors": []}

    rows = _count_rows(dest)
    log.info("S02: %d filas descargadas", rows)

    df = read_annual(dest)
    rename_map = {c: c.lower() for c in df.columns}
    df = df.rename(rename_map)

    tech_cols = pl.DataFrame({
        "_load_id": [load_id] * len(df),
        "_source_url": [rec.url] * len(df),
        "_resource_id": [rec.resource_id] * len(df),
        "_resource_last_modified": [rec.last_modified] * len(df),
        "_retrieved_at": [retrieved_at] * len(df),
        "_source_sha256": [sha] * len(df),
        "_row_number": list(range(1, len(df) + 1)),
    })
    df = df.with_columns(tech_cols)

    extra_cols = sorted(set(df.columns) - set(wells_column_names()) - {"_load_id", "_source_url", "_resource_id", "_resource_last_modified", "_retrieved_at", "_source_sha256", "_row_number"})
    if extra_cols:
        df = df.with_columns(pl.concat_str(extra_cols, separator="\x1f").alias("_extra_payload"))
    else:
        df = df.with_columns(pl.lit(None, dtype=pl.String).alias("_extra_payload"))

    table = "raw_energy.wells"
    insert_cols = wells_column_names() + ["_load_id", "_source_url", "_resource_id", "_resource_last_modified", "_retrieved_at", "_source_sha256", "_row_number", "_extra_payload"]

    client.command(f"ALTER TABLE {table} DELETE WHERE _resource_id = {{rid:String}}", parameters={"rid": rec.resource_id})

    chunk_size = 100_000
    for i in range(0, len(df), chunk_size):
        chunk = df.slice(i, min(chunk_size, len(df) - i))
        client.insert(table, chunk.select(insert_cols).rows(), column_names=insert_cols)

    state.set(rec.resource_id, {"sha256": sha, "rows": rows, "last_modified": rec.last_modified, "loaded": True})
    state.save()
    log.info("S02 cargado: %d filas", rows)
    return {"updated": [{"source": "s02", "resource_id": rec.resource_id, "rows": rows}], "skipped": [], "errors": []}


def wells_column_names() -> list[str]:
    return [
        "idpozo", "sigla", "empresa", "area", "cod_area", "yacimiento", "cod_yacimiento",
        "cuenca", "provincia", "formacion", "tipo_recurso", "sub_tipo_recurso",
        "cota", "profundidad", "clasificacion", "subclasificacion", "tipopozo",
        "tipoextraccion", "tipoestado", "gasplus",
        "adjiv_fecha_inicio_perf", "adjiv_fecha_fin_perf", "adjiv_fecha_inicio_term", "adjiv_fecha_fin_term",
        "geojson", "geom",
    ]