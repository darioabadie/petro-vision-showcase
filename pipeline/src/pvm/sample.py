"""Generación de muestras reproducibles (reservoir sampling, semilla fija).

Las muestras permiten inspeccionar esquemas y desarrollar tests sin versionar
los archivos completos (que quedan en /tmp/pvm-landing).
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import polars as pl

from pvm import config

SEED = 20260827
SAMPLE_ROWS = {"s01": 120, "s02": 100, "s03": 100, "s04": 12}


def stable_hash(seed: int, line: int) -> int:
    return int(hashlib.sha256(f"{seed}:{line}".encode()).hexdigest(), 16)


def reservoir(path: Path, n: int, seed: int) -> pl.DataFrame:
    df = pl.read_csv(path, infer_schema_length=1000)
    total = df.height
    import numpy as np  # type: ignore[import-not-found]

    rng = np.random.default_rng(seed)
    sample_idx = set(int(i) for i in rng.choice(total, size=min(n, total), replace=False))
    return df.filter(pl.int_range(0, pl.len()).is_in(sorted(sample_idx)))


def main() -> None:
    out = config.REPO_ROOT / "data" / "samples"
    out.mkdir(parents=True, exist_ok=True)
    manifest: dict = {"seed": SEED, "files": []}

    s01_dir = config.LANDING_DIR / "s01"
    if s01_dir.exists():
        for path in sorted(s01_dir.glob("well_production_*.csv")):
            s = reservoir(path, SAMPLE_ROWS["s01"], SEED)
            name = f"01_well_production_{path.stem.rsplit('_', 1)[-1]}_sample.csv"
            s.write_csv(out / name)
            manifest["files"].append({name: {"rows": s.height, "source": path.name}})

    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Muestras en {out}")


if __name__ == "__main__":
    main()