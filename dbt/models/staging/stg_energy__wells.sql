SELECT
    coalesce(NULLIf(trim(idpozo), ''), '')     AS well_id,
    if(isNull(sigla) OR trim(sigla) = '', '', trim(sigla)) AS well_label,
    if(isNull(empresa) OR trim(empresa) = '', '', trim(empresa)) AS operator_raw,
    if(isNull(area) OR trim(area) = '', '', trim(area)) AS area,
    if(isNull(yacimiento) OR trim(yacimiento) = '', '', trim(yacimiento)) AS field,
    if(isNull(cuenca) OR trim(cuenca) = '', '', trim(cuenca)) AS basin,
    if(isNull(provincia) OR trim(provincia) = '', '', trim(provincia)) AS province,
    lower(trim(coalesce(formacion, '')))     AS formation,
    lower(trim(coalesce(tipo_recurso, '')))   AS resource_type,
    lower(trim(coalesce(sub_tipo_recurso, ''))) AS resource_subtype,
    if(isNull(geojson) OR trim(geojson) = '', NULL, geojson) AS geojson_raw,
    toFloat64OrZero(cota)                    AS cota_m,
    toFloat64OrZero(profundidad)              AS profundidad_m,
    lower(trim(coalesce(tipoestado, '')))     AS well_status,
    lower(trim(coalesce(clasificacion, '')))  AS classification,
    if(isNull(adjiv_fecha_inicio_perf) OR trim(adjiv_fecha_inicio_perf) = '', NULL, trim(adjiv_fecha_inicio_perf)) AS inicio_perforacion,
    if(isNull(adjiv_fecha_fin_perf) OR trim(adjiv_fecha_fin_perf) = '', NULL, trim(adjiv_fecha_fin_perf)) AS fin_perforacion,
    if(isNull(adjiv_fecha_inicio_term) OR trim(adjiv_fecha_inicio_term) = '', NULL, trim(adjiv_fecha_inicio_term)) AS inicio_terminacion,
    if(isNull(adjiv_fecha_fin_term) OR trim(adjiv_fecha_fin_term) = '', NULL, trim(adjiv_fecha_fin_term)) AS fin_terminacion
FROM raw_energy.wells
WHERE idpozo <> '' AND idpozo IS NOT NULL