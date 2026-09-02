"""CLI del pipeline Pulso Vaca Muerta.

Comandos:
    ingest          descarga y carga fuentes a raw (subcomando --only s01)
    export          genera la release en public/data/releases/<release_id>
    sample          genera muestras reproducibles desde el landing

Uso:
    uv run python -m pvm.pipelines ingest --only 2026
"""

from __future__ import annotations

import argparse
import logging
import sys
import traceback


def main() -> int:
    parser = argparse.ArgumentParser(prog="pvm")
    sub = parser.add_subparsers(dest="command", required=True)

    ingest = sub.add_parser("ingest", help="ingesta fuentes a raw")
    ingest.add_argument("--only", type=int, default=None, help="año único a procesar")
    ingest.add_argument("--source", choices=["s01", "s02"], default="s01", help="fuente")

    sub.add_parser("export", help="genera release en public/data")
    sub.add_parser("sample", help="genera muestras reproducibles")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    try:
        if args.command == "ingest":
            from pvm.ddl import ensure_schema, get_client
            from pvm.ingest import run_s01, run_s02

            client = get_client()
            ensure_schema(client)
            if args.source == "s01":
                summary = run_s01(client=client, only_year=args.only)
            elif args.source == "s02":
                summary = run_s02(client=client)
            else:
                summary = {}
            print(summary)
            print(summary)
        elif args.command == "export":
            from pvm.export import main as export_main

            export_main()
        elif args.command == "sample":
            from pvm.sample import main as sample_main

            sample_main()
        return 0
    except Exception:
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())