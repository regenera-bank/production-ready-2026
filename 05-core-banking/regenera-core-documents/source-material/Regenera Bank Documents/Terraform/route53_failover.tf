# [FILE] /Users/admin/Desktop/Regenera Bank Documents/Terraform/route53_failover.tf
# Terraform Configuration for Automated DNS Failover with AWS Route 53
# Desenvolvedor: Don Paulo Ricardo

# --- Hosted Zone (Assumindo que já existe ou será criado em outro lugar) ---
# Este exemplo irá referenciar uma Hosted Zone existente.
data "aws_route53_zone" "selected" {
  name         = var.public_hosted_zone_name # Ex: "regenerabank.com"
  private_zone = false # Deve ser uma zona pública
}

# --- Registro DNS Primário ---
# Este registro aponta para o API Gateway na região principal (us-east-1).
# O failover será acionado se o health check associado falhar.
resource "aws_route53_record" "api_gateway_primary_failover" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = var.public_api_dns_name # Nome DNS público, ex: "api.regenerabank.com"
  type    = "A" # Ou "AAAA" para IPv6, ou "CNAME" dependendo do alvo

  # Configuração para alias de Load Balancer (ALB, NLB) ou API Gateway custom domain
  # Substitua 'alias_target_name' e 'alias_target_zone_id' pelos valores reais
  # do seu API Gateway primário (ex: do módulo 'api_gateway.tf' em us-east-1).
  alias {
    name                   = var.api_gateway_primary_endpoint_dns_name # Ex: d-xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
    zone_id                = var.api_gateway_primary_endpoint_zone_id  # Ex: Z2O1*****0D8 (zone ID do API Gateway)
    evaluate_target_health = true # Crucial: usar o health check para determinar a saúde do target
  }

  set_identifier = "primary-api-gateway" # Identificador único para este registro no Route 53
  failover_routing_policy {
    type = "PRIMARY" # Define este registro como o primário na política de failover
  }
  health_check_id = var.health_check_api_gateway_primary_id # Referencia o health check criado em route53_health_checks.tf

  # TTL para o registro DNS (quanto menor, mais rápido o failover se propaga)
  ttl = 60 # Ajustar conforme a necessidade de propagação rápida
}

# --- Registro DNS Secundário (Failover) ---
# Este registro aponta para o API Gateway na região de standby (us-east-2).
# Será ativado automaticamente pelo Route 53 se o registro primário falhar.
resource "aws_route53_record" "api_gateway_standby_failover" {
  zone_id = data.aws_route53_zone.selected.zone_id
  name    = var.public_api_dns_name
  type    = "A"

  # Configuração para alias de Load Balancer (ALB, NLB) ou API Gateway custom domain
  # Substitua 'alias_target_name' e 'alias_target_zone_id' pelos valores reais
  # do seu API Gateway de standby (ex: do módulo 'api_gateway.tf' em us-east-2).
  alias {
    name                   = var.api_gateway_standby_endpoint_dns_name # Ex: d-yyyyyyyyyy.execute-api.us-east-2.amazonaws.com
    zone_id                = var.api_gateway_standby_endpoint_zone_id  # Ex: Z2O1*****0D8 (zone ID do API Gateway)
    evaluate_target_health = true # Crucial: usar o health check para determinar a saúde do target
  }

  set_identifier = "standby-api-gateway" # Identificador único para este registro
  failover_routing_policy {
    type = "SECONDARY" # Define este registro como o secundário na política de failover
  }
  health_check_id = var.health_check_api_gateway_standby_id # Referencia o health check criado em route53_health_checks.tf

  ttl = 60 # Manter consistência com o registro primário
}

# --- Variáveis para Failover ---
variable "public_hosted_zone_name" {
  description = "Nome da Hosted Zone pública no Route 53 (ex: 'regenerabank.com')."
  type        = string
}

variable "public_api_dns_name" {
  description = "Nome DNS público para o API Gateway (ex: 'api.regenerabank.com')."
  type        = string
}

variable "api_gateway_primary_endpoint_dns_name" {
  description = "DNS Name do endpoint do API Gateway primário."
  type        = string
}

variable "api_gateway_primary_endpoint_zone_id" {
  description = "Hosted Zone ID do endpoint do API Gateway primário."
  type        = string
}

variable "api_gateway_standby_endpoint_dns_name" {
  description = "DNS Name do endpoint do API Gateway de standby."
  type        = string
}

variable "api_gateway_standby_endpoint_zone_id" {
  description = "Hosted Zone ID do endpoint do API Gateway de standby."
  type        = string
}

variable "health_check_api_gateway_primary_id" {
  description = "ID do Route 53 Health Check para o API Gateway primário."
  type        = string
}

variable "health_check_api_gateway_standby_id" {
  description = "ID do Route 53 Health Check para o API Gateway de standby."
  type        = string
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}
