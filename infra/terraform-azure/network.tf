resource "azurerm_resource_group" "cluster" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_virtual_network" "cluster" {
  name                = "vnet-pvm-ch-cluster"
  address_space       = [var.vnet_address_space]
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name
}

resource "azurerm_subnet" "cluster" {
  name                 = "snet-pvm-ch-cluster"
  resource_group_name  = azurerm_resource_group.cluster.name
  virtual_network_name = azurerm_virtual_network.cluster.name
  address_prefixes     = [var.subnet_address_prefix]
}

resource "azurerm_network_security_group" "cluster" {
  name                = "nsg-pvm-ch-cluster"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name

  # SSH from the operator's current public IP only.
  security_rule {
    name                       = "AllowSSHFromOperator"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "${chomp(data.http.my_ip.response_body)}/32"
    destination_address_prefix = "*"
  }

  # ClickHouse HTTP/native from the operator's IP too, so local scripts
  # (export/load/test) can talk to the cluster directly without a bastion.
  security_rule {
    name                       = "AllowClickHouseFromOperator"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = [tostring(var.clickhouse_http_port), tostring(var.clickhouse_native_port)]
    source_address_prefix      = "${chomp(data.http.my_ip.response_body)}/32"
    destination_address_prefix = "*"
  }

  # Inter-node traffic (replication, interserver, Keeper raft/client) stays
  # internal to the VNet — never exposed to the internet.
  security_rule {
    name              = "AllowClusterInternal"
    priority          = 120
    direction         = "Inbound"
    access            = "Allow"
    protocol          = "Tcp"
    source_port_range = "*"
    destination_port_ranges = [
      tostring(var.clickhouse_http_port),
      tostring(var.clickhouse_native_port),
      tostring(var.clickhouse_interserver_port),
      tostring(var.keeper_client_port),
      tostring(var.keeper_raft_port),
    ]
    source_address_prefix      = var.vnet_address_space
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllOtherInbound"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "cluster" {
  subnet_id                 = azurerm_subnet.cluster.id
  network_security_group_id = azurerm_network_security_group.cluster.id
}
