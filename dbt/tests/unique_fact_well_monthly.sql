-- No debe haber (well_id, month_date) duplicado en el hecho.
SELECT well_id, month_date, count() AS n
FROM {{ ref('fact_well_monthly_production') }}
GROUP BY well_id, month_date
HAVING n > 1