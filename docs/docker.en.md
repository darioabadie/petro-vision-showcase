# Docker infrastructure

*[Versión en español](docker.md)*

**Scope:** what runs containerized today, what runs locally and why, and how to operate the environment.

## Real state (not the aspirational one)

`architecture.md` describes a target design with separate containers for ingestion, dbt, and the exporter. **That hasn't been built yet.** What exists today in `docker-compose.yml` is a single service:

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
      - "127.0.0.1:9000:9000"   # native protocol (dbt)
    volumes:
      - ch_data:/var/lib/clickhouse
    ulimits:
      nofile: { soft: 262144, hard: 262144 }
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:8123/ping"]
```

Ingestion, dbt, and the exporter run **outside Docker**, directly on the host, orchestrated by `uv` (a Python environment manager) and `dbt-core`. This is a deliberate decision for the current scope, not an oversight:

- A monthly pipeline, run by a single person, doesn't justify the cost of maintaining three extra Dockerfiles yet.
- Iterating on the pipeline (adding a source, changing a dbt model) is faster without rebuilding an image on every run.
- The only component that actually *needs* isolation is ClickHouse: it's the only persistent, stateful process.

Containerizing ingestion/dbt/exporter is a natural next step post-MVP (`docs/README.md`, "Next steps" section), and doesn't change anything about the data model or the contracts once it happens.

## Why only ClickHouse is in Docker

| Property | ClickHouse | Ingestion / dbt / exporter |
|---|---|---|
| Has persistent state | Yes (`ch_data` volume) | No — they read public sources and write files versioned in Git |
| Needs to stay "up" between runs | Yes | No — they run, finish, leave no live process |
| Benefit of isolating dependencies | Low (one official image) | Medium (`uv` already pins versions without Docker) |

## Service details

- **Image**: `clickhouse/clickhouse-server:24.8` — pinned version, not `:latest`, for reproducibility.
- **Ports bound to `127.0.0.1`**: neither the HTTP port (8123) nor the native one (9000) listen on the host's public network interface. There's no way to reach ClickHouse from outside the machine running Docker, even if the host firewall is wide open.
- **`ulimits.nofile: 262144`**: ClickHouse opens a lot of file descriptors (one MergeTree part per partition/merge). The OS default (often 1024) isn't enough even at moderate volume; without this setting, the container can fail under load with "too many open files".
- **Healthcheck on `/ping`**: `make up` uses `docker compose up -d --wait`, which blocks until the healthcheck passes — so no ingestion/dbt target ever runs against a ClickHouse that's still starting up.
- **Named volume `ch_data`**: persists across `docker compose down` (without `-v`). It's only lost with `down -v` or `docker volume rm`.

## Commands

```bash
make up      # docker compose up -d --wait — starts and waits for the healthcheck
make down    # docker compose down — stops the container, keeps the volume
make ps      # docker compose ps — service status
```

Direct equivalents if you'd rather skip the Makefile:

```bash
docker compose up -d --wait
docker compose logs -f clickhouse
docker compose exec clickhouse clickhouse-client
docker compose down            # keeps ch_data
docker compose down -v         # deletes ch_data (all raw data lost, but rebuildable)
```

## Security

- The credentials (`default` / `pvm_dev`) are local development credentials, deliberately hardcoded in `docker-compose.yml` — they're never used outside the pipeline's laptop and don't protect anything sensitive (no PII, all data is public oil & gas production data).
- `CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: "1"` enables user management via SQL, useful for development; irrelevant to exposure since the port never leaves `localhost`.
- There's no public port, no `0.0.0.0`, no Traefik/nginx in front. The only server with a public surface is the frontend's static hosting (see `architecture.md` §12-13), which has no network path to ClickHouse whatsoever.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `make up` hangs waiting on the healthcheck | Port 8123/9000 already in use by another process | `lsof -i :8123` / `:9000`, kill the other process or stop the other ClickHouse |
| `dbt debug` fails with connection refused | ClickHouse hasn't passed the healthcheck yet, or `make up` never ran | `make ps`, wait, or check `docker compose logs clickhouse` |
| "Too many open files" at higher volume | `ulimits` weren't applied (Docker Desktop on some hosts ignores compose `ulimits`) | Raise Docker Desktop's global limit, or `docker compose up --force-recreate` |
| Ingestion runs but `dbt run` doesn't see the new tables | `raw_energy` wasn't created because `make ingest` never reached `ensure_schema()` | Check the `make ingest` log; `ensure_schema()` always runs at the start of every ingestion |

## See also

- [`clickhouse.en.md`](clickhouse.en.md) — what's inside this container.
- [`actualizacion-datos.en.md`](actualizacion-datos.en.md) — how `make up` fits into the full release cycle.
- [`architecture.md`](architecture.md) §5 *(Spanish)* — target design with ingestion/dbt/exporter also containerized.
