#!/usr/bin/env bash
# Loads the CSV produced by export-seed-data.sh into the Azure cluster's
# well_production_distributed table, via the public IP of node ch-s1-r1.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/.."
SEED_FILE="$TF_DIR/seed/fact_well_monthly_production.csv"
CLICKHOUSE_IMAGE="${CLICKHOUSE_IMAGE:-clickhouse/clickhouse-server:24.8}"

if [[ ! -s "$SEED_FILE" ]]; then
  echo "error: $SEED_FILE not found or empty. Run export-seed-data.sh first." >&2
  exit 1
fi

NODE1_IP=$(cd "$TF_DIR" && terraform output -json node_public_ips | jq -r '."ch-s1-r1"')
if [[ -z "$NODE1_IP" || "$NODE1_IP" == "null" ]]; then
  echo "error: could not read node ch-s1-r1 public IP from terraform output." >&2
  exit 1
fi

echo "Loading $(wc -l < "$SEED_FILE" | tr -d ' ') rows into well_production_distributed via $NODE1_IP ..."

docker run --rm -i "$CLICKHOUSE_IMAGE" clickhouse-client \
  --host "$NODE1_IP" --port 9000 \
  --query "INSERT INTO cluster_demo.well_production_distributed FORMAT CSV" \
  < "$SEED_FILE"

echo "Load complete."
