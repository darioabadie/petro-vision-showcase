

WITH raw_ops AS (
    SELECT DISTINCT operator_raw
    FROM `analytics`.`stg_energy__well_production`
    WHERE operator_raw <> 'SIN OPERADOR'
),
aliased AS (
SELECT
    o.operator_raw,
    nullIf(a.operator_canonical, '') AS operator_canonical_nullable
FROM raw_ops o
LEFT JOIN `analytics`.`seed_operator_aliases` a
    ON lower(trim(a.operator_raw)) = lower(trim(o.operator_raw))
    AND a.review_status = 'approved'
)
SELECT
    
lower(replaceRegexpAll(trim(both '-' from replaceRegexpAll(trim(lower(operator_raw)), '[^a-z0-9]+', '-')), '-+', '-'))
                                       AS operator_slug,
    operator_raw                                                        AS operator_raw,
    coalesce(operator_canonical_nullable, operator_raw)                  AS operator_canonical,
    if(operator_canonical_nullable IS NULL, 'pending_review', 'approved') AS review_status
FROM aliased