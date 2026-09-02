-- Los totales mensuales de la serie deben ser positivos y plausibles.
SELECT month_date,
       oil_m3,
       gas_thousand_m3,
       productive_wells
FROM `analytics`.`mart_argentina_monthly_production`
WHERE oil_m3 <= 0
   OR gas_thousand_m3 <= 0
   OR productive_wells <= 0