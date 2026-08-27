# Muestras de fuentes

Estas muestras permiten inspeccionar el esquema y desarrollar tests sin versionar cientos de megabytes de datos raw.

| Archivo | Fuente | Método |
|---|---|---|
| `01_well_production_2026_sample.csv` | Producción por pozo 2026 | Reservoir sampling determinístico, 120 filas. |
| `02_wells_sample.csv` | Padrón Capítulo IV | Reservoir sampling determinístico, 100 filas. |
| `03_fractures_sample.csv` | Adjunto IV de fracturas | Reservoir sampling determinístico, 100 filas. |
| `04_trajectories_sample.csv` | Trayectorias Vaca Muerta | Reservoir sampling determinístico, 12 filas; las geometrías hacen que cada fila sea grande. |
| `05_national_production_series_sample.csv` | API de Series de Tiempo | Respuesta de los últimos 24 períodos solicitados. |
| `06_georef_location_sample.json` | API Georef `/ubicacion` | Respuesta completa para una coordenada presente en el padrón. |
| `07_operator_aliases_seed.csv` | Seed interno | Propuesta algorítmica; todas las filas requieren revisión humana. |
| `manifest.json` | Metadata de la descarga | URLs, tamaños, fechas, filas y SHA-256. |
| `source_profile.json` | Perfil reproducible | Conteos, cobertura de joins y anomalías observadas. |

## Importante

- Las muestras no son estadísticamente representativas ni deben emplearse para publicar indicadores.
- El muestreo usa semilla fija `20260827`, por lo que es reproducible sobre el mismo archivo fuente.
- Los checksums permiten identificar si el organismo revisó un recurso posteriormente.
- Los archivos oficiales relevados figuran bajo CC BY 4.0 en Datos Argentina, salvo la API de Series de Tiempo, cuya atribución debe conservar la metadata del catálogo de cada serie.
- El CSV de aliases no está aprobado: su función es demostrar el flujo de revisión manual.

## Archivos completos observados

Los originales se descargaron temporalmente a `/tmp/pulso-vaca-muerta-sources` y no forman parte del entregable versionable.

