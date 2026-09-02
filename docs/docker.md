# Infraestructura Docker

*[English version](docker.en.md)*

**Alcance:** qué corre containerizado hoy, qué corre local y por qué, y cómo operar el entorno.

## Estado real (no el aspiracional)

`architecture.md` describe un diseño objetivo con containers separados para ingesta, dbt y exporter. **Eso todavía no está construido.** Lo que existe hoy en `docker-compose.yml` es un único servicio:

```yaml
services:
  clickhouse:
    image: clickhouse/clickhouse-server:24.8
    container_name: pvm-clickhouse
    environment:
      CLICKHOUSE_DB: default
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: pvm_dev
    ports:
      - "127.0.0.1:8123:8123"   # HTTP
      - "127.0.0.1:9000:9000"   # protocolo nativo (dbt)
    volumes:
      - ch_data:/var/lib/clickhouse
    ulimits:
      nofile: { soft: 262144, hard: 262144 }
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:8123/ping"]
```

Ingesta, dbt y exporter corren **fuera de Docker**, directo en el host, orquestados por `uv` (gestor de entornos Python) y `dbt-core`. Es una decisión consciente para el alcance actual, no un olvido:

- Un pipeline mensual, corrido por una sola persona, no justifica el costo de mantener tres Dockerfiles adicionales todavía.
- Iterar sobre el pipeline (agregar una fuente, cambiar un modelo dbt) es más rápido sin rebuildear una imagen en cada corrida.
- El único componente que *necesita* aislarse es ClickHouse: es el único proceso persistente con estado en disco.

Containerizar ingesta/dbt/exporter queda como paso natural post-MVP (`docs/README.md`, sección "Próximos pasos"), y no cambia nada del modelo de datos ni de los contratos cuando se haga.

## Por qué solo ClickHouse va en Docker

| Propiedad | ClickHouse | Ingesta / dbt / exporter |
|---|---|---|
| Tiene estado persistente | Sí (volumen `ch_data`) | No (leen fuentes públicas y escriben archivos versionados en Git) |
| Necesita estar "arriba" entre corridas | Sí | No — corren, terminan, no dejan proceso vivo |
| Beneficio de aislar dependencias | Bajo (una sola imagen oficial) | Medio (uv ya fija versiones sin Docker) |

## Detalle del servicio

- **Imagen**: `clickhouse/clickhouse-server:24.8` — versión fija, no `:latest`, para reproducibilidad.
- **Puertos bindeados a `127.0.0.1`**: ni el puerto HTTP (8123) ni el nativo (9000) escuchan en la interfaz de red pública del host. No hay forma de llegar a ClickHouse desde fuera de la máquina que corre Docker, aunque el firewall del host esté abierto.
- **`ulimits.nofile: 262144`**: ClickHouse abre muchos file descriptors (una parte de MergeTree por partición/merge). El default del sistema operativo (a menudo 1024) no alcanza incluso con volúmenes moderados; sin este ajuste el container puede fallar bajo carga con "too many open files".
- **Healthcheck sobre `/ping`**: `make up` usa `docker compose up -d --wait`, que bloquea hasta que el healthcheck pasa — así ningún target de ingesta/dbt corre contra un ClickHouse que todavía está arrancando.
- **Volumen nombrado `ch_data`**: persiste entre `docker compose down` (sin `-v`). Se pierde solo con `down -v` o `docker volume rm`.

## Comandos

```bash
make up      # docker compose up -d --wait — levanta y espera el healthcheck
make down    # docker compose down — para el container, conserva el volumen
make ps      # docker compose ps — estado del servicio
```

Equivalentes directos si no se quiere pasar por el Makefile:

```bash
docker compose up -d --wait
docker compose logs -f clickhouse
docker compose exec clickhouse clickhouse-client
docker compose down            # conserva ch_data
docker compose down -v         # borra ch_data (raw completo se pierde, es reconstruible)
```

## Seguridad

- Las credenciales (`default` / `pvm_dev`) son de desarrollo local, hardcodeadas en `docker-compose.yml` a propósito — nunca se usan fuera de la laptop del pipeline y no protegen nada sensible (no hay PII, es todo dato público de producción de hidrocarburos).
- `CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: "1"` habilita gestión de usuarios vía SQL, útil para desarrollo; no relevante para exposición porque el puerto nunca sale de `localhost`.
- No hay ningún puerto público, ni `0.0.0.0`, ni Traefik/nginx delante. El único servidor con superficie pública es el hosting estático del frontend (ver `architecture.md` §12-13), que no tiene ninguna conexión de red hacia ClickHouse.

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `make up` cuelga esperando el healthcheck | Puerto 8123/9000 ocupado por otro proceso | `lsof -i :8123` / `:9000`, matar el proceso o parar el otro ClickHouse |
| `dbt debug` falla con connection refused | ClickHouse todavía no pasó el healthcheck, o `make up` no corrió | `make ps`, esperar o revisar `docker compose logs clickhouse` |
| "too many open files" con volumen grande | `ulimits` no se aplicó (Docker Desktop en algunos hosts ignora `ulimits` del compose) | Subir el límite global de Docker Desktop, o `docker compose up --force-recreate` |
| Ingesta corre pero `dbt run` no ve las tablas nuevas | `raw_energy` no se creó porque `make ingest` no llegó a `ensure_schema()` | Revisar el log de `make ingest`; `ensure_schema()` corre siempre al inicio de cada ingesta |

## Ver también

- [`clickhouse.md`](clickhouse.md) — qué hay adentro de este container.
- [`actualizacion-datos.md`](actualizacion-datos.md) — cómo `make up` encaja en el ciclo completo de un release.
- [`architecture.md`](architecture.md) §5 — diseño objetivo con ingesta/dbt/exporter también containerizados.
