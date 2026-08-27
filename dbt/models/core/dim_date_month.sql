{{ config(materialized='table', order_by='month_date') }}

WITH months AS (
    SELECT
        arrayJoin(arrayMap(
            x -> addMonths(toDate('2006-01-01'), toInt64(x)),
            range(0, 300)
        )) AS month_date
)
SELECT
    month_date                      AS month_date,
    toUInt16(toYear(month_date))    AS year,
    toUInt8(toQuarter(month_date))  AS quarter,
    toUInt8(toMonth(month_date))    AS month,
toUInt8(toDayOfMonth(month_date))          AS days_in_month
FROM months
WHERE month_date <= toDate({{ "'" ~ var('pvm_cutoff') ~ "'" }})
ORDER BY month_date