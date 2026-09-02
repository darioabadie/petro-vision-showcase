
    
    
    select
      count(*) as failures,
      count(*) != 0 as should_warn,
      count(*) != 0 as should_error
    from (
      
    
  
    
    



select month_date
from `analytics`.`mart_argentina_monthly_production`
where month_date is null



  
  
    ) dbt_internal_test