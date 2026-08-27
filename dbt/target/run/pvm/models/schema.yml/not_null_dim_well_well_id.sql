
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select well_id
from `analytics`.`dim_well`
where well_id is null



  
  
    ) dbt_internal_test