
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select productive_wells
from `analytics`.`mart_argentina_monthly_production`
where productive_wells is null



  
  
    ) dbt_internal_test