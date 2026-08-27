
    
    

select
    operator_slug as unique_field,
    count(*) as n_records

from `analytics`.`dim_operator`
where operator_slug is not null
group by operator_slug
having count(*) > 1


