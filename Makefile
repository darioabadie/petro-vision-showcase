SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help up down ps ingest dbt export release test lint sample qa ls-release

help: ## Muestra los targets disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-14s %s\n", $$1, $$2}'

up: ## Levanta ClickHouse
	docker compose up -d --wait
	@echo "ClickHouse en 127.0.0.1:9000 (creds dev: default/pvm_dev)"

down: ## Detiene ClickHouse (mantiene el volumen)
	docker compose down

ps: ## Estado de los servicios
	docker compose ps

ingest: ## Descarga y carga fuentes a raw
	cd pipeline && uv run python -m pvm.pipelines ingest

ingest-s01: ## Solo S01 (producción por pozo)
	cd pipeline && uv run python -m pvm.pipelines ingest --only s01

DBT_ENV := CLICKHOUSE_URL=http://127.0.0.1:8123 CLICKHOUSE_USER=default CLICKHOUSE_PASSWORD=pvm_dev

dbt: ## Ejecuta dbt (staging → core → marts)
	cd pipeline && uv run dbt run --project-dir ../dbt --profiles-dir ../dbt $(ARGS)

dbt-test: ## Ejecuta los tests de dbt
	cd pipeline && uv run dbt test --project-dir ../dbt --profiles-dir ../dbt $(ARGS)

export: ## Genera el release (app-data.json + artefactos) en public/data/releases/<id>
	cd pipeline && uv run python -m pvm.pipelines export

release: ## Corrida mensual completa: up? (asume ClickHouse arriba) + ingest + dbt + dbt-test + export
	$(MAKE) ingest
	$(MAKE) dbt ARGS="--models stg_ core. marts."
	$(MAKE) dbt-test ARGS="--models stg_ core. marts."
	$(MAKE) export

test: ## Tests de unittest del pipeline
	cd pipeline && uv run pytest -q

sample: ## Genera muestras reproducibles de las fuentes descargadas
	cd pipeline && uv run python -m pvm.pipelines sample

preview-dev: ## Servidor de desarrollo de la app
	bun dev