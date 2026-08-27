
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select month_date
from `analytics`.`stg_energy__well_production`
where month_date is null



  
  
    ) dbt_internal_test