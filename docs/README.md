# Pulso Vaca Muerta — Documentación del proyecto

Observatorio abierto de producción, pozos y productividad de hidrocarburos argentinos con foco editorial en Vaca Muerta.

## Documentos

- [PRD](PRD.md) — Requerimientos, alcance y criterios de aceptación
- [Arquitectura](architecture.md) — Diseño del pipeline, contratos y publicación
- [Especificación para Lovable](lovable.md) — Contrato JSON, rutas y criterios visuales
- [Modelo de datos](MODELO_DE_DATOS.md) — Fuentes, esquemas, capas y tests
- [Muestras](../data/samples/README.md) — Metodología de muestreo

## Estado del proyecto — 27 de agosto de 2026

### Pipeline de datos (Fase 1 — operativo parcial)

| Componente | Estado | Detalle |
|---|---|---|
| ClickHouse | **Operativo** | v24.8, Docker Compose, 18.2M filas raw |
| Ingesta S01 (producción por pozo) | **Completa** | CKAN, checksums, carga idempotente, metadatos técnicos |
| Ingesta S02 (pozos) | Pendiente | Necesaria para padrón completo y join coverage |
| Ingesta S03 (fracturas) | Pendiente | Fase 2 |
| Ingesta S04 (trayectorias) | Pendiente | Fase 2 |
| dbt: staging | **Completo** | `stg_energy__well_production` (view), 18.2M filas |
| dbt: core | **Completo** | `dim_date_month`, `dim_operator`, `fact_well_monthly_production` |
| dbt: marts | **Completo** | `mart_argentina_monthly_production` (serie nacional) |
| dbt: tests | **Completo** | 17 tests: unique, not_null, plausible — todos verde |
| Export | **Completo** | app-data.json (66.6 MB), CSV, latest.json, validación jsonschema |
| Aliases de operadores | **Pendiente** | Seed vacía — todos los operadores en `pending_review` |
| Cohortes | Pendiente | Fase 2 |
| Completaciones | Pendiente | Fase 2 |
| Quality checks reales | Pendiente | Actualmente hardcodeados |
| Dockerfiles | Pendiente | Pipeline corre con `uv run` directamente |

### Bugs arreglados (27-ago-2026)

- **dim_operator.sql**: ClickHouse devuelve strings vacíos en lugar de NULL en LEFT JOIN con tabla seed vacía. Solución: `nullIf(a.operator_canonical, '')` + `coalesce` para que `operator_canonical` caiga correctamente a `operator_raw` y `review_status` sea `pending_review`.
- Verificado: `dbt run` ✅ (5/5), `dbt test` ✅ (17/17), `export` ✅ (app-data + CSV + latest.json).

### Frontend (maqueta → datos reales)

| Componente | Estado | Detalle |
|---|---|---|
| TypeScript | **OK** | `tsc --noEmit` sin errores |
| Tests (vitest) | **OK** | 24/24 tests pasan (5 archivos) |
| Build (Bun + Vite + Nitro) | **OK** | Build completo sin errores |
| Consumo de datos reales | **OK** | `is_mock=false`, banner desaparece, KPIs y rankings con datos reales |
| Mapa (MapLibre) | **OK** | 3,525 pozos, 2,222 trayectorias con popups |
| Tablas alternativas en home | Pendiente | Solo en explorador y cohortes |
| Clustering del mapa | Pendiente | Carga todos los features de una vez |
| Lighthouse / accesibilidad | Pendiente | Sin auditoría formal |

### Próximos pasos priorizados

1. **Seed de aliases de operadores** — Poblar con ~70 nombres canónicos para normalizar rankings.
2. **Ingesta S02 (pozos)** — Padrón completo para join coverage y coordenadas.
3. **Quality checks reales** — Validación dinámica contra la base.
4. **Pulido frontend** — Tablas alternativas en home, clustering del mapa, Lighthouse.

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