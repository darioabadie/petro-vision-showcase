variable "location" {
  description = "Azure region to deploy into."
  type        = string
  default     = "eastus2"
}

variable "resource_group_name" {
  description = "Name of the dedicated resource group for the cluster."
  type        = string
  default     = "rg-pvm-ch-cluster"
}

variable "shard_count" {
  description = "Number of ClickHouse shards. Total nodes = shard_count * replicas_per_shard."
  type        = number
  default     = 2
}

variable "replicas_per_shard" {
  description = "Number of replicas per shard."
  type        = number
  default     = 2
}

variable "vm_size" {
  description = "VM size for ClickHouse data nodes."
  type        = string
  default     = "Standard_D2s_v3"
}

variable "keeper_vm_size" {
  description = "VM size for the Keeper node."
  type        = string
  default     = "Standard_D2s_v3"
}

variable "clickhouse_image" {
  description = "ClickHouse server image tag, kept in sync with the main pipeline's docker-compose.yml."
  type        = string
  default     = "clickhouse/clickhouse-server:24.8"
}

variable "clickhouse_keeper_image" {
  description = "ClickHouse Keeper image tag."
  type        = string
  default     = "clickhouse/clickhouse-keeper:24.8"
}

variable "admin_username" {
  description = "Linux admin username for all VMs."
  type        = string
  default     = "pvmadmin"
}

variable "admin_ssh_public_key_path" {
  description = "Path to the SSH public key used to log into the VMs."
  type        = string
  default     = "~/.ssh/id_ed25519_azure.pub"
}

variable "vnet_address_space" {
  description = "Address space for the cluster VNet."
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_address_prefix" {
  description = "Address prefix for the cluster subnet."
  type        = string
  default     = "10.0.1.0/24"
}

variable "keeper_private_ip" {
  description = "Static private IP for the Keeper node."
  type        = string
  default     = "10.0.1.10"
}

variable "node_ip_base" {
  description = "Base for node private IPs; node N gets node_ip_base + N (1-indexed)."
  type        = number
  default     = 10
}

variable "clickhouse_native_port" {
  type    = number
  default = 9000
}

variable "clickhouse_http_port" {
  type    = number
  default = 8123
}

variable "clickhouse_interserver_port" {
  type    = number
  default = 9009
}

variable "keeper_client_port" {
  type    = number
  default = 9181
}

variable "keeper_raft_port" {
  type    = number
  default = 9234
}
