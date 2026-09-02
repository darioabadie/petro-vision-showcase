"""Catálogo de fuentes CKAN: descubre recursos, clasifica y mantiene estado.

El Estado local contiene para cada recurso el SHA-256, tamaño y
last_modified de la última vez que se ingirió. Un cambio de checksum
obliga a reprocesar aunque last_modified no cambie.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

import requests

from pvm import config

ANNUAL_RE = re.compile(r"Producci[óo]n de Pozos de Gas y Petr[óo]leo[^\d]*(\d{4})")


@dataclass(frozen=True)
class ResourceRecord:
    resource_id: str
    url: str
    name: str
    last_modified: str
    format: str = "CSV"


def fetch_package(package_id: str) -> dict:
    resp = requests.get(config.CKAN_API, params={"id": package_id}, timeout=60)
    resp.raise_for_status()
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"CKAN error: {payload}")
    return payload["result"]


def annual_production_resources(package: dict) -> dict[int, ResourceRecord]:
    """Devuelve {year: ResourceRecord} con la variante canónica (estándar).

    Decide: excluye nombres "(DDJJ abiertas y cerradas)" y elige, para cada
    año, el recurso estándar con last_modified más reciente (decisión §22#3).
    """
    by_year: dict[int, list[ResourceRecord]] = {}
    for r in package.get("resources", []):
        name = r.get("name") or ""
        m = ANNUAL_RE.search(name)
        if not m:
            continue
        if "DDJJ abiertas y cerradas" in name:
            continue
        year = int(m.group(1))
        rec = ResourceRecord(
            resource_id=r["id"],
            url=r["url"],
            name=name,
            last_modified=str(r.get("last_modified") or ""),
            format=r.get("format", "CSV"),
        )
        by_year.setdefault(year, []).append(rec)
    result: dict[int, ResourceRecord] = {}
    for year, recs in by_year.items():
        result[year] = max(recs, key=lambda rec: rec.last_modified)
    return dict(sorted(result.items()))


class StateStore:
    """Manifest de ingesta: qué se descargó e ingirió por resource_id."""

    def __init__(self, state_dir: Path | None = None) -> None:
        self.path = state_dir or config.STATE_DIR / "state.json"
        self.data: dict[str, dict] = {}
        self.load()

    def load(self) -> None:
        if self.path.exists():
            self.data = json.loads(self.path.read_text(encoding="utf-8"))

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.data, indent=2), encoding="utf-8")

    def get(self, resource_id: str) -> dict | None:
        return self.data.get(resource_id)

    def set(self, resource_id: str, meta: dict) -> None:
        self.data[resource_id] = meta
        self.save()


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while block := f.read(chunk):
            h.update(block)
    return h.hexdigest()


if __name__ == "__main__":
    for year, rec in annual_production_resources(fetch_package(config.PRODUCTION_PACKAGE_ID)).items():
        print(year, rec.resource_id[:8], rec.name[:60], asdict(rec)["url"][:60])