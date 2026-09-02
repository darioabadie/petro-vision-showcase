
  
    
    
    
        


        
  

  insert into `analytics`.`fact_well_monthly_production__dbt_backup`
        ("well_id", "month_date", "operator_slug", "province", "basin", "area", "field", "formation", "resource_type", "resource_subtype", "oil_m3", "gas_thousand_m3", "water_m3", "productive_flag", "is_partial", "is_rectified", "_record_version")

SELECT
    s.well_id,
    s.month_date,
    o.operator_slug,
    s.province                                  AS province,
    s.basin                                     AS basin,
    s.area                                      AS area,
    s.field                                     AS field,
    if(s.formation LIKE '%vaca muerta%', 'VACA MUERTA', upper(s.formation)) AS formation,
    s.resource_type                             AS resource_type,
    s.resource_subtype                          AS resource_subtype,
    s.oil_m3                                    AS oil_m3,
    s.gas_thousand_m3                           AS gas_thousand_m3,
    s.water_m3                                  AS water_m3,
    if(s.oil_m3 > 0 OR s.gas_thousand_m3 > 0, 1, 0) AS productive_flag,
    0                                           AS is_partial,
    s.rectified_flag                            AS is_rectified,
    now64()                                     AS _record_version
FROM `analytics`.`stg_energy__well_production` s
JOIN `analytics`.`dim_operator` o ON s.operator_raw = o.operator_raw
  