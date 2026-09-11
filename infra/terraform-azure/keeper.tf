resource "azurerm_public_ip" "keeper" {
  name                = "pip-pvm-keeper"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "keeper" {
  name                = "nic-pvm-keeper"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.cluster.id
    private_ip_address_allocation = "Static"
    private_ip_address            = var.keeper_private_ip
    public_ip_address_id          = azurerm_public_ip.keeper.id
  }
}

resource "azurerm_linux_virtual_machine" "keeper" {
  name                = "vm-pvm-keeper"
  location            = azurerm_resource_group.cluster.location
  resource_group_name = azurerm_resource_group.cluster.name
  size                = var.keeper_vm_size
  admin_username      = var.admin_username

  network_interface_ids = [azurerm_network_interface.keeper.id]

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

  custom_data = base64encode(templatefile("${path.module}/templates/cloud-init-keeper.yaml.tpl", {
    keeper_ip               = var.keeper_private_ip
    keeper_client_port      = var.keeper_client_port
    keeper_raft_port        = var.keeper_raft_port
    clickhouse_keeper_image = var.clickhouse_keeper_image
  }))
}
