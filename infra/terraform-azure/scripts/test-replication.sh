#!/usr/bin/env bash
# Proves the cluster actually replicates and shards, not just that it's up:
#   1. insert on shard1/replica1 -> confirm it appears on shard1/replica2
#   2. stop replica2 -> confirm the Distributed table still returns full results
#   3. restart replica2 -> confirm it resyncs
#   4. compare an aggregate on the Distributed table against the same
#      aggregate on the original single-node analytics.fact_well_monthly_production
# Exits non-zero on the first check that fails.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/.."
CLICKHOUSE_IMAGE="${CLICKHOUSE_IMAGE:-clickhouse/clickhouse-server:24.8}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_azure}"
ADMIN_USER="${ADMIN_USER:-pvmadmin}"
TEST_WELL_ID="__replication_test__"

pass=0
fail=0

log()  { echo "[test] $*"; }
ok()   { echo "  PASS: $*"; pass=$((pass+1)); }
bad()  { echo "  FAIL: $*"; fail=$((fail+1)); }

ch() { # ch <public_ip> <query>
  docker run --rm "$CLICKHOUSE_IMAGE" clickhouse-client \
    --host "$1" --port 9000 --query "$2"
}

ssh_run() { # ssh_run <public_ip> <remote_cmd>
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 \
    "$ADMIN_USER@$1" "$2"
}

cd "$TF_DIR"
R1_IP=$(terraform output -json node_public_ips | jq -r '."ch-s1-r1"')
R2_IP=$(terraform output -json node_public_ips | jq -r '."ch-s1-r2"')

if [[ -z "$R1_IP" || "$R1_IP" == "null" || -z "$R2_IP" || "$R2_IP" == "null" ]]; then
  echo "error: could not resolve node public IPs from terraform output." >&2
  exit 1
fi

log "shard1/replica1 = $R1_IP, shard1/replica2 = $R2_IP"

# --- 1. insert on replica1, confirm it lands on replica2 ---------------
log "1) inserting test row on replica1 and checking replica2 ..."
ch "$R1_IP" "
  INSERT INTO cluster_demo.well_production_local
  (well_id, month_date, operator_slug, province, basin, area, field, formation,
   resource_type, resource_subtype, oil_m3, gas_thousand_m3, water_m3,
   productive_flag, is_partial, is_rectified, _record_version)
  VALUES
  ('$TEST_WELL_ID', '2026-01-01', 'test-op', 'test-prov', 'test-basin', 'test-area',
   'test-field', 'TEST', 'test', 'test', 1.0, 1.0, 0.0, 1, 0, 0, now64())
"
sleep 5
count_r2=$(ch "$R2_IP" "SELECT count() FROM cluster_demo.well_production_local WHERE well_id = '$TEST_WELL_ID'")
if [[ "$count_r2" -ge 1 ]]; then
  ok "test row replicated to shard1/replica2 (count=$count_r2)"
else
  bad "test row NOT found on shard1/replica2 after 5s"
fi

# --- 2. stop replica2, confirm Distributed table still serves full data ---
log "2) capturing baseline count, stopping replica2, re-checking via Distributed ..."
baseline_count=$(ch "$R1_IP" "SELECT count() FROM cluster_demo.well_production_distributed")
ssh_run "$R2_IP" "sudo systemctl stop pvm-clickhouse"
sleep 3
after_stop_count=$(ch "$R1_IP" "SELECT count() FROM cluster_demo.well_production_distributed")
if [[ "$after_stop_count" == "$baseline_count" ]]; then
  ok "Distributed table unaffected by dead replica (count=$after_stop_count)"
else
  bad "Distributed count changed after killing a replica: baseline=$baseline_count after=$after_stop_count"
fi

# --- 3. restart replica2, confirm resync ---------------------------------
log "3) restarting replica2 and waiting for resync ..."
ssh_run "$R2_IP" "sudo systemctl start pvm-clickhouse"
resynced=0
for i in $(seq 1 12); do
  sleep 5
  readonly_flag=$(ch "$R2_IP" "SELECT is_readonly FROM system.replicas WHERE table = 'well_production_local'" 2>/dev/null || echo "1")
  count_r2_after=$(ch "$R2_IP" "SELECT count() FROM cluster_demo.well_production_local" 2>/dev/null || echo "-1")
  if [[ "$readonly_flag" == "0" && "$count_r2_after" == "$(ch "$R1_IP" "SELECT count() FROM cluster_demo.well_production_local")" ]]; then
    resynced=1
    break
  fi
done
if [[ "$resynced" == "1" ]]; then
  ok "replica2 resynced on its own (is_readonly=0, counts match)"
else
  bad "replica2 did not resync within 60s"
fi

# --- 4. aggregate comparison: cluster vs original single-node table ------
log "4) comparing aggregate on Distributed table vs original single-node table ..."
cluster_agg=$(ch "$R1_IP" "
  SELECT sum(oil_m3) FROM cluster_demo.well_production_distributed
  WHERE well_id != '$TEST_WELL_ID'
")
original_agg=$(docker exec pvm-clickhouse clickhouse-client \
  --user default --password pvm_dev \
  --query "SELECT sum(oil_m3) FROM analytics.fact_well_monthly_production")

if awk -v a="$cluster_agg" -v b="$original_agg" 'BEGIN { d = a - b; if (d < 0) d = -d; exit !(d < 0.01) }'; then
  ok "sum(oil_m3) matches: cluster=$cluster_agg original=$original_agg"
else
  bad "sum(oil_m3) MISMATCH: cluster=$cluster_agg original=$original_agg"
fi

echo
echo "=== $pass passed, $fail failed ==="
[[ "$fail" -eq 0 ]]
