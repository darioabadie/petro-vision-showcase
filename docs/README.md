# Pulso Vaca Muerta — diseño inicial

Documentación y muestras para un observatorio abierto de producción y productividad de hidrocarburos argentinos.

## Documentos

- [PRD](docs/PRD.md)
- [Arquitectura](docs/architecture.md)
- [Especificación para Lovable y contrato de visualización](docs/lovable.md)
- [Modelo de datos y catálogo de fuentes](docs/MODELO_DE_DATOS.md)
- [Muestras y metodología de muestreo](data/samples/README.md)

## Contenido actual

Esta entrega define el producto y el modelo. El **sitio público (frontend "Pulso Vaca Muerta")** está implementado como maqueta sobre el contrato de datos mock (`/data/latest.json` + `app-data.json`); la ingesta automática con ClickHouse/dbt y el pipeline real quedan para la siguiente fase (ver cutover en `docs/lovable.md` §24).

## Estado del proyecto — 27 de agosto de 2026

La **fase frontend (maqueta) está cerrada por ahora**:

- Verificado: `npm run typecheck` ✅, 21 tests unitarios (vitest) ✅, `bun run build` ✅, smoke test en navegador real (Playwright) sobre las 12 rutas con **0 errores de consola** ✅.
- Publicado en Lovable desde el branch `main` (sincronización bidireccional por GitHub).

Queda documentada como deuda para la siguiente etapa:

1. **Pipeline real + cutover** (`docs/lovable.md` §24): generar releases con el exporter y probar la app contra una carpeta con `is_mock=false` (el banner desaparece sin recompilar).
2. **Pulido opcional**: tabla alternativa en los gráficos del home, clustering del mapa, QA responsive a 360/768/1440 px y Lighthouse.
3. `@tanstack/react-table` instalado pero **no usado** (las tablas actuales son shadcn/HTML simples); conservar solo si se adopta en el explorador.

Las muestras provienen de recursos oficiales consultados el 27 de agosto de 2026. Los archivos completos se descargaron temporalmente para perfilar su estructura y no se incorporaron al repositorio.

## Frontend (maqueta)

- App tipo observatorio de producción con rutas: Resumen, Producción (explorador con filtros por URL), Operadores (+ perfil por slug), Pozos y cohortes, Fracturas, Mapa, Calidad, Metodología, Descargas y Archivo de períodos.
- Los datos se cargan solo en el cliente vía `src/lib/data-client.ts`; el SSR renderiza esqueletos de carga. El provider (`src/lib/observatory-data.tsx`) expone estados `loading | ready | error | schema-incompatible` y `reload()`.
- El banner de datos sintéticos y el prefijo "Demostración ·" en el título dependen de `release.is_mock`.

### Notas de implementación

- **Basemap del mapa**: se usa **Esri World Dark Gray Canvas** (`World_Dark_Gray_Base`) + la capa de referencia `World_Boundaries_and_Places` para los labels. Es gratuito, sin API key y sin marca de agua; el CARTO `dark_all` original requiere API/registro y/o embebe su logotipo.
- **Recharts**: los primitivos del gráfico (`XAxis`, `YAxis`, `Legend`, `Line`, etc.) deben ir siempre dentro del chart wrapper (`<LineChart>`, `<ComposedChart>`, `<BarChart>`, …). Un fragmento directo bajo `<ResponsiveContainer>` rompe el contexto interno y lanza `Invariant failed` en el cliente (bug detectado y corregido en `/pozos-y-cohortes`).
- **MapLibre** no interpreta colores `oklch()` en los `paint` del style spec. Para el mapa hay que usar la paleta hex `PALETTE_HEX` / `SERIES_COLORS_HEX` de `src/lib/palette.ts`.
- El contrato se valida con `schema_version` mayor (`isCompatibleSchemaVersion`); versiones mayores lanzan el estado `schema-incompatible`.
- Verificación: `npm run typecheck`, `npm test` (vitest), `bun run build`, y smoke test en navegador real (Playwright) contra `wrangler dev` sobre el output del build.

## Reproducir muestras

Los scripts esperan que los archivos completos hayan sido descargados a `/tmp/pulso-vaca-muerta-sources`:

```bash
python3 scripts/build_source_samples.py
python3 scripts/profile_sources.py
```

Las URLs, checksums y cantidades observadas se encuentran en [`data/samples/manifest.json`](data/samples/manifest.json).
