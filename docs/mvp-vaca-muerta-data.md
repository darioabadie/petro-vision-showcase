# Vaca Muerta Data — Definición del MVP

**Producto:** plataforma de inteligencia sobre el oil & gas argentino que combina BI sobre datos públicos de la Secretaría de Energía con una wiki de contexto (empresas, áreas, eventos, contradicciones), construida con pipelines automatizados.

**Actualización de scope (2026-07-19):** el lanzamiento es **100% numérico** — solo datos estructurados de la Secretaría de Energía. Sin scraping de texto (boletines oficiales, prensa, filings) por ahora: la capa editorial (eventos, guidance tracker con fuentes textuales) pasa a fase posterior. El catálogo de KPIs del lanzamiento está en la sección "Catálogo de KPIs".

**Tesis:** el modelo ya funcionó en otros mercados con la misma materia prima. ShaleProfile arrancó como blog gratuito de un desarrollador solo sobre datos públicos de Texas y fue [adquirida por Novi Labs en 2021](https://novilabs.com/news/novi-labs-announces-the-acquisition-of-shaleprofile/); Enverus arrancó digitalizando registros públicos y [Blackstone la compró por US$6.100–6.400M](https://jpt.spe.org/energy-data-giant-enverus-sells-to-asset-management-giant-blackstone). En Argentina el dato público equivalente (Capítulo IV / Adjunto IV) existe, se actualiza mensualmente, y nadie combina todavía BI self-service con contexto navegable.

**Diferencial:** no competimos como consultora (Aleph/Ecolatina) ni como dashboard puro ([Energética](https://energetica.ar/), en beta cerrada). El diferencial es la capa de contexto: cada número linkea a la historia de la entidad que lo produce, con fuentes citadas y contradicciones rastreadas (anunciado vs. ejecutado).

---

## Etapa 1 — El observatorio automatizado (semanas 1–8)

*Lo más simple y lo que más valor aporta: publicar lo que ya sabemos hacer.*

**Alcance.** Sitio público estático con tres componentes, todos generados por pipeline (cero redacción manual):

1. **Páginas auto-generadas** por operadora (\~15 relevantes), área (\~30) y cuenca, con ficha, gráficos de producción histórica y links cruzados. El prototipo (`prototipo-vaca-muerta/`) ya genera esto; falta sumar el Adjunto IV de fracturas (etapas, arena, rama lateral) a las fichas de área.  
2. **Tablero resumen mensual**: producción NC nacional, ranking de operadoras, altas de pozos, intensidad de fractura. Publicado como página, no como app (sin servidores que mantener).  
3. **Newsletter mensual "Estado de Vaca Muerta"**: 4–5 visualizaciones con lectura breve, disparado a los días de cada actualización del Capítulo IV. Es el motor de distribución — fue exactamente el camino de ShaleProfile.

**Fuentes:** solo datos estructurados de [datos.energia.gob.ar](http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo) (Capítulo IV, Adjunto IV, permisos y concesiones). Consultas agregadas vía datastore SQL, sin descargar CSVs completos (validado en el prototipo: 410.945 registros agregados server-side en segundos).

**Infraestructura mínima:** ETL en Python \+ generador estático (MkDocs/Quartz, stack ya dominado) \+ hosting estático gratuito \+ servicio de newsletter con plan free. Costo mensual: \~US$0. Incluye la **tabla de alias de empresas** desde el día 1 (Vista Oil & Gas → Vista Energy, los dos Pluspetrol, etc.): es infraestructura crítica para todo lo que sigue.

**Monetización:** ninguna. El objetivo es audiencia y autoridad.

**Criterio de éxito para pasar a Etapa 2:** 300–500 suscriptores del newsletter en 3 meses y menciones/replicación en prensa especializada o LinkedIn del sector. Si en 3 meses no hay tracción, se revisa el posicionamiento antes de invertir en la capa 2\.

---

## Catálogo de KPIs del lanzamiento (solo datos SE)

Relevamiento contra lo que publican los portales especializados (EconoJournal, Río Negro Energía) y los estándares de la industria (EIA Drilling Productivity Report, Baker Hughes, Primary Vision). Referencia local: la prensa titula con etapas de fractura mensuales, share por operadora, pozos conectados y equipos activos.

### Grupo A — cálculo directo desde datos oficiales

| \# | KPI | Fuente | Tablero |
| :---- | :---- | :---- | :---- |
| A1 | Producción oil/gas por operadora/área/cuenca — MoM, YoY, récords | F1 | T1 |
| A2 | **Etapas de fractura por mes y por operadora** (métrica insignia: hoy la prensa la publica con datos privados mensuales; nosotros con Adjunto IV oficial y diario) | F2 | T7 |
| A3 | Pozos conectados por mes/operadora (primera producción) | F1b | T7 |
| A4 | DUCs: pozos con fractura terminada sin primera producción \+ tiempo fractura→puesta en marcha por operadora | F2 − F1b | T7 |
| A5 | Curvas tipo por cohorte / operadora / área | F1 \+ F1b | T8 |
| A6 | IP primer mes / pico, normalizado por días efectivos (`tef`) | F1 | T8 |
| A7 | Productividad por metro de rama lateral (bbl/d por m) | F1 \+ F2 | T8 |
| A8 | Intensidad de completación: etapas/pozo, arena/pozo, tn arena por metro, % arena importada, rama promedio | F2 | T7/T8 |
| A9 | Velocidad de completación: etapas/día por operadora, días de fractura por pozo | F2 | T7 |
| A10 | GOR y corte de agua por área | F1 | T8 |
| A11 | Récords: pozo con más etapas, rama más larga, mejor IP normalizado | F1 \+ F2 | Newsletter |

### Grupo B — derivados con metodología explícita (también 100% SE)

| \# | KPI | Método | Fuente |
| :---- | :---- | :---- | :---- |
| B1 | **Sets de fractura activos (estimado)** — proxy del frac spread count de Primary Vision | Conteo de trabajos de fractura con fechas solapadas (`fecha_inicio` / `fecha_fin`), por día y por operadora. Publicar siempre como "estimado" con metodología a la vista | F2 |
| B2 | Vida de reservas (R/P) por operadora/cuenca | Reservas comprobadas (anual) sobre producción anualizada | F5 / F1 |
| B3 | Ratio actividad: pozos conectados vs. etapas (eficiencia de completación agregada) | Serie mensual conectados / etapas | F1b / F2 |

### Gaps asumidos (no salen de la SE — comunicar con honestidad)

- **Rig count real** (equipos de perforación): relevamiento privado; la SE no publica perforación. Se compensa con A3 \+ A2 diarios como termómetro de actividad.  
- **Share por empresa de servicios** (SLB/Halliburton): dato privado de NCS Multistage.  
- **Breakevens / costos de pozo**: sin fuente pública; parametrizable por el usuario en T10 (fase 2).  
- **Guidance, capex, M\&A**: requieren fuentes textuales — fuera del scope de lanzamiento por decisión explícita.

---

## Etapa 2 — La wiki con memoria (meses 3–6) — *pospuesta: requiere pipeline de texto*

*Sumar la capa de contexto que nadie tiene. **Nota de scope 2026-07-19:** esta etapa depende de ingesta de texto (boletines, prensa, filings), excluida del lanzamiento. Se activa recién cuando la Etapa 1 numérica tenga tracción. Mientras tanto, las fichas wiki de operadoras/áreas se alimentan solo de datos numéricos SE (capa 1).*

**Alcance.**

1. **Pipeline de eventos**: ingesta de boletines oficiales (Nación, Neuquén, Río Negro) y RSS de prensa especializada (EconoJournal, Río Negro Energía, Mejor Energía, Vaca Muerta News) → extracción de entidades y eventos con LLM → borrador con cita → curaduría humana (1–2 hs/día) → publicación. Cada página de empresa/área gana su timeline: concesiones, cesiones, farm-ins, M\&A, sanciones.  
2. **Taxonomía completa**: entidades (empresas, áreas, infraestructura, personas, instituciones, geología), conceptos (glosario técnico/regulatorio/comercial en español argentino: RIGI, Plan Gas.Ar, CENCH, curva tipo, DUC) y eventos, con jerarquía de fuentes explícita (dato estructurado \> boletín oficial \> filing CNV/SEC \> prensa \> corporativo).  
3. **`contradicciones.md` v1**: cruce sistemático anunciado vs. ejecutado para las top 10 operadoras — guidance de pozos y capex (earnings calls de YPF y Vista, hechos relevantes CNV) contra pozos conectados y producción real del Capítulo IV. Publicación trimestral. Este es el contenido que la prensa va a citar.

**Monetización inicial:** sponsor único del newsletter (benchmark local: pauta en medios especializados del sector) y perfiles destacados para empresas de servicios. Meta modesta: US$500–1.500/mes que cubran el tiempo de curaduría.

**Criterio de éxito:** 1.500+ suscriptores, primer sponsor pago, y al menos un informe de contradicciones citado por un medio del sector.

---

## Etapa 3 — El producto pago (meses 6–12)

*Convertir autoridad en suscripción.*

**Alcance.**

1. **Suscripción Pro** (US$50–150/mes por asiento): tableros interactivos con curvas de declinación por cohorte y operadora, benchmarking de completación (etapas, arena, rama lateral por pozo), export CSV, alertas por empresa/área (nueva concesión, cambio de titularidad, desvío de guidance). Referencias de disposición a pagar en la industria: contratistas pagan [US$875–3.000/año a ISNetworld](https://jobqualified.com/blogs/isnetworld/cost) y [£199+/año a Achilles](https://infinity-ex.com/achilles-jqs-registration-atex-supplier-guide-norway/) solo por visibilidad/compliance; ShaleProfile cobraba cientos de US$/mes por asiento de analista.  
2. **Reportes trimestrales** semi-automatizados desde el pipeline (versión pública resumida \+ versión completa para suscriptores).  
3. **Enterprise/API** a medida para los que hoy le compran a consultoras: acceso programático a las series limpias \+ la capa de eventos.

**Números objetivo:** 50 suscriptores Pro a \~US$100/mes \= US$60.000/año, operable por una persona. Con 2–3 clientes enterprise se duplica. (Contexto: [46% de los contratos O\&G del 2° semestre 2025 fue a pymes neuquinas certificadas](https://www.alertadigital.ar/noticias/2026/04/23/162651-el-compre-neuquino-gana-terreno-casi-la-mitad-de-los-contratos-petroleros-ya-queda-en-pymes-locales) — el ecosistema que necesita esta información excede a las operadoras.)

**Expansión posterior (fuera del MVP):** directorio-wiki de proveedores con perfiles pagos (el "Achilles criollo" — no existe en Argentina), cobertura de midstream/LNG, y licenciamiento del pipeline a otros mercados (México, Colombia, Brasil publican datos equivalentes).

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| :---- | :---- |
| [Energética](https://energetica.ar/) sale de beta antes que nosotros | Nuestra defensa no es el dashboard sino la capa de contexto \+ newsletter con audiencia propia. Moverse ya en Etapa 1\. |
| Datos del Capítulo IV rectificados o demorados | Publicar siempre con fecha de corte y flag de "dato preliminar"; el `log.md` de auditoría es parte del producto. |
| Resolución de entidades incorrecta (alias, cesiones) | Tabla de alias curada a mano desde el día 1; toda fusión/cesión es un evento con fuente. |
| Dependencia de una sola persona | Todo es pipeline reproducible \+ curaduría acotada (1–2 hs/día); nada requiere redacción manual masiva. |
| El sector paga consultoría, no software | La Etapa 2 valida disposición a pagar con sponsors antes de construir el paywall de la Etapa 3\. |

## Qué NO es el MVP

Sin app móvil, sin BI en tiempo real, sin cobertura de convencional ni downstream, sin foro/comunidad, sin scraping de fuentes pagas. Cada uno puede evaluarse después, pero ninguno aporta al loop central: **dato público → pipeline → contexto → audiencia → suscripción**.  
