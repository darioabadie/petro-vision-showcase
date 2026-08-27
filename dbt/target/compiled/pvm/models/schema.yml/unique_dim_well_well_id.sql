
    
    

select
    well_id as unique_field,
    count(*) as n_records

from `analytics`.`dim_well`
where well_id is not null
group by well_id
having count(*) > 1


