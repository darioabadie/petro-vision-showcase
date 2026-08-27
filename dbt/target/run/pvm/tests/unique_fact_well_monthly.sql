
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  -- No debe haber (well_id, month_date) duplicado en el hecho.
SELECT well_id, month_date, count() AS n
FROM `analytics`.`fact_well_monthly_production`
GROUP BY well_id, month_date
HAVING n > 1
  
  
    ) dbt_internal_test