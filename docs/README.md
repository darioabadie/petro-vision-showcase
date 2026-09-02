# Pulso Vaca Muerta — Documentación del proyecto

*[English version](README.en.md)*

Observatorio abierto de producción, pozos y productividad de hidrocarburos argentinos con foco editorial en Vaca Muerta.

## Documentos

- [PRD](PRD.md) — Requerimientos, alcance y criterios de aceptación
- [Arquitectura](architecture.md) — Diseño del pipeline, contratos y publicación
- [Modelo de datos](MODELO_DE_DATOS.md) — Fuentes, esquemas, capas y tests
- [dbt](dbt.md) — Cómo está modelado y testeado el pipeline de transformación
- [ClickHouse](clickhouse.md) — Bases, motores de tabla y cómo explorar los datos
- [Docker](docker.md) — Qué está containerizado hoy y por qué
- [Actualización de datos](actualizacion-datos.md) — Ciclo completo de un release, de la fuente al frontend
- [Especificación para Lovable](lovable.md) — Contrato JSON, rutas y criterios visuales
- [Muestras](../data/samples/README.md) — Metodología de muestreo

## Estado del proyecto — 2 de septiembre de 2026

### Pipeline de datos (Fase 1 completa, Fase 2 en curso)

| Componente | Estado | Detalle |
|---|---|---|
| ClickHouse | **Operativo** | v24.8, Docker Compose, 18.2M filas raw |
| Ingesta S01 (producción por pozo) | **Completa** | CKAN, checksums, carga idempotente, metadatos técnicos |
| Ingesta S02 (pozos) | **Completa** | `raw_energy.wells`, `stg_energy__wells`, `dim_well` — padrón + coordenadas disponibles |
| Ingesta S03 (fracturas) | Pendiente | Fase 2 |
| Ingesta S04 (trayectorias) | Pendiente | Fase 2 |
| dbt: staging | **Completo** | `stg_energy__well_production`, `stg_energy__wells` (views) |
| dbt: core | **Completo** | `dim_date_month`, `dim_operator`, `dim_well`, `fact_well_monthly_production` |
| dbt: marts | **Completo** | `mart_argentina_monthly_production` (serie nacional) |
| dbt: tests | **Completo** | tests declarativos + 3 singulares — todos verde |
| Export | **Completo** | app-data.json, CSV, latest.json, validación jsonschema |
| Aliases de operadores | **Parcial** | Seed con ~30 operadores agrupados (`approved`); el resto (101) queda en `pending_review` por diseño — ver [`dbt.md`](dbt.md) |
| Quality checks reales | **Completo** | 6 checks dinámicos vía queries a ClickHouse (duplicados, nulos, negativos, fechas futuras, pendientes de alias) |
| Join coverage (producción ↔ padrón) | **Completo** | `quality.join_coverage` reporta match contra `dim_well` (`build_quality()`) |
| Cohortes | Pendiente | Fase 2 |
| Completaciones | Pendiente | Fase 2 |
| Dockerfiles de ingesta/dbt/exporter | Pendiente, y con alcance definido | Solo ClickHouse está containerizado; ingesta/dbt/export corren con `uv run` — ver [`docker.md`](docker.md) |

### Bugs arreglados (27-ago-2026)

- **dim_operator.sql**: ClickHouse devuelve strings vacíos en lugar de NULL en LEFT JOIN con tabla seed vacía. Solución: `nullIf(a.operator_canonical, '')` + `coalesce` para que `operator_canonical` caiga correctamente a `operator_raw` y `review_status` sea `pending_review`.
- Verificado: `dbt run` ✅, `dbt test` ✅, `export` ✅ (app-data + CSV + latest.json).

### Frontend (maqueta → datos reales)

| Componente | Estado | Detalle |
|---|---|---|
| TypeScript | **OK** | `tsc --noEmit` sin errores |
| Tests (vitest) | **OK** | 24/24 tests pasan (5 archivos) |
| Build (Bun + Vite + Nitro) | **OK** | Build completo sin errores |
| Consumo de datos reales | **OK** | `is_mock=false`, banner desaparece, KPIs y rankings con datos reales |
| Mapa (MapLibre) | **OK** | ~3.520 pozos, leídos desde `dim_well` (ya no parsea CSVs raw en cada export) |
| Tablas alternativas en home | Pendiente | Solo en explorador y cohortes |
| Clustering del mapa | Pendiente | Carga todos los features de una vez |
| Lighthouse / accesibilidad | Pendiente | Sin auditoría formal |

### Próximos pasos priorizados

1. **Ingesta S03/S04 (fracturas y trayectorias)** — habilita completaciones y trayectorias en el mapa.
2. **Cohortes y completaciones** — marts de Fase 2 (`mart_well_cohort_curve`, `mart_completion_productivity`).
3. **Pulido frontend** — Tablas alternativas en home, clustering del mapa, Lighthouse.

## Frontend

- App tipo observatorio con rutas: Resumen, Producción (explorador con filtros por URL), Operadores (+ perfil por slug), Pozos y cohortes, Fracturas, Mapa, Calidad, Metodología, Descargas y Archivo de períodos.
- Datos cargados solo en cliente vía `src/lib/data-client.ts`. Provider (`src/lib/observatory-data.tsx`) expone estados `loading | ready | error | schema-incompatible`.
- El banner de datos sintéticos y el prefijo "Demostración ·" dependen de `release.is_mock`. Con datos reales (`is_mock=false`) desaparecen automáticamente.

### Notas de implementación

- **Basemap**: Esri World Dark Gray Canvas (`World_Dark_Gray_Base`) + `World_Boundaries_and_Places`. Gratuito, sin API key.
- **Recharts**: los primitivos de gráfico deben ir siempre dentro del chart wrapper. Un fragmento suelto bajo `<ResponsiveContainer>` lanza `Invariant failed`.
- **MapLibre**: no interpreta `oklch()`. Usar paleta hex `PALETTE_HEX` / `SERIES_COLORS_HEX` de `src/lib/palette.ts`.
- El contrato se valida con `schema_version` mayor. Versiones desconocidas lanzan `schema-incompatible`.
- Verificación: `bun run typecheck`, `bun test` (vitest), `bun run build`.

## Pipeline

```bash
# Iniciar ClickHouse
make up

# Pipeline completo
make release    # ingest → dbt run → dbt test → export

# O por pasos
make ingest     # Descarga y carga S01
make dbt        # Transformaciones
make dbt-test   # Tests de calidad
make export     # Genera release en public/data/
```

## Reproducir muestras

```bash
python3 -m pvm.pipelines sample
```

Las URLs, checksums y cantidades observadas en [`data/samples/manifest.json`](../data/samples/manifest.json).