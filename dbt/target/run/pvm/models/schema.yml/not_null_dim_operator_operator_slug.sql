
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select operator_slug
from `analytics`.`dim_operator`
where operator_slug is null



  
  
    ) dbt_internal_test