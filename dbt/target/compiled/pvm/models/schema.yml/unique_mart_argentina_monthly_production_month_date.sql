
    
    

select
    month_date as unique_field,
    count(*) as n_records

from `analytics`.`mart_argentina_monthly_production`
where month_date is not null
group by month_date
having count(*) > 1


