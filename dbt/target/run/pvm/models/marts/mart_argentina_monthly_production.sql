
  
    
    
    
        


        
  

  insert into `analytics`.`mart_argentina_monthly_production__dbt_backup`
        ("month_date", "oil_m3", "gas_thousand_m3", "water_m3", "oil_conventional_m3", "oil_nonconventional_m3", "gas_conventional_thousand_m3", "gas_nonconventional_thousand_m3", "productive_wells", "is_complete")

WITH agg AS (
    SELECT
        month_date                                                                 AS month_date,
        sum(oil_m3)                                                               AS oil_m3,
        sum(gas_thousand_m3)                                                      AS gas_thousand_m3,
        sum(water_m3)                                                             AS water_m3,
        sum(oil_conventional_m3)                                                  AS oil_conventional_m3,
        sum(oil_nonconventional_m3)                                               AS oil_nonconventional_m3,
        sum(gas_conventional_thousand_m3)                                         AS gas_conventional_thousand_m3,
        sum(gas_nonconventional_thousand_m3)                                      AS gas_nonconventional_thousand_m3,
        countDistinctIf(well_id, productive_flag = 1)                             AS productive_wells
    FROM (
        SELECT
            month_date,
            oil_m3,
            gas_thousand_m3,
            water_m3,
            if(resource_type = 'convencional', oil_m3, 0)                          AS oil_conventional_m3,
            if(resource_type = 'no convencional', oil_m3, 0)                       AS oil_nonconventional_m3,
            if(resource_type = 'convencional', gas_thousand_m3, 0)                 AS gas_conventional_thousand_m3,
            if(resource_type = 'no convencional', gas_thousand_m3, 0)              AS gas_nonconventional_thousand_m3,
            well_id,
            productive_flag
        FROM `analytics`.`fact_well_monthly_production`
    )
    GROUP BY month_date
),
max_month AS (
    SELECT max(month_date) AS m FROM `analytics`.`fact_well_monthly_production`
)
SELECT
    a.month_date                                          AS month_date,
    a.oil_m3                                               AS oil_m3,
    a.gas_thousand_m3                                      AS gas_thousand_m3,
    a.water_m3                                             AS water_m3,
    a.oil_conventional_m3                                  AS oil_conventional_m3,
    a.oil_nonconventional_m3                               AS oil_nonconventional_m3,
    a.gas_conventional_thousand_m3                         AS gas_conventional_thousand_m3,
    a.gas_nonconventional_thousand_m3                      AS gas_nonconventional_thousand_m3,
    a.productive_wells                                     AS productive_wells,
    if(
        a.month_date <= 
toDate('2026-07-31')

        AND (a.month_date < mm.m OR (a.month_date = mm.m AND mm.m <= 
toDate('2026-07-31')
)),
        1, 0
    )                                                     AS is_complete
FROM agg a
CROSS JOIN max_month mm
ORDER BY a.month_date
  