"""Exporter: construye la release según el contrato (Task 1.5).

Lee las marts de ClickHouse y escribe:
    public/data/releases/<release_id>/app-data.json
    public/data/releases/<release_id>/downloads/monthly-production.csv
    public/data/latest.json

Valida contra contracts/*.schema.json (jsonschema) antes de escribir.
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import subprocess
from datetime import datetime, timezone

import polars as pl

from pvm import config, shape
from pvm.catalog import ResourceRecord, fetch_package
from pvm.ddl import get_client
from pvm.ingest import download

log = logging.getLogger("pvm.export")

RELEASE_ID = os.environ.get("PVM_RELEASE_ID", "2026-08")
HOME_HISTORY_MONTHS = 36
EXPLORER_MONTHS = 24
TOP_OPERATORS = 20

SCHEMA_POINTER = config.REPO_ROOT / "contracts" / "release-pointer.schema.json"
SCHEMA_APP = config.REPO_ROOT / "contracts" / "app-data.schema.json"

METHODOLOGY_DEFINITIONS = [
    {
        "id": "oil_production",
        "term": "Producción de petróleo",
        "definition": "Volumen de petróleo producido en el período, en metros cúbicos (m³).",
    },
    {
        "id": "gas_production",
        "term": "Producción de gas",
        "definition": "Volumen de gas producido en el período, en miles de m³.",
    },
    {
        "id": "productive_well",
        "term": "Pozo con producción positiva",
        "definition": "Pozo-formación que reportó producción positiva (petróleo o gas) en el período.",
    },
    {
        "id": "unconventional_share",
        "term": "Participación no convencional",
        "definition": "Porcentaje de la producción de petróleo atribuida a recursos no convencionales según tipo de recurso.",
    },
    {
        "id": "is_complete",
        "term": "Período completo",
        "definition": "Un mes se considera completo cuando no hay revisiones pendientes y está dentro del corte de datos.",
    },
    {
        "id": "last_complete_period",
        "term": "Último período completo",
        "definition": "Último mes para el cual todos los operadores presentaron su declaración jurada de producción.",
    },
]


def _public_url(url: str) -> str:
    return url if url.startswith("http") else f"http://datos.energia.gob.ar{url}"


def _resource_by_name(package_id: str, exact_name: str) -> ResourceRecord:
    package = fetch_package(package_id)
    for resource in package.get("resources", []):
        if (resource.get("name") or "") == exact_name:
            return ResourceRecord(
                resource_id=resource["id"],
                url=_public_url(resource["url"]),
                name=exact_name,
                last_modified=str(resource.get("last_modified") or ""),
                format=resource.get("format", "CSV"),
            )
    raise RuntimeError(f"recurso no encontrado: {package_id} / {exact_name}")


def _ensure_landing_file(subdir: str, filename: str, resource: ResourceRecord) -> str:
    dest = config.LANDING_DIR / subdir / filename
    if dest.exists():
        return str(dest)
    download(resource.url, dest)
    return str(dest)


def _read_csv_as_strings(path: str) -> pl.DataFrame:
    schema = pl.scan_csv(path).collect_schema()
    return pl.read_csv(
        path,
        schema_overrides={name: pl.String for name in schema.names()},
        null_values=[""],
    )


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _git_short_sha() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=config.REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if out.returncode == 0:
            return out.stdout.strip() or "unknown"
    except Exception:  # noqa: BLE001
        pass
    return "unknown"


def _query(client, sql: str) -> list[tuple]:
    return client.query(sql).result_rows


def query_series(client) -> list[dict]:
    rows = _query(
        client,
        """
        SELECT toString(month_date), oil_m3, gas_thousand_m3, water_m3,
               oil_conventional_m3, oil_nonconventional_m3,
               gas_conventional_thousand_m3, gas_nonconventional_thousand_m3,
               productive_wells, is_complete
        FROM analytics.mart_argentina_monthly_production
        ORDER BY month_date
        """,
    )
    return [
        {
            "period": r[0],
            "oil_m3": float(r[1]),
            "gas_thousand_m3": float(r[2]),
            "water_m3": float(r[3]),
            "oil_conventional_m3": float(r[4]),
            "oil_nonconventional_m3": float(r[5]),
            "gas_conventional_thousand_m3": float(r[6]),
            "gas_nonconventional_thousand_m3": float(r[7]),
            "productive_wells": float(r[8]),
            "is_complete": bool(r[9]),
        }
        for r in rows
    ]


def query_dimensions(client) -> dict:
    def distinct(expr: str, table: str) -> list[str]:
        rows = _query(
            client,
            f"SELECT DISTINCT {expr} FROM {table} WHERE notEmpty({expr}) ORDER BY 1",
        )
        return [r[0] for r in rows]

    def distinct_as_label(expr: str, table: str) -> list[str]:
        rows = _query(
            client,
            f"SELECT DISTINCT {expr} AS v FROM {table} WHERE notEmpty(v) ORDER BY 1",
        )
        return [r[0] for r in rows]

    ops = _query(
        client,
        """
        SELECT operator_slug, operator_canonical
        FROM analytics.dim_operator
        ORDER BY operator_canonical
        """,
    )
    return {
        "operators": [{"slug": r[0], "label": r[1]} for r in ops],
        "resource_types": distinct("resource_type", "analytics.fact_well_monthly_production"),
        "resource_subtypes": distinct("resource_subtype", "analytics.fact_well_monthly_production"),
        "provinces": distinct_as_label("province", "analytics.stg_energy__well_production"),
        "basins": distinct_as_label("basin", "analytics.stg_energy__well_production"),
        "areas": distinct_as_label("area", "analytics.stg_energy__well_production"),
        "fields": distinct_as_label("field", "analytics.stg_energy__well_production"),
        "formations": distinct_as_label("formation", "analytics.stg_energy__well_production"),
    }


def query_operator_series(client) -> list[dict]:
    rows = _query(
        client,
        """
        SELECT toString(month_date), operator_slug, operator_name, oil_m3,
               gas_thousand_m3, productive_wells
        FROM (
            SELECT month_date,
                   lower(replaceRegexpAll(trim(both '-' from replaceRegexpAll(trim(lower(o.operator_canonical)), '[^a-z0-9]+', '-')), '-+', '-')) AS operator_slug,
                   o.operator_canonical AS operator_name,
                   sum(f.oil_m3) AS oil_m3,
                   sum(f.gas_thousand_m3) AS gas_thousand_m3,
                   countDistinctIf(f.well_id, f.productive_flag = 1) AS productive_wells
            FROM analytics.fact_well_monthly_production f
            JOIN analytics.dim_operator o ON f.operator_slug = o.operator_slug
            GROUP BY month_date, o.operator_canonical
        )
        ORDER BY month_date, operator_slug
        """,
    )
    return [
        {
            "period": r[0],
            "operator_slug": r[1],
            "operator_name": r[2],
            "oil_m3": float(r[3]),
            "gas_thousand_m3": float(r[4]),
            "productive_wells": float(r[5]),
        }
        for r in rows
    ]


def query_explorer_rows(client, series: list[dict]) -> list[dict]:
    complete_map = {s["period"]: s["is_complete"] for s in series}
    periods = [s["period"] for s in series]
    window = periods[-EXPLORER_MONTHS:] if len(periods) > EXPLORER_MONTHS else periods
    rows = _query(
        client,
        f"""
        SELECT toString(period) AS period, operator_slug, operator_name,
               province, basin, area, field, formation,
               resource_type, resource_subtype,
               oil_m3, gas_thousand_m3, water_m3, productive_wells
        FROM (
            SELECT month_date AS period,
                   lower(replaceRegexpAll(trim(both '-' from replaceRegexpAll(trim(lower(o.operator_canonical)), '[^a-z0-9]+', '-')), '-+', '-')) AS operator_slug,
                   o.operator_canonical AS operator_name,
                   province, basin, area, field, formation,
                   resource_type, resource_subtype,
                   sum(f.oil_m3) AS oil_m3,
                   sum(f.gas_thousand_m3) AS gas_thousand_m3,
                   sum(f.water_m3) AS water_m3,
                   countDistinctIf(f.well_id, f.productive_flag = 1) AS productive_wells,
                   count() AS n_rows
            FROM analytics.fact_well_monthly_production f
            JOIN analytics.dim_operator o ON f.operator_slug = o.operator_slug
            WHERE month_date >= toDate('{window[0]}')
            GROUP BY month_date, o.operator_canonical,
                     province, basin, area, field, formation,
                     resource_type, resource_subtype
            HAVING oil_m3 > 0 OR gas_thousand_m3 > 0 OR productive_wells > 0
        )
        ORDER BY period, operator_slug
        """,
    )
    # Agregamos por (period, operator) tomando dimensiones por moda.
    dim_labels = ("province", "basin", "area", "field", "formation")
    grouped: dict[tuple[str, str], dict] = {}
    for r in rows:
        key = (r[0], r[1])
        acc = grouped.get(key)
        if acc is None:
            acc = {
                "oil_m3": 0.0,
                "gas_thousand_m3": 0.0,
                "water_m3": 0.0,
                "productive_wells": 0.0,
                "operator_name": r[2],
                **{dim: {} for dim in dim_labels},
            }
            grouped[key] = acc
        for i, dim in enumerate(dim_labels):
            value = r[3 + i] or ""
            acc[dim][value] = acc[dim].get(value, 0) + 1
        acc["oil_m3"] += float(r[10])
        acc["gas_thousand_m3"] += float(r[11])
        acc["water_m3"] += float(r[12])
        acc["productive_wells"] += float(r[13])
    out: list[dict] = []
    for (period, slug), acc in grouped.items():
        out.append(
            {
                "period": period,
                "operator_slug": slug,
                "operator_name": acc["operator_name"],
                "province": shape.pick_mode(list(acc["province"].items())),
                "basin": shape.pick_mode(list(acc["basin"].items())),
                "area": shape.pick_mode(list(acc["area"].items())),
                "field": shape.pick_mode(list(acc["field"].items())),
                "formation": shape.pick_mode(list(acc["formation"].items())),
                "resource_type": "TOTAL",
                "resource_subtype": "",
                "oil_m3": round(acc["oil_m3"]),
                "gas_thousand_m3": round(acc["gas_thousand_m3"]),
                "water_m3": round(acc["water_m3"]),
                "productive_wells": round(acc["productive_wells"]),
                "is_complete": bool(complete_map.get(period, False)),
            }
        )
    out.sort(key=lambda r: (r["period"], r["operator_slug"]))
    return out


def query_operator_rankings(client, op_series: list[dict]) -> tuple[list, list]:
    periods = sorted({r["period"] for r in op_series})
    if not periods:
        return [], []
    last = periods[-1]
    prev = periods[periods.index(last) - 1] if len(periods) > 1 else None
    yoy = periods[periods.index(last) - 12] if len(periods) > 12 else None

    def slice_p(p: str | None) -> dict[str, dict]:
        if not p:
            return {}
        return {r["operator_slug"]: r for r in op_series if r["period"] == p}

    cur, prev_s, yoy_s = slice_p(last), slice_p(prev), slice_p(yoy)
    total_oil = sum(r["oil_m3"] for r in cur.values()) or 1
    ranked = sorted(cur.values(), key=lambda r: r["oil_m3"], reverse=True)[:TOP_OPERATORS]
    rankings: list[dict] = []
    for i, r in enumerate(ranked, 1):
        slug = r["operator_slug"]
        p = prev_s.get(slug)
        y = yoy_s.get(slug)
        rankings.append(
            {
                "rank": i,
                "slug": slug,
                "name": r["operator_name"],
                "oil_m3": round(r["oil_m3"]),
                "gas_thousand_m3": round(r["gas_thousand_m3"]),
                "share_oil_pct": round(r["oil_m3"] / total_oil * 100, 1),
                "change_mom_pct": shape.pct_change(r["oil_m3"], p["oil_m3"] if p else None),
                "change_yoy_pct": shape.pct_change(r["oil_m3"], y["oil_m3"] if y else None),
                "productive_wells": round(r["productive_wells"]),
            }
        )
    profiles = [_operator_profile(client, r, last) for r in rankings]
    return rankings, profiles


def _operator_profile(client, ranking: dict, last_period: str) -> dict:
    slug = ranking["slug"]
    name = ranking["name"]
    area_rows = _query(
        client,
        f"""
        SELECT ifNull(area, 'Sin dato') AS area, sum(f.oil_m3) AS oil_m3
        FROM analytics.fact_well_monthly_production f
        JOIN analytics.dim_operator o ON f.operator_slug = o.operator_slug
        WHERE o.operator_canonical = '{name}' AND f.month_date = toDate('{last_period}')
        GROUP BY area ORDER BY oil_m3 DESC LIMIT 8
        """,
    )
    total_area = sum(r[1] for r in area_rows) or 1
    resource_rows = _query(
        client,
        f"""
        SELECT ifNull(f.resource_type, 'SIN DATO'), sum(f.oil_m3)
        FROM analytics.fact_well_monthly_production f
        JOIN analytics.dim_operator o ON f.operator_slug = o.operator_slug
        WHERE o.operator_canonical = '{name}' AND f.month_date = toDate('{last_period}')
        GROUP BY 1 ORDER BY 2 DESC
        """,
    )
    total_res = sum(r[1] for r in resource_rows) or 1
    new_well_rows = _query(
        client,
        f"""
        WITH fw AS (
            SELECT f.well_id, o.operator_canonical AS op,
                   minIf(f.month_date, f.productive_flag = 1) AS firstm
            FROM analytics.fact_well_monthly_production f
            JOIN analytics.dim_operator o ON f.operator_slug = o.operator_slug
            GROUP BY f.well_id, o.operator_canonical
        )
        SELECT toString(toStartOfMonth(firstm)) AS m, count()
        FROM fw
        WHERE op = '{name}'
          AND firstm >= toDate('{last_period}') - INTERVAL 12 MONTH
          AND firstm <= toDate('{last_period}')
        GROUP BY m ORDER BY m
        """,
    )
    return {
        "slug": slug,
        "name": ranking["name"],
        "alias_note": None,
        "area_mix": [
            {"label": r[0], "oil_m3": round(r[1]), "share_pct": round(r[1] / total_area * 100, 1)}
            for r in area_rows
            if r[0]
        ],
        "resource_mix": [
            {"label": r[0], "value_pct": round(r[1] / total_res * 100, 1)} for r in resource_rows if r[0]
        ],
        "new_productive_wells": [{"period": r[0], "count": int(r[1])} for r in new_well_rows],
        "cohort_ids": [],
    }


def query_quality_sources(client) -> tuple[list[dict], int, list[dict]]:
    rows = _query(
        client,
        """
        SELECT _resource_id, max(_resource_last_modified), max(_retrieved_at),
               count(), max(_source_sha256)
        FROM raw_energy.well_production
        GROUP BY _resource_id ORDER BY _resource_id
        """,
    )
    from pvm.catalog import annual_production_resources, fetch_package

    package = None
    try:
        package = annual_production_resources(fetch_package(config.PRODUCTION_PACKAGE_ID))
    except Exception as exc:  # noqa: BLE001
        log.warning("no se pudo consultar el catálogo para calidad: %s", exc)
    sources = []
    total_rows = 0
    checks = []
    for rid, last_mod, retrieved, n, sha in rows:
        year = ""
        if package:
            for y, rec in package.items():
                if rec.resource_id == rid:
                    year = str(y)
                    break
        sources.append(
            {
                "source_id": f"s01-{year}" if year else f"s01-{rid[:8]}",
                "name": f"Producción por pozo {year}" if year else "Producción por pozo",
                "status": "ok",
                "source_last_modified": last_mod,
                "retrieved_at": retrieved,
                "row_count": int(n),
                "checksum_short": (sha or "")[:12],
                "revision_detected": False,
            }
        )
        total_rows += int(n)
    return sources, total_rows, checks


def build_map_data(client, last_complete_period: str) -> dict:
    rows = _query(
        client,
        f"""
        SELECT w.well_id, w.well_label, w.geojson_raw,
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
        """,
    )
    latest_info: dict = {}
    for row in rows:
        well_id = str(row[0])
        latest_info[well_id] = {
            "label": row[1] or well_id,
            "geojson_raw": row[2],
            "well_status": row[3] or "Sin dato",
            "formation": (row[4] or "").upper(),
            "resource_type": row[5] or "",
            "area": row[6] or "",
            "province": row[7] or "",
            "operator_slug": row[8],
            "operator_name": row[9],
            "last_oil_m3": round(float(row[10] or 0)),
            "last_gas_thousand_m3": round(float(row[11] or 0)),
        }

    well_features: list[dict] = []
    for well_id, info in latest_info.items():
        try:
            geometry = json.loads(info["geojson_raw"])
        except Exception:
            continue
        if info["formation"] != "VACA MUERTA":
            continue
        well_features.append({
            "type": "Feature",
            "geometry": geometry,
            "properties": {
                "well_id": well_id,
                "label": info["label"],
                "operator_slug": info["operator_slug"],
                "operator_name": info["operator_name"],
                "area": info["area"],
                "formation": info["formation"],
                "resource_type": info["resource_type"],
                "well_status": info["well_status"],
                "last_oil_m3": info["last_oil_m3"],
                "last_gas_thousand_m3": info["last_gas_thousand_m3"],
            },
        })

    return {
        "initial_view": {"longitude": -69.25, "latitude": -38.35, "zoom": 6},
        "color_modes": ["wells", "operator", "area"],
        "wells_geojson": {"type": "FeatureCollection", "features": well_features},
        "trajectories_geojson": {"type": "FeatureCollection", "features": []},
    }


def build_quality(sources: list[dict], total_rows: int, series: list[dict], cutoff: str, client) -> dict:
    import json

    dup_fact = _query(client, """SELECT count() FROM (SELECT well_id, month_date, count() AS n FROM analytics.fact_well_monthly_production GROUP BY well_id, month_date HAVING n > 1)""")[0][0]

    null_keys = _query(client, "SELECT count() FROM analytics.fact_well_monthly_production WHERE well_id = '' OR month_date IS NULL OR operator_slug = ''")[0][0]

    zero_months = _query(client, "SELECT count() FROM analytics.mart_argentina_monthly_production WHERE oil_m3 <= 0 AND gas_thousand_m3 <= 0")[0][0]

    neg_production = _query(client, "SELECT count() FROM analytics.stg_energy__well_production WHERE oil_m3 < 0 OR gas_thousand_m3 < 0 OR water_m3 < 0")[0][0]

    pending_ops = _query(client, "SELECT count() FROM analytics.dim_operator WHERE review_status = 'pending_review'")[0][0]

    future_dates = _query(client, "SELECT count() FROM analytics.stg_energy__well_production WHERE month_date > toDate('2026-09-01')")[0][0]

    checks = [
        {
            "check_id": "unique_well_monthly",
            "label": "Sin duplicados (pozo, mes) en el hecho de producci\u00f3n",
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
            "label": "Todos los meses con producci\u00f3n positiva",
            "severity": "high",
            "status": "passed" if zero_months == 0 else "failed",
            "affected_rows": int(zero_months),
        },
        {
            "check_id": "negative_production",
            "label": "Sin producci\u00f3n negativa en staging",
            "severity": "warning",
            "status": "passed" if neg_production == 0 else "warning",
            "affected_rows": int(neg_production),
        },
        {
            "check_id": "operator_canonical_review",
            "label": "Operadores con nombre can\u00f3nico pendiente de revisi\u00f3n",
            "severity": "warning",
            "status": "passed" if pending_ops == 0 else "warning",
            "affected_rows": int(pending_ops),
        },
        {
            "check_id": "future_dates",
            "label": "Fechas futuras en datos de producci\u00f3n",
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
            "status": "warning",
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


def _build_monthly_csv(series: list[dict]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["period", "product", "resource", "value"])
    for s in series:
        p = s["period"]
        writer.writerow([p, "oil", "TOTAL", s["oil_m3"]])
        writer.writerow([p, "oil", "convencional", s["oil_conventional_m3"]])
        writer.writerow([p, "oil", "no_convencional", s["oil_nonconventional_m3"]])
        writer.writerow([p, "gas", "TOTAL", s["gas_thousand_m3"]])
        writer.writerow([p, "gas", "convencional", s["gas_conventional_thousand_m3"]])
        writer.writerow([p, "gas", "no_convencional", s["gas_nonconventional_thousand_m3"]])
        writer.writerow([p, "water", "TOTAL", s["water_m3"]])
    return buf.getvalue()


def _validate(payload: dict, schema_path, *, check_format: bool = False) -> None:
    import jsonschema

    schema = json.loads(schema_path.read_text())
    validator = jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.FormatChecker() if check_format else None
    )
    errors = sorted(validator.iter_errors(payload), key=lambda e: list(e.path))
    if errors:
        detail = "\n".join(f"  {list(e.path)}: {e.message}" for e in errors[:30])
        raise ValueError(f"payload inválido contra {schema_path.name}:\n{detail}")


def main() -> None:
    client = get_client()
    series = query_series(client)
    if not series:
        raise RuntimeError("no hay serie mensual (mart vacía): correr dbt primero")

    release_dir = config.RELEASES_DIR / RELEASE_ID
    downloads_dir = release_dir / "downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)

    csv_text = _build_monthly_csv(series)
    csv_path = downloads_dir / "monthly-production.csv"
    csv_path.write_text(csv_text, encoding="utf-8")

    generated_at = iso_now()
    versioned = versioned_payload(client, series, generated_at)
    versioned["downloads"][0]["size_bytes"] = csv_path.stat().st_size
    _validate(versioned, SCHEMA_APP, check_format=True)

    app_path = release_dir / "app-data.json"
    app_path.write_text(json.dumps(versioned, ensure_ascii=False, indent=2), encoding="utf-8")

    pointer = {
        "release_id": RELEASE_ID,
        "data_cutoff": versioned["release"]["data_cutoff"],
        "generated_at": versioned["release"]["generated_at"],
        "schema_version": versioned["schema_version"],
        "status": versioned["release"]["status"],
        "base_path": f"/data/releases/{RELEASE_ID}/",
        "app_data_file": "app-data.json",
    }
    _validate(pointer, SCHEMA_POINTER)
    config.LATEST_PATH.write_text(json.dumps(pointer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    log.info(
        "release %s generada (app-data %.1f MB, csv %.1f KB) y latest.json actualizado",
        RELEASE_ID,
        app_path.stat().st_size / 1e6,
        csv_path.stat().st_size / 1e3,
    )


def versioned_payload(client, series: list[dict], generated_at: str | None = None) -> dict:
    generated_at = generated_at or iso_now()
    periods = [s["period"] for s in series]
    index = {p: i for i, p in enumerate(periods)}
    if not index:
        raise RuntimeError("serie vacía en versioned_payload")
    last_complete = next(
        (s["period"] for s in reversed(series) if s.get("is_complete")),
        periods[-1],
    )
    dims = query_dimensions(client)
    operator_series = query_operator_series(client)
    explorer_rows = query_explorer_rows(client, series)
    rankings, profiles = query_operator_rankings(client, operator_series)
    map_data = build_map_data(client, last_complete)
    kpis = shape.build_kpis(series, index)
    contributions = shape.build_contributions(operator_series, last_complete)
    sources, total_rows, _ = query_quality_sources(client)

    history_start = max(0, len(series) - HOME_HISTORY_MONTHS)
    history = [{"period": s["period"], **{k: s[k] for k in (
        "oil_m3", "gas_thousand_m3", "water_m3",
        "oil_conventional_m3", "oil_nonconventional_m3",
        "gas_conventional_thousand_m3", "gas_nonconventional_thousand_m3",
        "productive_wells",
    )}, "is_complete": s["is_complete"]} for s in series[history_start:]]

    warning_msg = (
        "Release provisoria en estado 'warning': decisiones metodológicas §22 y "
        "validación pre-corte en curso. Los módulos de mapas, cohortes y "
        "completaciones se incorporan en fases posteriores del pipeline."
    )
    payload = {
        "schema_version": "1.0",
        "release": {
            "release_id": RELEASE_ID,
            "status": "warning",
            "is_mock": False,
            "data_cutoff": config.DATA_CUTOFF_DEFAULT,
            "generated_at": generated_at,
            "last_complete_period": last_complete,
            "pipeline_commit": _git_short_sha(),
            "warning": warning_msg,
        },
        "site": {
            "name": "Pulso Vaca Muerta",
            "tagline": "Datos abiertos sobre producción, pozos y productividad de los hidrocarburos argentinos.",
            "locale": "es-AR",
            "default_scope": "Argentina",
            "methodology_url": "/metodologia",
            "source_label": "Secretaría de Energía de la Nación — datos abiertos",
            "repository_url": "https://github.com/darioabadie/petro-vision-showcase",
        },
        "filter_options": {
            "periods": periods,
            "products": [
                {"id": "oil", "label": "Petróleo", "unit": "m³"},
                {"id": "gas", "label": "Gas", "unit": "miles de m³"},
                {"id": "water", "label": "Agua", "unit": "m³"},
            ],
            "resource_types": dims["resource_types"],
            "resource_subtypes": dims["resource_subtypes"],
            "operators": dims["operators"],
            "provinces": dims["provinces"],
            "basins": dims["basins"],
            "areas": dims["areas"],
            "fields": dims["fields"],
            "formations": dims["formations"],
        },
        "home": {
            "kpis": kpis,
            "production_history": history,
            "operator_contributions": contributions,
            "insights": shape.build_insights(series, contributions, last_complete, config.DATA_CUTOFF_DEFAULT, True),
        },
        "explorer": {
            "default_state": {
                "product": "oil",
                "metric": "production",
                "start_period": explorer_rows[0]["period"] if explorer_rows else None,
                "end_period": explorer_rows[-1]["period"] if explorer_rows else None,
                "compare_by": "operator",
            },
            "rows": explorer_rows,
        },
        "operators": {"rankings": rankings, "profiles": profiles},
        "cohorts": {
            "minimum_sample_size": 20,
            "default_metric": "oil_m3_per_well",
            "curves": [],
            "cumulative_summary": [],
        },
        "completions": {
            "coverage": {
                "production_wells": 0,
                "wells_with_fracture_record": 0,
                "matched_wells": 0,
                "match_rate_pct": 0,
                "valid_horizontal_length_pct": 0,
                "valid_stage_count_pct": 0,
                "eligible_for_normalization": 0,
            },
            "bucket_stats": [],
            "scatter": [],
            "disclaimer": (
                "Datos de completación (S04) pendientes de integrar. "
                "La sección se completa en la Fase 2 del pipeline."
            ),
        },
        "map": map_data,
        "quality": build_quality(sources, total_rows, series, config.DATA_CUTOFF_DEFAULT, client),
        "downloads": [
            {
                "id": "monthly-production",
                "title": "Producción mensual agregada",
                "description": "Serie mensual de petróleo, gas y agua por recurso.",
                "format": "CSV",
                "url": f"/data/releases/{RELEASE_ID}/downloads/monthly-production.csv",
                "size_bytes": 0,
                "updated_at": generated_at,
            }
        ],
        "methodology": {
            "definitions": METHODOLOGY_DEFINITIONS,
            "sources": [
                {
                    "source_id": "s01",
                    "name": "Producción de petróleo y gas por pozo (declaraciones juradas mensuales)",
                    "publisher": "Secretaría de Energía de la Nación",
                    "url": "https://datos.gob.ar/dataset/energia-produccion-de-petroleo-y-gas-por-pozo",
                    "license": "Datos abiertos Argen",
                }
            ],
            "caveats": [
                "Release provisoria: estatus warning hasta completar la validación pre-corte.",
                "Decisiones metodológicas §22 (última revisión): pozo-formación como unidad, corte explícito.",
                "Mapas, cohortes y completaciones se publicarán en la Fase 2.",
                "Los volúmenes provienen de las declaraciones juradas; pueden diferir de balances oficiales.",
            ],
        },
        "release_history": [
            {
                "release_id": RELEASE_ID,
                "data_cutoff": config.DATA_CUTOFF_DEFAULT,
                "published_at": generated_at,
                "status": "warning",
                "is_current": True,
            }
        ],
    }
    return payload


def main_cli() -> None:
    main()


if __name__ == "__main__":
    main()
