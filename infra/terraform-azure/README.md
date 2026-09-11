# Cluster ClickHouse en Azure — replicación y sharding vía Terraform

*[English version](README.en.md)*

**Alcance:** módulo de infraestructura aislado que explora operación de ClickHouse en alta disponibilidad. Provisiona con Terraform, sobre Azure real, un cluster de ClickHouse de 2 shards × 2 réplicas coordinado por ClickHouse Keeper, cargado con los datos reales del pipeline principal (`analytics.fact_well_monthly_production`), para poder ejercitar sharding, replicación y failover más allá del ClickHouse single-node que usa el pipeline día a día. **No modifica ni depende de** `docker-compose.yml`, `dbt/`, `pipeline/` o el `Makefile` raíz — vive completamente aislado en `infra/`.

⚠️ **Esto crea recursos de Azure reales con costo real** (VMs, IPs públicas, red) hasta que se corra `terraform destroy`. Ver [Costo](#costo) abajo.

## Topología

```
                         ┌─────────────┐
                         │   Keeper    │  10.0.1.10
                         │ (coordina)  │
                         └──────┬──────┘
                    ┌───────────┴───────────┐
              ┌─────▼─────┐           ┌─────▼─────┐
   Shard 1    │ ch-s1-r1  │◄─────────►│ ch-s1-r2  │   (réplicas entre sí)
              │10.0.1.11  │  replica  │10.0.1.12  │
              └───────────┘           └───────────┘
              ┌───────────┐           ┌───────────┐
   Shard 2    │ ch-s2-r1  │◄─────────►│ ch-s2-r2  │
              │10.0.1.13  │  replica  │10.0.1.14  │
              └───────────┘           └───────────┘

   well_production_distributed (Distributed, sharded por cityHash64(well_id))
   apunta a well_production_local en los 4 nodos.
```

Cada nodo tiene sus `macros` (`{shard}`, `{replica}`) generadas por Terraform vía `templatefile()` — no hay 4 configs escritas a mano, hay una sola definición parametrizada (`local.ch_nodes` en `locals.tf`) de la que salen los 4 recursos con `for_each`.

## Por qué así

- **Keeper, no Zookeeper de Java**: es el estándar actual de ClickHouse, más liviano, y el mecanismo de coordinación que usaría cualquier cluster nuevo hoy.
- **`ReplicatedReplacingMergeTree` + `Distributed`**: mismo patrón que usaría un cluster de 100PB en producción, a escala de laptop/VMs chicas.
- **Mismo esquema que el pipeline real**: `well_production_local` replica columna por columna, `ORDER BY` y `ver_column` (`_record_version`) de `analytics.fact_well_monthly_production` (`dbt/models/core/fact_well_monthly_production.sql`) — no es un dataset de juguete inventado para el módulo.

## Requisitos

- Azure CLI logueado (`az account show`) con una suscripción activa.
- Terraform `1.16.1` (`brew tap hashicorp/tap && brew install hashicorp/tap/terraform`).
- `jq`, `docker`, `ssh` en el equipo local.
- Una key SSH en `~/.ssh/id_ed25519_azure{,.pub}` (o ajustar `admin_ssh_public_key_path` / `SSH_KEY`).
- El pipeline principal arriba y con datos (`make up && make dbt` en la raíz del repo) — de ahí sale la data real que se carga en el cluster.

## Comandos

```bash
cd infra/terraform-azure

export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)

terraform init
terraform plan      # revisar antes de aplicar — son recursos reales
terraform apply

# Esquema (una sola vez, se propaga a los 4 nodos vía ON CLUSTER):
NODE1_IP=$(terraform output -json node_public_ips | jq -r '."ch-s1-r1"')
docker run --rm -i clickhouse/clickhouse-server:24.8 clickhouse-client \
  --host "$NODE1_IP" --port 9000 --multiquery < sql/01_create_replicated_tables.sql
docker run --rm -i clickhouse/clickhouse-server:24.8 clickhouse-client \
  --host "$NODE1_IP" --port 9000 --multiquery < sql/02_create_distributed_tables.sql

# Datos reales del pipeline principal:
./scripts/export-seed-data.sh
./scripts/load-seed-data.sh

# Pruebas de replicación de verdad (no solo "está arriba"):
./scripts/test-replication.sh

# Terminada la sesión de trabajo:
terraform destroy
```

`scripts/test-replication.sh` corre y verifica, en orden:
1. Insertar en `well_production_local` de `ch-s1-r1` → confirmar que aparece en `ch-s1-r2` (replicación real).
2. Parar el nodo `ch-s1-r2` (`systemctl stop pvm-clickhouse` vía SSH) → confirmar que `well_production_distributed` sigue devolviendo el conteo completo desde la réplica viva.
3. Reiniciar `ch-s1-r2` → confirmar que resincroniza solo (`system.replicas.is_readonly = 0`, conteos vuelven a coincidir).
4. Comparar `sum(oil_m3)` entre el cluster (`well_production_distributed`) y el ClickHouse single-node del pipeline principal (`analytics.fact_well_monthly_production`) — tienen que coincidir exactamente. Esto prueba que el sharding no perdió ni duplicó filas.

Sale con código de error si cualquiera de las 4 pruebas falla.

## Cómo escalar

Cambiar `shard_count` o `replicas_per_shard` en `variables.tf` (o pasar `-var`) y correr `terraform apply` de nuevo:

```bash
terraform apply -var="shard_count=3"
```

`locals.tf` regenera el mapa `ch_nodes` a partir de esas dos variables; `nodes.tf` tiene un solo `resource ... for_each = local.ch_nodes` — Terraform crea las VMs nuevas con su config renderizada automáticamente, sin tocar ningún otro archivo. Es el mismo mecanismo que se usaría para provisionar sobre AWS/GCP en vez de Azure: solo cambia el provider.

## Costo

Con los defaults (2×2 + 1 Keeper): 4× `Standard_B2s` + 1× `Standard_B1s` ≈ USD 0.18/hora de cómputo, más 5 IPs públicas Standard SKU (la suscripción no admite Basic SKU — Azure las está retirando; Standard cuesta centavos/hora más). Correr `terraform destroy` entre sesiones de trabajo mantiene el costo total en unos pocos dólares.

## Qué falta para ser production-real

Se nombra a propósito, no se implementa (fuera de alcance para un cluster de laptop/VMs chicas):

- **TLS** entre nodos y en los puertos de cliente (acá todo es plano, HTTP/TCP sin cifrar).
- **Keeper de 1 solo nodo** — sin tolerancia a fallos del propio Keeper; producción real usa 3 (o 5) para quorum Raft.
- **State remoto** — acá `terraform.tfstate` es local; producción usaría un backend remoto (Azure Storage Account + blob lease en vez del S3+DynamoDB de AWS) para lock y colaboración en equipo.
- **Monitoring/alerting** (Prometheus exporter de ClickHouse, backups de `system.backups`).
- **NSG abierta a la IP del operador** para SSH/ClickHouse — funcional para un solo operador, no para un equipo.

## Seguridad

Las reglas de NSG restringen SSH y los puertos de ClickHouse a la IP pública de quien corre `terraform apply` (resuelta en el momento vía `data "http" "my_ip"`, no hardcodeada) y el tráfico inter-nodo al rango de la VNet. Aun así, son VMs con IP pública en un cloud real — no dejarlas arriba más tiempo del necesario.
