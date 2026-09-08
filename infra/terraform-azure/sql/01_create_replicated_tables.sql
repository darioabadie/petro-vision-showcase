-- Run once, from any node, against the `pvm_cluster` cluster. ClickHouse
-- propagates the DDL to all 4 nodes via ON CLUSTER — no need to repeat this
-- per node.

CREATE DATABASE IF NOT EXISTS cluster_demo ON CLUSTER pvm_cluster;

-- Mirrors analytics.fact_well_monthly_production from the main pipeline
-- (dbt/models/core/fact_well_monthly_production.sql): same columns, same
-- ORDER BY / PARTITION BY, same ReplacingMergeTree version column, but
-- Replicated so every shard's two replicas stay in sync via Keeper.
CREATE TABLE IF NOT EXISTS cluster_demo.well_production_local ON CLUSTER pvm_cluster
(
    well_id           String,
    month_date        Date,
    operator_slug     String,
    province          String,
    basin             String,
    area              String,
    field             String,
    formation         String,
    resource_type     String,
    resource_subtype  String,
    oil_m3            Float64,
    gas_thousand_m3   Float64,
    water_m3          Float64,
    productive_flag   UInt8,
    is_partial        UInt8,
    is_rectified      UInt8,
    _record_version   DateTime64(6)
)
ENGINE = ReplicatedReplacingMergeTree(
    '/clickhouse/tables/{shard}/well_production',
    '{replica}',
    _record_version
)
PARTITION BY toYear(month_date)
ORDER BY (well_id, month_date);
