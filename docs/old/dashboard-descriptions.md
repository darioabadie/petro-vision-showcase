# PetroData — Documentación de tableros e indicadores

**Versión:** 1.0 · **Fecha:** 2026-07-19
**Uso:** fuente única para (a) los tooltips de la interfaz (descripción corta) y (b) la sección de documentación / metodología del sitio (descripción larga). Los IDs (A1–A11, B1–B3) corresponden al catálogo de KPIs de `mvp-vaca-muerta-data.md`.

**Convenciones generales** (aplican a todo el sitio y conviene citarlas una sola vez en la página de documentación):

- Fuente: Secretaría de Energía de la Nación — Capítulo IV (producción por pozo, mensual) y Adjunto IV (datos de fractura, actualización diaria). Licencia CC-BY 4.0.
- Conversiones: petróleo `m³ × 6,2898 = bbl`; tasas diarias = volumen mensual ÷ días calendario del mes. Gas: miles de m³/mes → MM m³/d.
- El último mes se descarta si su carga es parcial (<60% del mes anterior). Todo dato del Adjunto IV puede llegar con ~1 mes de rezago y se marca "preliminar".
- "VM" refiere a producción **no convencional** nacional (shale + tight), cuyo ~90% proviene de Vaca Muerta.

---

## 1. Overview — Estado de Vaca Muerta

### 1.1 Producción de petróleo (A1)

**Tooltip:** Producción de petróleo no convencional nacional en miles de barriles por día, al último mes completo del Capítulo IV.

**Descripción larga:** Suma de la producción mensual de petróleo (`prod_pet`, en m³) de todos los pozos no convencionales del país reportados al Capítulo IV, convertida a barriles (× 6,2898) y expresada como tasa diaria (÷ días del mes). Incluye shale y tight de todas las cuencas; ~90% corresponde a Vaca Muerta. Las variaciones MoM e YoY comparan contra el mes anterior y el mismo mes del año previo. El dato tiene ~1 mes de rezago respecto del calendario y puede ser rectificado por las operadoras en cargas posteriores.

### 1.2 Producción de gas (A1)

**Tooltip:** Producción de gas no convencional nacional en millones de m³ por día, al último mes completo del Capítulo IV.

**Descripción larga:** Suma de la producción mensual de gas (`prod_gas`, en miles de m³) de los pozos no convencionales, expresada como tasa diaria en millones de m³/día. Sensible a la estacionalidad invernal (los picos de demanda y el Plan Gas.Ar afectan el despacho): las comparaciones MoM de gas deben leerse con ese contexto.

### 1.3 Pozos conectados YTD (A3)

**Tooltip:** Pozos que registraron su primera producción en lo que va del año, comparado con el mismo período del año anterior.

**Descripción larga:** Conteo de pozos cuyo primer mes con producción (petróleo o gas > 0) en el Capítulo IV cae dentro del año en curso, acumulado hasta el último mes completo. La comparación interanual usa el mismo rango de meses del año previo. Es el mejor proxy público del ritmo de puesta en marcha: la SE no publica datos de perforación (no existe rig count oficial), por lo que este indicador —junto con las etapas de fractura— es el termómetro de actividad del sector. Nota: el criterio ("cualquier producción") difiere del usado en cohortes ("primera producción de petróleo"); ambos conteos no son comparables entre sí.

### 1.4 Arena bombeada (A8)

**Tooltip:** Toneladas de arena de fractura bombeadas en el mes, según el Adjunto IV. Dato preliminar con rezago de carga.

**Descripción larga:** Suma de `arena_bombeada_nacional_tn` + `arena_bombeada_importada_tn` de los trabajos de fractura cuya fecha de finalización cae en el mes. Es el indicador de demanda de la cadena de suministro de arena (minas, logística, transporte). **Limitación importante:** el Adjunto IV carga con rezago irregular — el mes más reciente puede aparecer inflado o desinflado hasta que se completa la carga (caso validado: salto de +207% MoM por subreporte del mes anterior). Se publica siempre con la etiqueta "preliminar" y se recomienda leerlo con un mes de rezago.

### 1.5 Etapas promedio por pozo (A8)

**Tooltip:** Cantidad promedio de etapas de fractura por pozo horizontal terminado en el período.

**Descripción larga:** Promedio de `cantidad_fracturas` (etapas) de los pozos con fractura finalizada en el período, según el Adjunto IV. Es la medida más directa de la intensidad de completación: más etapas implican mayor contacto con la roca y mayor costo de terminación. Su evolución histórica (de ~20 etapas en 2018 a más de 50 hoy) cuenta la historia de la optimización técnica de Vaca Muerta.

### 1.6 Rama lateral promedio (A8)

**Tooltip:** Longitud horizontal promedio (en metros) de los pozos fracturados en el período.

**Descripción larga:** Promedio de `longitud_rama_horizontal_m` de los pozos con fractura finalizada en el período. Junto con las etapas, define el "tamaño" del pozo típico. La tendencia a ramas más largas (3.000+ m) replica la evolución del shale norteamericano y es clave para normalizar comparaciones de productividad entre pozos y entre años.

### 1.7 Arena importada (%) (A8)

**Tooltip:** Porcentaje de la arena bombeada que es importada. La industria migró a arena 100% nacional.

**Descripción larga:** `arena_importada / arena_total` del período. Indicador de sustitución de importaciones de la cadena de valor: en los inicios de Vaca Muerta la arena de fractura era mayormente importada; hoy domina la arena nacional (Entre Ríos y otras fuentes). Un rebote de este indicador sería una señal de cuello de botella en la oferta local.

### 1.8 Ratio de completación (tn/pozo) (A8)

**Tooltip:** Arena promedio bombeada por pozo terminado en el mes, en toneladas.

**Descripción larga:** Arena total del período dividida por la cantidad de pozos con fractura finalizada. Mide la intensidad de arena del diseño de completación promedio. Hereda la limitación de rezago del dato de arena (ver 1.4).

### 1.9 Serie mensual de producción (A1)

**Tooltip:** Evolución de la producción no convencional de petróleo y gas de los últimos 24 meses.

**Descripción larga:** Series mensuales de producción de petróleo (kbbl/d) y gas (MM m³/d) no convencionales, calculadas con la metodología de 1.1 y 1.2. La ventana de 24 meses muestra la tendencia sin ruido de largo plazo; el histórico completo (2006→) está disponible en la documentación de datos. Los últimos 1–2 puntos pueden moverse levemente por rectificaciones de las operadoras.

### 1.10 Ranking de producción por operadora (A1)

**Tooltip:** Operadoras ordenadas por producción de petróleo no convencional del último mes, con su participación sobre el total.

**Descripción larga:** Producción de petróleo del último mes completo agregada por empresa operadora (quien reporta el pozo al Capítulo IV, no necesariamente el único socio del área), con el share sobre el total nacional. Los nombres se normalizan mediante una tabla de alias (ej.: "Vista Oil & Gas" y "Vista Energy" son la misma empresa; Pluspetrol S.A. y Pluspetrol Cuenca Neuquina S.R.L. se muestran por separado porque reportan como entidades distintas). El ranking refleja producción *operada*: la participación económica de cada socio en un área puede diferir.

### 1.11 Curva de declinación por cohorte (A5)

**Tooltip:** Producción promedio por pozo según sus meses en producción, agrupando los pozos por año de puesta en marcha.

**Descripción larga:** Cada cohorte agrupa los pozos cuya primera producción de petróleo ocurrió en un mismo año calendario. Para cada mes de "edad" (meses desde la primera producción) se calcula la producción promedio por pozo (bbl/d, usando 30,44 días/mes). La forma de la curva es la típica del shale: pico entre el segundo y tercer mes, luego declinación pronunciada. Comparar cohortes muestra si las nuevas generaciones de pozos rinden más (mejores diseños de completación, mejor selección de ubicaciones) — por ejemplo, la cohorte 2026 pica ~20% por encima de la 2025. Solo se publican puntos con más de 5 pozos para evitar ruido estadístico. Advertencia metodológica: las cohortes recientes están sesgadas hacia sus mejores meses (los pozos más nuevos aún no aportaron meses tardíos), y no se normaliza por rama lateral en esta vista (ver productividad por metro en fichas).

### 1.12 Fracturados sin conectar (A4)

**Tooltip:** Pozos con fractura terminada que aún no registraron primera producción. Inventario de conexión pendiente por operadora.

**Descripción larga:** Pozos con `fecha_fin_fractura` registrada en el Adjunto IV y sin primera producción en el padrón del Capítulo IV, agrupados por operadora. Es el buffer de producción de corto plazo: pozos listos que esperan facilities o conexión. La columna "buffer" expresa ese inventario en meses de conexiones al ritmo reciente de cada operadora (FsC ÷ conexiones promedio mensuales). **Por qué no lo llamamos "DUCs":** el DUC clásico (drilled but uncompleted) es un pozo *perforado sin fracturar*, y ese estadio no es observable en fuentes públicas — la SE no publica datos de perforación. Nuestro indicador captura el estadio siguiente (fracturado sin conectar), que para anticipar producción de corto plazo es incluso más accionable.

---

## 2. Actividad & DUCs

### 2.1 Etapas de fractura del mes (A2) — métrica insignia

**Tooltip:** Etapas de fractura completadas en el mes según el Adjunto IV oficial. El indicador de actividad más citado del sector.

**Descripción larga:** Suma de `cantidad_fracturas` de todos los trabajos cuya `fecha_fin_fractura` cae en el mes. Es la métrica de actividad de referencia en Vaca Muerta —la que la prensa especializada publica mensualmente citando relevamientos privados de empresas de servicios—, calculada acá desde el dato oficial del Adjunto IV, que se actualiza a diario. Diferencias posibles con los relevamientos privados: el Adjunto IV registra por fecha de fin de trabajo y puede traer ~1 mes de rezago de carga; los relevamientos de campo cuentan etapas al momento de ejecución. La serie histórica permite ver estacionalidad (paradas de enero, picos de fin de año) y el ciclo de actividad contra el precio del crudo.

### 2.2 Pozos conectados del mes (A3)

**Tooltip:** Pozos que registraron su primera producción en el mes. Proxy oficial del ritmo de puesta en marcha.

**Descripción larga:** Versión mensual del indicador 1.3: pozos cuyo primer mes con producción cae en el período. Leído junto con las etapas (2.1) permite inferir si la industria está completando más rápido de lo que conecta (crece el inventario FsC) o drenando inventario (conecta más de lo que fractura).

### 2.3 Sets de fractura activos — estimado (B1)

**Tooltip:** Cantidad estimada de equipos de fractura operando en simultáneo, inferida por solapamiento de fechas de trabajos. Siempre «estimado».

**Descripción larga:** La SE no informa equipos de fractura. Este indicador estima los "sets" activos contando, para cada día, cuántos trabajos del Adjunto IV tienen fechas de inicio/fin que se solapan; el valor mensual es el promedio (o máximo, según la vista) de esa serie diaria. Es el equivalente conceptual del *frac spread count* que publica Primary Vision para EE.UU. con relevamiento de campo. **Limitaciones:** asume un equipo por trabajo (un set que salta entre pads puede contarse doble; trabajos simultáneos del mismo pad pueden compartir set), y hereda el rezago de carga del Adjunto IV. Por eso se publica siempre con la etiqueta "estimado" y nunca como dato de campo.

### 2.4 Etapas por pozo conectado — ratio de actividad (B3)

**Tooltip:** Etapas de fractura del mes divididas por pozos conectados. Mide la intensidad relativa de completación versus puesta en marcha.

**Descripción larga:** Cociente entre 2.1 y 2.2. Sube cuando los pozos nuevos son más intensivos (más etapas por pozo) o cuando la conexión se atrasa respecto de la completación; baja cuando se conecta inventario acumulado. Útil como señal temprana de cuellos de botella en facilities/evacuación, leída junto con el inventario FsC (1.12).

### 2.5 Parámetros técnicos promedio (A8)

**Tooltip:** Diseño de completación promedio del período: etapas, rama lateral, arena por pozo y origen de la arena.

**Descripción larga:** Panel que agrupa los indicadores de intensidad de completación (documentados en 1.5–1.8) para el pozo horizontal no convencional promedio del período. Es la foto del "pozo tipo" que la industria está terminando hoy, y su evolución trimestral es el mejor resumen técnico de hacia dónde va el diseño de pozos en Vaca Muerta.

---

## 3. Fichas de operadora

### 3.1 KPIs de cabecera (A1)

**Tooltip:** Producción operada de petróleo y gas del último mes, pozos activos y participación sobre el total no convencional nacional.

**Descripción larga:** Producción de petróleo (kbbl/d) y gas (MM m³/d) de todos los pozos no convencionales operados por la empresa en el último mes completo, con variación MoM, share nacional y conteo de pozos con producción en el mes ("pozos activos" = pozos que reportaron volumen > 0, no pozos existentes). La ficha consolida los alias de la empresa (razones sociales históricas) según la tabla de normalización.

### 3.2 Serie histórica de la operadora (A1)

**Tooltip:** Evolución mensual de la producción operada de petróleo y gas desde 2018.

**Descripción larga:** Misma metodología que 1.9, filtrada por empresa operadora. Los saltos discretos suelen corresponder a cesiones de áreas o cambios de operador — no a producción física; el corte por razón social se documenta en la tabla de alias.

### 3.3 Áreas operadas

**Tooltip:** Áreas/concesiones donde la empresa reporta pozos con producción reciente, con su cantidad de pozos.

**Descripción larga:** Listado de áreas (concesiones de explotación no convencional) donde la empresa reportó producción desde el año anterior, ordenadas por volumen, con link a la ficha de cada área. Refleja operación, no titularidad: los socios no operadores de un consorcio no aparecen en el Capítulo IV.

---

## 4. Fichas de área

### 4.1 KPIs de cabecera (A1)

**Tooltip:** Producción del área en el último mes, pozos activos, cuenca, provincia y fecha de primera producción no convencional.

**Descripción larga:** Producción de petróleo y gas del área en el último mes completo, cantidad de pozos con producción, y metadatos de contexto (cuenca, provincia, primera producción NC registrada en el Capítulo IV — indicador de madurez del bloque).

### 4.2 Serie histórica del área (A1)

**Tooltip:** Evolución mensual de la producción del área desde 2018.

**Descripción larga:** Producción mensual agregada de todos los pozos del área. La forma de la curva revela la fase del bloque: rampa (desarrollo activo), plateau (equilibrio perforación/declinación) o declinación (desarrollo pausado). Cruzarla con las conexiones de pozos del área explica cada quiebre.

### 4.3 Operadoras del área

**Tooltip:** Empresas que reportan pozos con producción en el área.

**Descripción larga:** Operadoras con producción reciente en el área según el Capítulo IV. En áreas con cambio de operador, el historial completo queda repartido entre las razones sociales según la fecha de cada cesión (ver tabla de alias).

---

## 5. GOR y corte de agua (A10) — *fichas, próxima iteración*

**Tooltip:** Relación gas-petróleo y porcentaje de agua producida por área. Indicadores de madurez del reservorio.

**Descripción larga:** GOR = `prod_gas / prod_pet` (m³/m³); corte de agua = `prod_agua / (prod_agua + prod_pet)`. El GOR creciente en áreas oil es una señal clásica de depleción de presión; el corte de agua alto afecta economía de tratamiento. Ambos se calculan directo del Capítulo IV por área y por cohorte.

---

## Apéndice: tabla resumen para tooltips

| ID | Indicador | Tooltip (copiar/pegar) |
|----|-----------|------------------------|
| A1a | Producción oil | Producción de petróleo no convencional nacional en kbbl/d, al último mes completo del Capítulo IV. |
| A1b | Producción gas | Producción de gas no convencional nacional en MM m³/d, al último mes completo del Capítulo IV. |
| A3y | Conectados YTD | Pozos con primera producción en lo que va del año vs. mismo período del año anterior. |
| A8a | Arena bombeada | Toneladas de arena de fractura bombeadas en el mes (Adjunto IV). Dato preliminar con rezago de carga. |
| A8b | Etapas/pozo | Cantidad promedio de etapas de fractura por pozo horizontal terminado en el período. |
| A8c | Rama lateral | Longitud horizontal promedio (m) de los pozos fracturados en el período. |
| A8d | Arena importada | Porcentaje de la arena bombeada que es importada. La industria migró a arena 100% nacional. |
| A8e | Ratio completación | Arena promedio bombeada por pozo terminado en el mes, en toneladas. |
| A1c | Serie mensual | Evolución de la producción no convencional de petróleo y gas de los últimos 24 meses. |
| A1d | Ranking operadoras | Operadoras por producción de petróleo del último mes, con participación sobre el total. |
| A5 | Cohortes | Producción promedio por pozo según meses en producción, agrupado por año de puesta en marcha. |
| A4 | Fracturados sin conectar | Pozos con fractura terminada sin primera producción. Inventario de conexión pendiente por operadora. |
| A2 | Etapas del mes | Etapas de fractura completadas en el mes según el Adjunto IV oficial. El indicador de actividad más citado del sector. |
| A3m | Conectados del mes | Pozos con primera producción en el mes. Proxy oficial del ritmo de puesta en marcha. |
| B1 | Sets activos (est.) | Equipos de fractura operando en simultáneo, estimados por solapamiento de fechas de trabajos. Siempre «estimado». |
| B3 | Ratio actividad | Etapas del mes por pozo conectado. Intensidad de completación vs. puesta en marcha. |
| A10 | GOR / corte de agua | Relación gas-petróleo y % de agua producida por área. Indicadores de madurez del reservorio. |

*Los tooltips no superan ~140 caracteres para render limpio en hover. Cualquier cambio de fórmula debe actualizarse acá y en `metodologia.json` en el mismo commit.*