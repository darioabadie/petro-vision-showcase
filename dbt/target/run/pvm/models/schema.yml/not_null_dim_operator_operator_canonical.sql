
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select operator_canonical
from `analytics`.`dim_operator`
where operator_canonical is null



  
  
    ) dbt_internal_test