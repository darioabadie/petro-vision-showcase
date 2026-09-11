# Every ClickHouse data node comes from this single for_each over
# local.ch_nodes — changing var.shard_count / var.replicas_per_shard
# regenerates the map in locals.tf and Terraform adds/removes nodes here
# with no other file needing an edit.

resource "azurerm_public_ip" "ch_node" {
  for_each = local.ch_nodes

  name                = "pip-${each.key}"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "ch_node" {
  for_each = local.ch_nodes

  name                = "nic-${each.key}"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.cluster.id
    private_ip_address_allocation = "Static"
    private_ip_address            = each.value.private_ip
    public_ip_address_id          = azurerm_public_ip.ch_node[each.key].id
  }
}

resource "azurerm_linux_virtual_machine" "ch_node" {
  for_each = local.ch_nodes

  name                = "vm-${each.key}"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [azurerm_network_interface.ch_node[each.key].id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(pathexpand(var.admin_ssh_public_key_path))
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/templates/cloud-init-clickhouse.yaml.tpl", {
    shard              = each.value.shard
    replica            = each.value.replica
    private_ip         = each.value.private_ip
    keeper_ip          = var.keeper_private_ip
    keeper_client_port = var.keeper_client_port
    cluster_shards     = local.cluster_shards
    clickhouse_image   = var.clickhouse_image
  }))

  depends_on = [azurerm_linux_virtual_machine.keeper]
}
