

WITH first_prod AS (
    SELECT well_id, min(month_date) AS first_production_month
    FROM `analytics`.`fact_well_monthly_production`
    WHERE productive_flag = 1
    GROUP BY well_id
)
SELECT
    w.well_id,
    w.well_label,
    w.operator_raw,
    w.area,
    w.field,
    w.basin,
    w.province,
    w.formation,
    w.resource_type,
    w.resource_subtype,
    w.geojson_raw,
    w.cota_m,
    w.profundidad_m,
    w.well_status,
    w.classification,
    w.inicio_perforacion,
    w.fin_perforacion,
    w.inicio_terminacion,
    w.fin_terminacion,
    fp.first_production_month,
    if(fp.first_production_month IS NOT NULL, 1, 0) AS has_production
FROM `analytics`.`stg_energy__wells` w
LEFT JOIN first_prod fp ON w.well_id = fp.well_id