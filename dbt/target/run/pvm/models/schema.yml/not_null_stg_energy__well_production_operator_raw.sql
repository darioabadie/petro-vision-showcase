
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select operator_raw
from `analytics`.`stg_energy__well_production`
where operator_raw is null



  
  
    ) dbt_internal_test