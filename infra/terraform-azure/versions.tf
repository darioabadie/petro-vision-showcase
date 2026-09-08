terraform {
  required_version = "= 1.16.1"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "= 4.15.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "= 3.4.5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "= 4.0.6"
    }
  }
}
