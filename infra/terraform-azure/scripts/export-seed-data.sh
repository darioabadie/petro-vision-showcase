#!/usr/bin/env bash
# Exports the real analytics.fact_well_monthly_production table from the
# main pipeline's local ClickHouse (docker-compose, container pvm-clickhouse)
# to CSV, so the Azure cluster gets seeded with real data instead of
# something invented. Requires `make up && make dbt` to have been run
# already in the repo root.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_DIR="$SCRIPT_DIR/../seed"
mkdir -p "$SEED_DIR"

if ! docker ps --format '{{.Names}}' | grep -qx pvm-clickhouse; then
  echo "error: container 'pvm-clickhouse' is not running. Run 'make up' in the repo root first." >&2
  exit 1
fi

OUT_FILE="$SEED_DIR/fact_well_monthly_production.csv"

docker exec pvm-clickhouse clickhouse-client \
  --user default --password pvm_dev \
  --query "SELECT * FROM analytics.fact_well_monthly_production FORMAT CSV" \
  > "$OUT_FILE"

echo "Exported $(wc -l < "$OUT_FILE" | tr -d ' ') rows to $OUT_FILE"
