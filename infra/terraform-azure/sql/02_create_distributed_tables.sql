-- Run once, from any node, after 01_create_replicated_tables.sql.
-- Shards by well_id via cityHash64 — same well always lands on the same
-- shard, so per-well ReplacingMergeTree dedup still works correctly.

CREATE TABLE IF NOT EXISTS cluster_demo.well_production_distributed ON CLUSTER pvm_cluster
AS cluster_demo.well_production_local
ENGINE = Distributed(
    pvm_cluster,
    cluster_demo,
    well_production_local,
    cityHash64(well_id)
);
