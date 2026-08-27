# Especificación para Lovable — Pulso Vaca Muerta

**Versión:** 0.1  
**Fecha:** 27 de agosto de 2026  
**Objetivo:** construir en paralelo una aplicación pública completamente navegable usando datos sintéticos, sin depender todavía del pipeline.

## 1. Resultado esperado

Lovable debe construir la interfaz completa de **Pulso Vaca Muerta** contra un contrato JSON estable. Durante el desarrollo, la app consumirá el mock versionado incluido en este repositorio. Cuando el pipeline esté listo, producirá el mismo contrato y actualizará el puntero de release; el frontend no deberá cambiar.

Archivos de prueba:

- Puntero que la aplicación debe cargar primero: [`../web/public/data/latest.json`](../web/public/data/latest.json).
- Payload completo con datos sintéticos: [`../web/public/data/releases/mock-2026-07/app-data.json`](../web/public/data/releases/mock-2026-07/app-data.json).

El mock contiene todas las secciones necesarias para construir las visualizaciones especificadas en este documento. Los valores son sintéticos y deben mostrarse con un banner inequívoco mientras `release.is_mock` sea `true`.

## 2. Prompt maestro para Lovable

Copiar la siguiente instrucción en Lovable. Conviene implementarla por rutas, verificando cada bloque antes de continuar.

```text
Construí una aplicación pública responsive llamada “Pulso Vaca Muerta”, en español, usando React y TypeScript. Es un observatorio de datos abiertos sobre producción, pozos y productividad de hidrocarburos argentinos, con foco editorial en Vaca Muerta.

La aplicación es frontend-only. No agregues Supabase, base de datos, autenticación, server actions, edge functions ni un backend propio. No inventes valores dentro de componentes. Todo dato, texto dinámico, opción de filtro, fuente, fecha, unidad y URL de descarga debe provenir del contrato JSON.

Al iniciar:
1. Cargá GET /data/latest.json.
2. Validá que schema_version comience con “1.”.
3. Construí la URL como `${base_path}${app_data_file}`.
4. Cargá ese app-data.json mediante un único servicio tipado dataClient.
5. Exponé los datos a la aplicación mediante un ObservatoryDataProvider.

El mock ya existe en /public/data/releases/mock-2026-07/app-data.json. No copies sus valores a archivos TypeScript. La futura release real tendrá exactamente la misma forma.

Si release.is_mock es true, mostrá en todas las rutas un banner fijo debajo del header: “Versión demostrativa · Los datos son sintéticos y no representan cifras reales”. Si es false, no lo muestres.

Usá Recharts para gráficos, TanStack Table para tablas y MapLibre GL JS para el mapa. Si MapLibre requiere una fuente cartográfica, usá un estilo público sin token y encapsulá su URL en una constante reemplazable. No uses Google Maps.

Creá estas rutas:
/
/produccion
/operadores
/operadores/:slug
/pozos-y-cohortes
/fracturas
/mapa
/calidad
/metodologia
/descargas
/periodos/:releaseId

Implementá exactamente las visualizaciones, filtros, estados, notas metodológicas y criterios de aceptación definidos en docs/lovable.md. Todas las vistas deben compartir fecha de corte, fuente, unidad, acceso a metodología y tabla alternativa. Los filtros deben persistir en query parameters y las URLs deben ser compartibles.

No muestres un grupo de cohorte cuando well_count o sample_size sea menor que cohorts.minimum_sample_size. Los null deben mostrarse como “Sin cobertura”, nunca como cero. No mezcles petróleo y gas en un mismo eje porque tienen unidades diferentes.

Implementá estados de loading, error, vacío y versión de schema incompatible. Si falla una sección no debe caer toda la app. Priorizá accesibilidad WCAG AA, navegación por teclado, tooltips accesibles y tablas equivalentes a los gráficos.
```

## 3. Arquitectura de consumo

La UI debe depender de una sola interfaz:

```text
/data/latest.json
        │
        └── base_path + app_data_file
                    │
                    └── /data/releases/<release_id>/app-data.json
```

Reglas obligatorias:

1. `dataClient` será el único módulo que ejecuta `fetch`.
2. Componentes y páginas no construirán URLs de datos.
3. El JSON no se importará en el bundle con `import`; debe solicitarse en runtime.
4. No habrá datos de fallback escritos en TypeScript.
5. `schema_version` se validará antes de renderizar.
6. Una versión mayor desconocida mostrará una pantalla controlada, no un error técnico.
7. `null` significa “no disponible/no existe cobertura”; jamás se convertirá a cero.
8. Fechas se interpretarán como ISO 8601 y se presentarán en `es-AR`.
9. Los arrays vacíos activarán un estado vacío dentro del módulo correspondiente.
10. El frontend no calculará indicadores que requieran filas raw. Solo podrá filtrar, agrupar o sumar los agregados presentes en `explorer.rows`.

Interfaces mínimas recomendadas:

```ts
type ReleasePointer = {
  release_id: string;
  data_cutoff: string;
  generated_at: string;
  schema_version: string;
  status: "mock" | "complete" | "warning";
  base_path: string;
  app_data_file: string;
};

type ObservatoryData = {
  schema_version: string;
  release: ReleaseMetadata;
  site: SiteMetadata;
  filter_options: FilterOptions;
  home: HomeData;
  explorer: ExplorerData;
  operators: OperatorsData;
  cohorts: CohortsData;
  completions: CompletionsData;
  map: MapData;
  quality: QualityData;
  downloads: DownloadArtifact[];
  methodology: MethodologyData;
  release_history: ReleaseHistoryItem[];
};
```

No es necesario instalar un generador de schemas en esta primera maqueta, pero los tipos deben representar todas las propiedades del mock y evitar `any`.

## 4. Identidad visual

La estética debe transmitir energía, territorio, información pública y rigor técnico; no debe parecer una terminal petrolera ni un dashboard corporativo genérico.

### Paleta

| Uso                 | Color     |
| ------------------- | --------- |
| Fondo principal     | `#F7F4EE` |
| Superficie/tarjetas | `#FFFFFF` |
| Texto principal     | `#122429` |
| Texto secundario    | `#59686B` |
| Marca/acciones      | `#0D5963` |
| Petróleo            | `#B7791F` |
| Gas                 | `#147D92` |
| Agua                | `#477DB3` |
| No convencional     | `#6E56CF` |
| Convencional        | `#9AA3A5` |
| Variación positiva  | `#247A4D` |
| Variación negativa  | `#B3453F` |
| Advertencia         | `#C47A16` |

Usar colores semánticos de forma consistente. Nunca depender solo del color: agregar etiqueta, símbolo o patrón.

### Tipografía y densidad

- Sans legible para interfaz, por ejemplo Inter.
- Monoespaciada para IDs, checksums y timestamps, por ejemplo IBM Plex Mono.
- Ancho máximo de contenido: 1.280 px.
- Grilla de 12 columnas en desktop; una columna en móvil.
- Tarjetas con bordes suaves, sombra mínima y bastante espacio en blanco.
- Números tabulares y alineados a la derecha en tablas.

### Formatos

- Decimales y separadores con `Intl.NumberFormat("es-AR")`.
- Fechas mensuales como `jul 2026` y fecha de corte como `31 jul 2026`.
- Tooltips con valor sin abreviar; ejes pueden usar `M`, `mil` o `k`.
- Porcentajes con un decimal.
- Variaciones con signo explícito y comparación indicada: `+2,8 % mensual`.

## 5. Shell global

El header debe contener:

- Marca “Pulso Vaca Muerta”.
- Navegación: Resumen, Producción, Operadores, Pozos, Fracturas, Mapa, Calidad.
- Accesos secundarios: Metodología, Descargas y GitHub.
- En móvil, menú accesible tipo drawer.

Debajo del header:

- Banner de mock condicionado por `release.is_mock`.
- En releases reales, badge de estado si `release.status` es `warning`.

El footer debe mostrar:

- Fecha de corte.
- Fecha de generación.
- Fuente principal.
- Enlaces a metodología, descargas y repositorio.
- Texto: “Proyecto independiente construido sobre datos públicos. No constituye asesoramiento de inversión.”

Cada página debe incluir un encabezado con título, descripción, fecha de corte y botón “Compartir”. Compartir debe copiar la URL completa con filtros.

## 6. Componentes reutilizables obligatorios

### `ChartCard`

Debe envolver cada gráfico e incluir:

- Título declarativo, no solo nombre de métrica.
- Subtítulo con alcance y período.
- Unidad.
- Gráfico.
- Botón para abrir la tabla alternativa.
- Botón para descargar los datos visibles como CSV generado en el navegador.
- Enlace “Cómo se calcula”.
- Fuente y fecha de corte.
- Estado vacío local.

### `FilterBar`

- Chips con filtros activos.
- Botón “Limpiar filtros”.
- Contador de resultados.
- Cambios reflejados inmediatamente en query parameters.
- Selectores buscables para listas largas.
- En móvil, filtros dentro de un drawer con “Aplicar”.

### `KpiCard`

- Valor principal y unidad.
- Variación mensual e interanual.
- Flecha y texto, no solo color.
- Tooltip con definición tomada de `methodology.definitions` mediante `definition_id`.

### Estados

- Skeleton durante carga.
- Error con botón “Reintentar”.
- Vacío explicando qué filtro produjo cero resultados.
- Schema incompatible con versiones esperada y recibida.
- Datos parciales con badge visible.

## 7. Ruta `/` — Resumen mensual

### Encabezado editorial

Mostrar nombre, tagline, último período completo y un bloque “Tres claves del mes” con `home.insights`. El tono no debe inferir noticias nuevas ni causalidad.

### Visualización H1 — KPI cards

Cuatro tarjetas desde `home.kpis`:

1. Producción de petróleo.
2. Producción de gas.
3. Participación no convencional.
4. Pozos con producción positiva.

En desktop forman una fila; en móvil, dos por fila o una por fila según ancho.

### Visualización H2 — Evolución de producción

- Fuente: `home.production_history`.
- Tipo: line chart.
- Toggle: Petróleo / Gas / Agua.
- Eje X: `period`.
- Eje Y: la unidad canónica del producto.
- Una sola unidad a la vez.
- Tooltip con valor, variación mensual calculada solo para presentación y período.
- Marcar el último punto.

### Visualización H3 — Convencional vs. no convencional

- Fuente: `home.production_history`.
- Tipo: área apilada al 100 %.
- Toggle: Petróleo / Gas.
- Series: convencional y no convencional.
- Tooltip con volumen y participación.
- Leyenda fija con colores semánticos.

### Visualización H4 — Quién explicó el cambio mensual

- Fuente: `home.operator_contributions`.
- Tipo: barras horizontales divergentes, ordenadas por `delta_oil_m3`.
- Eje: aporte en m³.
- Etiqueta secundaria: `share_of_change_pct`.
- Positivos verdes; negativos rojos; “Otros” gris.
- No denominarlo causalidad: usar “aporte aritmético a la variación”.

### Visualización H5 — Pozos productivos

- Fuente: `home.production_history.productive_wells`.
- Tipo: línea compacta con área tenue.
- Mostrar último valor y variación.

### Estado de datos

Tarjeta resumida desde `quality.overall`: score, tests críticos, advertencias, última corrida y enlace a `/calidad`.

## 8. Ruta `/produccion` — Explorador

### Filtros

Tomar opciones exclusivamente de `filter_options`:

- Rango de período.
- Producto.
- Tipo y subtipo de recurso.
- Operador.
- Provincia.
- Cuenca.
- Área.
- Yacimiento.
- Formación.
- Dimensión de comparación.

Permitir comparar hasta cinco valores. Si el usuario intenta agregar un sexto, mostrar una explicación y no modificar la selección.

### Lógica sobre el mock

Filtrar `explorer.rows` en memoria. Para cada producto, mapear:

```text
oil   → oil_m3
gas   → gas_thousand_m3
water → water_m3
```

Agrupar por período y dimensión seleccionada. Sumar también `productive_wells`, aclarando que el pipeline final entregará agregados sin duplicación. No usar estos rows para recomponer KPIs nacionales fuera del explorador.

### Visualización P1 — Serie comparativa

- Tipo: líneas múltiples.
- Máximo: cinco series.
- Leyenda interactiva.
- Hover compartido por mes.
- Resaltar períodos con `is_complete=false` mediante fondo rayado y badge “parcial”.

### Visualización P2 — Composición del último período

- Tipo: barras horizontales.
- Categoría: dimensión de comparación.
- Valor: producción en el último mes visible.
- Mostrar porcentaje del total filtrado.

### Visualización P3 — Tabla de resultados

- TanStack Table.
- Columnas: período, entidad comparada, producto, volumen, unidad, pozos productivos, estado del período.
- Orden, paginación, columnas ocultables y export CSV.
- La tabla debe ser la alternativa accesible de P1/P2.

El estado completo de filtros debe serializarse en query parameters con nombres legibles.

## 9. Rutas `/operadores` y `/operadores/:slug`

### Visualización O1 — Ranking de operadores

- Fuente: `operators.rankings`.
- Controles: producto y métrica (volumen, participación, variación mensual, variación interanual).
- Tipo: barras horizontales ordenadas.
- Mostrar posición, operador, valor, share y cambio.
- Al seleccionar una barra, navegar a `/operadores/:slug`.

Debajo, una tabla completa con las mismas métricas y búsqueda por nombre.

### Perfil del operador

Resolver el slug contra `operators.profiles`. Si no existe perfil, mostrar estado vacío controlado y enlace al ranking.

#### O2 — Evolución

Usar las filas coincidentes de `explorer.rows` para una línea mensual de petróleo y otra vista separada de gas. Nunca usar doble eje.

#### O3 — Distribución por área

- Fuente: `profile.area_mix`.
- Tipo: barras horizontales.
- Mostrar volumen y `share_pct`.

#### O4 — Mix de recurso

- Fuente: `profile.resource_mix`.
- Tipo: barra 100 % apilada; evitar donut si solo hay dos categorías.

#### O5 — Altas de pozos productivos

- Fuente: `profile.new_productive_wells`.
- Tipo: columnas por mes.

#### O6 — Cohortes asociadas

Filtrar `cohorts.curves` por los IDs de `profile.cohort_ids`. Mostrar mini curvas de mediana y enlace a `/pozos-y-cohortes` con el operador preseleccionado.

Mostrar siempre `profile.alias_note` en una nota sobre normalización de nombres.

## 10. Ruta `/pozos-y-cohortes`

### Filtros

- Producto/métrica.
- Operador.
- Área.
- Formación.
- Cohorte.
- Ventana máxima de edad del pozo.

### Visualización C1 — Curvas por edad del pozo

- Fuente: `cohorts.curves`.
- Tipo: línea para `median` con banda entre `p25` y `p75`.
- Eje X: `well_age_month`, rotulado “Meses desde primera producción”.
- Eje Y: unidad de la curva.
- Máximo cinco cohortes.
- No mezclar curvas con unidades distintas.
- Tooltip: mediana, P25, P75, promedio y `well_count`.
- Una curva deja de dibujarse cuando `well_count < minimum_sample_size`.

### Visualización C2 — Producción acumulada

- Fuente: `cohorts.cumulative_summary`.
- Tipo: barras agrupadas para 3, 6 y 12 meses.
- Mostrar `null` como “Sin ventana completa”.
- Mostrar `n_3`, `n_6` y `n_12` junto a cada valor.

### Visualización C3 — Tamaño de muestra

- Tipo: heatmap simple o matriz accesible.
- Filas: cohortes.
- Columnas: edad en meses.
- Valor: `well_count`.
- Celdas por debajo del mínimo con hatch y texto “n insuficiente”.

Incluir una caja metodológica que explique primera producción, ventana completa, mediana y percentiles.

## 11. Ruta `/fracturas`

Abrir con `completions.disclaimer` en un callout visible.

### Visualización F1 — Embudo de cobertura

- Fuente: `completions.coverage`.
- Secuencia: pozos de producción → con registro de fractura → vinculados → longitud válida → elegibles.
- Mostrar conteo y porcentaje en cada etapa.
- Puede implementarse como barras escalonadas accesibles; no es necesario un funnel ornamental.

### Visualización F2 — Longitud horizontal y acumulada a seis meses

- Fuente: `completions.scatter`.
- Tipo: scatter.
- X: `horizontal_length_m`.
- Y: `cum_oil_6m_m3`.
- Color: operador.
- Tamaño: `stage_count`, con rango visual acotado.
- Tooltip con pozo, operador, área, longitud, etapas, arena, agua y acumulada.
- No dibujar línea de tendencia en el MVP.

### Visualización F3 — Productividad por rango de longitud

- Fuente: `completions.bucket_stats`.
- Tipo: mediana como punto/barra y rango P25–P75 como whisker.
- X: bucket ordenado según el JSON.
- Y: acumulada de petróleo a seis meses.
- Etiqueta de `well_count` en cada grupo.

### Visualización F4 — Tabla de observaciones del mock

Tabla de `completions.scatter` con búsqueda, orden y descarga. En producción, este artefacto podrá contener una muestra o IDs anonimizados; la UI no debe asumir que son todos los pozos.

## 12. Ruta `/mapa`

### Mapa M1 — Pozos y trayectorias

- Fuente: `map.initial_view`, `map.wells_geojson` y `map.trajectories_geojson`.
- Motor: MapLibre GL JS.
- Clustering activo hasta un nivel de zoom razonable.
- Selector de color con valores de `map.color_modes`.
- Capas activables: puntos, clusters y trayectorias.
- Leyenda que cambie según el modo de color.
- Filtros: operador, recurso, estado y área.
- Botón “Restablecer vista”.

Popup de pozo:

- Etiqueta e ID.
- Operador.
- Área y formación.
- Tipo de recurso y estado.
- Última producción de petróleo y gas con unidad.

Popup de trayectoria:

- ID de pozo.
- Operador.
- Longitud horizontal.

En móvil, el popup debe abrir como bottom sheet. Si el mapa falla, mostrar una tabla de puntos con latitud/longitud y atributos.

## 13. Ruta `/calidad`

### Encabezado

Score, estado global, tests críticos fallidos, advertencias, filas procesadas y última ejecución desde `quality.overall`. El score es informativo; no ocultar los checks individuales.

### Visualización Q1 — Frescura de fuentes

- Fuente: `quality.sources`.
- Tipo: tabla/timeline.
- Columnas: fuente, estado, última modificación, ingesta, filas, checksum corto, revisión detectada.
- Estados con icono y texto.

### Visualización Q2 — Checks de calidad

- Fuente: `quality.checks`.
- Tipo: lista agrupada por severidad y estado.
- Mostrar filas afectadas.
- Filtros: todos, críticos, advertencias, aprobados.

### Visualización Q3 — Cobertura de relaciones

- Fuente: `quality.join_coverage`.
- Tipo: barras horizontales de 0 a 100 %.
- Mostrar matched/total y porcentaje con dos decimales.
- No truncar visualmente diferencias cercanas a 100 %: incluir valor exacto.

### Visualización Q4 — Reconciliación

- Fuente: `quality.reconciliation`.
- Tipo: dos líneas para agregado por pozo y serie de control, más un panel inferior de `difference_pct`.
- Filtro por producto.
- La unidad sale de cada registro.

### Visualización Q5 — Revisiones detectadas

- Fuente: `quality.revisions`.
- Tipo: timeline.
- Mostrar fuente, momento, período afectado y filas cambiadas.

## 14. Ruta `/metodologia`

No es un dashboard. Debe priorizar lectura y trazabilidad.

- Glosario buscable desde `methodology.definitions`.
- Tabla de fuentes desde `methodology.sources` con publicador, licencia y enlace externo.
- Lista de limitaciones desde `methodology.caveats`.
- Diagrama editorial simple del flujo: fuente → ingesta → ClickHouse → dbt → JSON → web.
- Explicar que Vaca Muerta se define inicialmente por formación normalizada.
- Explicar unidades canónicas y por qué no se mezclan en un eje.

No inventar metodología adicional que contradiga el PRD o el modelo de datos.

## 15. Ruta `/descargas`

Generar una tarjeta por elemento de `downloads`:

- Título y descripción.
- Formato.
- Tamaño legible; si `size_bytes` es cero, mostrar “Tamaño no informado”.
- Fecha de actualización.
- Botón descargar con `url`.
- Nota de licencia y atribución tomada de metodología.

En modo mock, los botones cuyas URLs no existan deben verse como demostrativos y no provocar navegación a un 404. El JSON principal sí puede descargarse.

## 16. Ruta `/periodos/:releaseId`

- Resolver el período en `release_history`.
- Mostrar ID, fecha de corte, fecha de publicación y estado.
- Marcar la release activa.
- En el mock, no intentar cargar payloads históricos inexistentes.
- Incluir un listado de releases y enlace al resumen actual.

Cuando el pipeline publique carpetas históricas, esta ruta podrá cargar el `app-data.json` de la release seleccionada a través del mismo `dataClient`.

## 17. SEO y contenido compartible

Por ruta:

- `title` y `description` específicos.
- Canonical URL.
- Open Graph y Twitter card.
- Título con período cuando corresponda.
- Texto alternativo para gráficos y mapas.

Los títulos de visualizaciones deben expresar el hallazgo visible, pero no exagerar. Durante el mock, anteponer “Demostración:” a cualquier título que pueda interpretarse como dato real.

## 18. Accesibilidad

- Objetivo WCAG AA.
- Navegación completa con teclado.
- Focus visible.
- `aria-live` para cambios de filtros y carga.
- No comunicar positivos/negativos solo con verde/rojo.
- Todos los gráficos con resumen textual y tabla equivalente.
- Respetar `prefers-reduced-motion`.
- Mapa con alternativa tabular.
- Tooltips accesibles por foco, no solo hover.

## 19. Rendimiento

- Lazy loading por ruta.
- Importación dinámica de MapLibre.
- Memoizar cálculos del explorador.
- No volver a solicitar `app-data.json` en cada navegación.
- Cachear en memoria por `release_id`.
- Evitar animaciones costosas con más de 500 puntos.
- Home usable antes de descargar el bundle del mapa.

## 20. Modelo canónico del JSON

El archivo completo de referencia es [`app-data.json`](../web/public/data/releases/mock-2026-07/app-data.json). Su estructura de primer nivel es:

```json
{
  "schema_version": "1.0",
  "release": {
    "release_id": "mock-2026-07",
    "status": "mock",
    "is_mock": true,
    "data_cutoff": "2026-07-31",
    "generated_at": "2026-08-27T12:00:00Z",
    "last_complete_period": "2026-07-01",
    "pipeline_commit": "mock-not-applicable",
    "warning": "Datos sintéticos para diseñar y probar la interfaz."
  },
  "site": {},
  "filter_options": {},
  "home": {
    "kpis": [],
    "production_history": [],
    "operator_contributions": [],
    "insights": []
  },
  "explorer": { "default_state": {}, "rows": [] },
  "operators": { "rankings": [], "profiles": [] },
  "cohorts": {
    "minimum_sample_size": 10,
    "default_metric": "oil_monthly_m3",
    "curves": [],
    "cumulative_summary": []
  },
  "completions": { "coverage": {}, "bucket_stats": [], "scatter": [], "disclaimer": "" },
  "map": { "initial_view": {}, "color_modes": [], "wells_geojson": {}, "trajectories_geojson": {} },
  "quality": {
    "overall": {},
    "sources": [],
    "checks": [],
    "join_coverage": [],
    "reconciliation": [],
    "revisions": []
  },
  "downloads": [],
  "methodology": { "definitions": [], "sources": [], "caveats": [] },
  "release_history": []
}
```

### Reglas de evolución del contrato

- El pipeline debe completar todas estas claves de primer nivel.
- Puede agregar campos opcionales manteniendo `1.x`.
- No puede renombrar, eliminar ni cambiar el tipo de un campo sin publicar `2.0`.
- Los campos numéricos faltantes son `null`, no `""`, `"N/A"` ni `0` artificial.
- Los IDs y slugs son estables entre releases.
- Las unidades viajan con cada conjunto cuando puedan variar.
- El orden de buckets y narrativas es el orden editorial del JSON.
- El frontend no debe depender del orden de rankings salvo que exista `rank`.
- Todo GeoJSON debe ser WGS84, longitud primero y latitud después.

## 21. Correspondencia entre JSON y vistas

| Sección JSON      | Consumidor principal                 |
| ----------------- | ------------------------------------ |
| `release`, `site` | Shell, banners, footer, SEO          |
| `filter_options`  | Todos los filtros                    |
| `home`            | Resumen mensual                      |
| `explorer`        | Explorador y evolución de operadores |
| `operators`       | Ranking y perfiles                   |
| `cohorts`         | Cohortes y mini curvas de operador   |
| `completions`     | Fracturas y productividad            |
| `map`             | Mapa y alternativa tabular           |
| `quality`         | Calidad, frescura y reconciliación   |
| `downloads`       | Centro de descargas                  |
| `methodology`     | Definiciones, fuentes y tooltips     |
| `release_history` | Archivo de períodos                  |

## 22. Criterios de aceptación de la maqueta

La primera versión se considera terminada cuando:

1. Todas las rutas existen y son navegables sin recargar la página.
2. La aplicación no contiene números de negocio hardcodeados en TypeScript/JSX.
3. Cambiar un valor del mock y refrescar actualiza la visualización correspondiente.
4. Cambiar `latest.json` a otra carpeta compatible no exige recompilar componentes.
5. El banner de datos sintéticos aparece porque `is_mock=true`.
6. Los filtros del explorador alteran gráfico, composición y tabla.
7. La URL conserva los filtros y puede abrirse en otra pestaña con el mismo estado.
8. Ninguna comparación admite más de cinco series.
9. Cohortes con menos de 10 observaciones no se grafican como comparables.
10. Todos los `null` se muestran como ausencia de cobertura.
11. Petróleo, gas y agua nunca comparten un eje con unidades incompatibles.
12. Cada gráfico tiene unidad, período, fuente, metodología y tabla alternativa.
13. El mapa tiene clustering, popup, filtros y alternativa tabular.
14. Existen estados de loading, error, vacío y schema incompatible.
15. La experiencia es usable en 360 px, 768 px y 1.440 px.
16. Lighthouse no reporta errores críticos de accesibilidad.
17. No se creó Supabase, backend, autenticación ni dependencia de ClickHouse en runtime.

> **Estado 27-08-2026:** la maqueta implementada cumple los criterios 1-11, 13 (sin clustering), 14, 15 y 17. Pendientes: 12 (tablas alternativas en el home) y 16 (Lighthouse). Ver `docs/README.md` para el estado del proyecto y próximos pasos (pipeline + cutover).

## 23. Orden recomendado de construcción en Lovable

1. Shell, rutas, identidad visual y `dataClient`.
2. Home con KPIs y gráficos.
3. Explorador con filtros persistentes.
4. Ranking y perfiles de operadores.
5. Cohortes.
6. Fracturas.
7. Mapa.
8. Calidad, metodología, descargas y releases.
9. Accesibilidad, responsive, SEO y estados de error.

En cada etapa, pedirle a Lovable que reutilice componentes y que no modifique el contrato JSON. Si detecta que falta un campo, debe señalarlo antes de inventarlo.

## 24. Cutover del mock al pipeline real

El cambio será operativo, no de interfaz:

1. El exporter genera `web/public/data/releases/<release_id>/app-data.json` con `schema_version: "1.0"`.
2. Valida tipos, nulls, fechas, unidades y GeoJSON.
3. Se prueba la app contra esa carpeta.
4. Se actualiza `web/public/data/latest.json` al final.
5. Se publica la aplicación.

La primera release real tendrá `release.is_mock=false` y `release.status="complete"` o `"warning"`. El banner de maqueta desaparecerá automáticamente y el resto de la aplicación seguirá funcionando sin cambios.
