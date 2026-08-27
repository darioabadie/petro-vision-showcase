
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select operator_slug
from `analytics`.`fact_well_monthly_production`
where operator_slug is null



  
  
    ) dbt_internal_test