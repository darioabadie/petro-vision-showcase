"""Configuración central del pipeline Pulso Vaca Muerta.

Todo se lee de variables de entorno con defaults de desarrollo local.
Ningún secreto real se versiona.
"""

from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PUBLIC_DATA = REPO_ROOT / "public" / "data"
RELEASES_DIR = PUBLIC_DATA / "releases"
LATEST_PATH = PUBLIC_DATA / "latest.json"

LANDING_DIR = Path(os.environ.get("PVM_LANDING", "/tmp/pvm-landing"))
HISTORY_DIR = REPO_ROOT / "pipeline" / "history"
STATE_DIR = LANDING_DIR / "state"

CKAN_API = "https://datos.gob.ar/api/3/action/package_show"
PRODUCTION_PACKAGE_ID = "produccion-de-petroleo-y-gas-por-pozo"
FRACTURES_PACKAGE_ID = "datos-de-fractura-de-pozos-adjunto-iv"
TRAJECTORIES_PACKAGE_ID = "trayectoria-de-pozos"
SERIES_API = "https://apis.datos.gob.ar/series/api/series"

CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "127.0.0.1")
CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", "8123"))
CLICKHOUSE_USER = os.environ.get("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.environ.get("CLICKHOUSE_PASSWORD", "pvm_dev")
CLICKHOUSE_DATABASE = os.environ.get("CLICKHOUSE_DATABASE", "default")

DATA_CUTOFF_DEFAULT = "2026-07-31"
FIRST_YEAR = 2006
LAST_YEAR = 2026

# Mínimo de filas esperado por recurso anual de producción (umbral de sanity).
MIN_ANNUAL_ROWS = 50_000


def ensure_dirs() -> None:
    for d in (LANDING_DIR, STATE_DIR, HISTORY_DIR):
        d.mkdir(parents=True, exist_ok=True)