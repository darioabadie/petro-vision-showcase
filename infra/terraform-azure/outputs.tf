output "keeper_public_ip" {
  value = azurerm_public_ip.keeper.ip_address
}

output "node_public_ips" {
  value = { for key, node in local.ch_nodes : key => azurerm_public_ip.ch_node[key].ip_address }
}

output "node_private_ips" {
  value = { for key, node in local.ch_nodes : key => node.private_ip }
}

output "resource_group" {
  value = azurerm_resource_group.cluster.name
}

output "operator_ip_allowed" {
  description = "The public IP the NSG rules were opened for at apply time."
  value       = chomp(data.http.my_ip.response_body)
}

output "connect_example" {
  description = "Example clickhouse-client command against node ch-s1-r1."
  value       = "clickhouse-client --host ${azurerm_public_ip.ch_node["ch-s1-r1"].ip_address} --port ${var.clickhouse_native_port}"
}
