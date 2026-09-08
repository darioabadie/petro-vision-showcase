provider "azurerm" {
  features {}
}

# Resolves the public IP of whoever runs `terraform apply`, so the NSG
# SSH/ClickHouse rules always match the current operator instead of a
# hardcoded IP that goes stale.
data "http" "my_ip" {
  url = "https://api.ipify.org?format=text"
}
