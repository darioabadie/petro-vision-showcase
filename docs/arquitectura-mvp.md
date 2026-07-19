# Arquitectura MVP — Petrodata Oil & Gas Argentina

**Versión:** 1.0 · **Fecha:** 2026-07-18 · **Autor:** Dario / deployr.ai **Relación con otros docs:** este documento reemplaza, *para la fase MVP*, la infraestructura descripta en `arquitectura-etl-azure.md` v1.1. El modelo de datos (`data_model.md`) y el PRD de tableros siguen vigentes; acá solo cambia el motor de ejecución y el serving. La arquitectura completa con Databricks queda como diseño de fase 2+.

---

## 1\. Principios y decisiones

| Decisión | Elección | Razón |
| :---- | :---- | :---- |
| Cloud | **100% Azure** | Créditos NVIDIA Inception (US$1.000); consumo continuo y legítimo suma para renovación |
| Motor ETL | **Azure Functions (Python, timer trigger)** | Equivalente a Glue Python Shell: `.py` \+ `requirements.txt`, sin containers, sin ACR, pago por segundo |
| Transformación | **DuckDB / Polars dentro de la Function** | El volumen (410k filas/año F1, 4.8k registros F2) entra en memoria; misma lógica portable a Spark si algún día hace falta |
| DB as a service | **Azure Database for PostgreSQL Flexible Server (B1ms)** | Silver \+ gold relacional; PostGIS para F3/F11 (tablero Land, fase 2); ecosistema estándar; stop/start |
| Raw / auditoría | **ADLS Gen2, container bronze (Parquet)** | Landing inmutable por fuente/fecha; trazabilidad ante rectificaciones de la SE |
| Serving al frontend | **JSON estático en Blob `$web` (+ Front Door opcional)** | Lovable lee por fetch en runtime; cero backend que mantener |
| Dashboarding | **Frontend Lovable existente** | Reemplaza a Superset; producto público \> herramienta interna |
| CI/CD | **GitHub Actions** | Solo despliega código (tests \+ publish a Function App \+ Terraform); NO ejecuta el ETL |
| IaC | **Terraform** | Se conserva la estructura ya escrita, sin los módulos de Databricks/Superset |

### Qué queda explícitamente FUERA del MVP

- **Databricks / Spark** — sin volumen que lo justifique; \~US$400/mes de cluster ocioso.  
- **Containers (ACR \+ Container Apps)** — Functions cubre el caso; menos piezas.  
- **Superset \+ VM** — el frontend Lovable ya existe.  
- **Synapse Serverless** — opcional más adelante como SQL ad-hoc sobre bronze; $0 idle, se agrega cuando haga falta.  
- **ADF / Fabric** — ADF entra como orquestador si el pipeline crece a muchas fuentes; Fabric solo si se renuevan créditos y el producto lo pide.

### Disparadores de migración a la arquitectura completa (por evento, no por calendario)

1. Primer cliente Enterprise con exigencia de API/SLA → Function HTTP \+ tier superior de Postgres.  
2. Queries interactivas multiusuario sobre el histórico completo → Synapse/Fabric.  
3. Volumen o complejidad que exceda una Function (\>10 min en Flex Consumption) → Container Apps Jobs o Databricks.  
4. Segundo desarrollador full-time → revisar orquestación (ADF).

---

## 2\. Diagrama

```
FUENTES (fase MVP: F1, F1b, F2, F13, F14)
  CKAN datastore (User-Agent navegador) · BCRA REST · EIA REST
        │
        ▼
AZURE FUNCTIONS (Python 3.11, plan Flex Consumption)
  ├─ fn-diaria    timer 06:00 ART → F2 fracturas, F13 BCRA, F14 EIA
  ├─ fn-mensual   timer día 1, 02:00 ART → F1 producción, F1b padrón,
  │               rebuild dims + facts + export completo
  └─ fn-refresh   HTTP (auth) → re-corrida a demanda (rectificaciones)
        │
        ├──► ADLS Gen2 /bronze/{fuente}/{yyyy-mm-dd}/  (Parquet raw + _ingested_at)
        │
        ├──► PostgreSQL Flexible Server
        │      silver.*  (tipado, dedup, trim — según data_model.md)
        │      gold.*    (fact_produccion, fact_fracturas, dim_empresa+alias,
        │                 dim_pozo, dim_tiempo)
        │
        └──► EXPORT (último paso del job)
               petrodata.json + operadoras/{slug}.json + areas/{slug}.json
               → Blob Storage container $web (static website, CORS habilitado)
               → [opcional] Azure Front Door (dominio datos.petrodata.ar, purge al publicar)
                       │
                       ▼
               FRONTEND LOVABLE  — fetch() en runtime, badge "Pipeline OK"
               alimentado por meta.generado del JSON

Transversales: Key Vault (EIA key, conn strings) · Managed Identity ·
Application Insights (alerta por job fallido) · GitHub Actions (CI/CD)
```

---

## 3\. Componentes

### 3.1 Azure Functions — el "Glue" del MVP

- Un solo Function App, tres funciones (`fn_diaria`, `fn_mensual`, `fn_refresh`), código compartido en `src/` (misma estructura de `arquitectura-etl-azure.md`: `clients/`, `ingest/`, `transform/`).  
- Deploy: zip de `.py` \+ `requirements.txt` vía GitHub Actions. Sin Dockerfile.  
- Plan **Flex Consumption**: sin límite práctico de duración para el rebuild mensual; escala a cero.  
- El client CKAN conserva el **User-Agent de navegador** (bloqueo validado) y la paginación por `offset`.  
- Optimización validada en prototipo: agregaciones server-side vía `datastore_search_sql` cuando alcanza; descarga completa solo para bronze.

### 3.2 PostgreSQL Flexible Server

- **B1ms** (1 vCore, 2 GB) alcanza de sobra; \~US$13–15/mes. Backups automáticos 7 días.  
- Esquemas `silver` y `gold` según `data_model.md` (subset MVP: f01, f01b, f02 \+ dims).  
- **`dim_empresa` con tabla de alias** es asset crítico desde el día 1 (Vista Oil & Gas → Vista Energy, los dos Pluspetrol, etc.).  
- PostGIS instalado pero sin uso hasta el tablero Land (F3/F11, fase 2).

### 3.3 Serving: JSON estático

- Nombres de archivo **fijos** (`petrodata.json`); la frescura viaja adentro (`meta.corte`, `meta.generado`).  
- Headers: `Cache-Control: max-age=3600` \+ CORS (`Access-Control-Allow-Origin` \= dominio Lovable o `*`).  
- Si hay Front Door: purge del cache como último paso del job.  
- Contrato del JSON: el ya definido en `petrodata.json` v1 (kpis, serie\_mensual, ranking\_operadoras, operadoras{}, areas{}, cohortes; eventos y contradicciones vacíos hasta capa 2).

### 3.4 Lovable: cómo se actualiza a diario

**No se actualiza: lee.** El frontend hace fetch del JSON al cargar; cada visitante recibe el dato del día. Lovable solo se redeploya por cambios de código, nunca por datos.

```javascript
const BASE = "https://datos.petrodata.ar";
const data = await (await fetch(`${BASE}/petrodata.json`)).json();
// data.meta.generado → badge "Pipeline OK · última corrida"
// data.meta.corte    → "Datos al corte MM/YYYY"
```

### 3.5 GitHub Actions (CI/CD, no ETL)

1. Push a `main` → corre pytest (tests de transformaciones: cambios de esquema de la SE no deben romper gold en silencio).  
2. Verde → publica los `.py` a la Function App (OIDC federado, sin passwords en secrets).  
3. `terraform plan` en PR / `apply` en merge para cambios de infra.  
4. `workflow_dispatch` opcional como botón de re-corrida (llama a `fn_refresh`).

---

## 4\. Alcance funcional del MVP

**Tableros:** T1 (Monitor nacional de producción) \+ T7 (Actividad y DUCs). T7 es el diferencial: el Adjunto IV se actualiza a **diario** — monitor de fracturas casi en tiempo real que hoy no ofrece nadie. Métrica insignia: DUCs \= `fecha_fin_fractura` (F2) − primera producción (F1b).

**Fuentes:** F1, F1b, F2 (core) \+ F13, F14 (contexto de precios, APIs triviales). F4 (regalías, ZIP sin API) recién con T6; F10 (ENARGAS) recién con T5. Ver priorización completa en el PRD.

**Siguiente en la cola (fase 1):** T8 type curves — reutiliza el mismo pipeline F1+F2 sin infra nueva.

---

## 5\. Costos estimados

| Recurso | Costo/mes (aprox.) |
| :---- | :---- |
| Azure Functions (Flex Consumption, corridas de minutos) | $1–5 |
| PostgreSQL Flexible B1ms | $13–15 |
| ADLS Gen2 \+ Blob $web | $3–5 |
| Key Vault \+ App Insights | $2–5 |
| Front Door Standard (opcional) | \~$35 |
| **Total sin Front Door** | **\~$20–30** |
| **Total con Front Door** | **\~$55–65** |

Los US$1.000 de Inception cubren 12+ meses. Para acelerar consumo con valor real: **Azure OpenAI para la capa 2** (extracción de eventos desde boletines oficiales y prensa) — gasto genuino y alineado con la narrativa del programa.

Precios aproximados a julio 2026 — verificar en la calculadora de Azure para la región elegida antes de aplicar Terraform.

---

## 6\. Estructura Terraform (subset MVP)

```
terraform/
├── main.tf            # provider, RG, tags
├── storage.tf         # ADLS Gen2 (bronze) + storage $web
├── functions.tf       # Function App Flex Consumption + timers
├── postgres.tf        # Flexible Server B1ms + schemas
├── keyvault.tf        # secrets (EIA key, PG conn)
├── frontdoor.tf       # opcional
├── monitoring.tf      # App Insights + alerta job fallido
├── variables.tf / outputs.tf / terraform.tfvars
```

Los módulos `databricks.tf`, `synapse.tf` y `superset.tf` del diseño v1.1 no se aplican en MVP; quedan en el repo para la fase 2\.  
