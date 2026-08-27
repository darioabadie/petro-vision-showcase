
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  -- Los totales mensuales de la serie deben ser positivos y plausibles.
SELECT month_date,
       oil_m3,
       gas_thousand_m3,
       productive_wells
FROM `analytics`.`mart_argentina_monthly_production`
WHERE oil_m3 <= 0
   OR gas_thousand_m3 <= 0
   OR productive_wells <= 0
  
  
    ) dbt_internal_test