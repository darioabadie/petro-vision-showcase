SELECT
    coalesce(NULLIf(trim(idpozo), ''), '')     AS well_id,
    if(isNull(sigla) OR trim(sigla) = '', '', trim(sigla)) AS well_label,
    assumeNotNull(toDate(concat(anio, '-', mes, '-01'))) AS month_date,
    coalesce(NULLIf(trim(empresa), ''), 'SIN OPERADOR') AS operator_raw,
    lower(trim(coalesce(formacion, '')))     AS formation,
    lower(trim(coalesce(formprod, '')))      AS formation_code,
    if(isNull(areayacimiento) OR trim(areayacimiento) = '', '', trim(areayacimiento)) AS field,
    if(isNull(areapermisoconcesion) OR trim(areapermisoconcesion) = '', '', trim(areapermisoconcesion)) AS area,
    if(isNull(cuenca) OR trim(cuenca) = '', '', trim(cuenca)) AS basin,
    if(isNull(provincia) OR trim(provincia) = '', '', trim(provincia)) AS province,
    lower(trim(coalesce(tipo_de_recurso, ''))) AS resource_type,
    lower(trim(coalesce(sub_tipo_recurso, ''))) AS resource_subtype,
    toFloat64OrZero(prod_pet)                AS oil_m3,
    toFloat64OrZero(prod_gas)                AS gas_thousand_m3,
    toFloat64OrZero(prod_agua)               AS water_m3,
    toUInt32OrZero(rectificado)              AS rectified_flag,
    if(isNull(fecha_data) OR trim(fecha_data) = '', cast(month_date AS String), trim(fecha_data)) AS fecha_data
FROM raw_energy.well_production
WHERE anio <> '' AND mes <> '' AND idpozo <> ''