# [FILE] /Users/admin/Desktop/Regenera Bank Documents/Terraform/route53_health_checks.tf
# Terraform Configuration for AWS Route 53 Health Checks
# Desenvolvedor: Don Paulo Ricardo

# --- Health Check para o API Gateway Primário ---
# Monitora a saúde do endpoint principal do API Gateway.
resource "aws_route53_health_check" "api_gateway_primary" {
  fqdn                = var.api_gateway_primary_hostname # Hostname do API Gateway Primário
  port                = var.api_gateway_health_check_port
  type                = "HTTPS" # Tipo de verificação, HTTPS para APIs públicas
  resource_path       = var.api_gateway_health_check_path # Endpoint de saúde, ex: /health ou /
  request_interval    = 30 # Intervalo de 30 segundos entre as verificações
  failure_threshold   = 3  # 3 falhas consecutivas para marcar como unhealthy
  measure_latency     = true # Medir latência para métricas

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-gateway-primary-hc"
    Service = "API Gateway"
    Environment = "Primary"
  })
}

# --- Health Check para o API Gateway Standby (Região DR) ---
# Monitora a saúde do endpoint do API Gateway na região de Disaster Recovery.
# Essencial para estratégias de failover DNS.
resource "aws_route53_health_check" "api_gateway_standby" {
  count               = var.create_standby_health_check ? 1 : 0
  fqdn                = var.api_gateway_standby_hostname # Hostname do API Gateway Standby
  port                = var.api_gateway_health_check_port
  type                = "HTTPS"
  resource_path       = var.api_gateway_health_check_path
  request_interval    = 30
  failure_threshold   = 3
  measure_latency     = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-api-gateway-standby-hc"
    Service = "API Gateway"
    Environment = "Standby"
  })
}

# --- Exemplo de Integração com Registro DNS (Política de Failover) ---
# Este exemplo demonstra como usar os Health Checks com um registro DNS
# para implementar um failover primário/standby.
# Na prática, o 'zone_id' e os 'records' viriam de outros recursos/módulos.

# resource "aws_route53_record" "api_gateway_dns" {
#   zone_id = aws_route53_zone.main.zone_id # ID da sua Hosted Zone
#   name    = var.public_api_dns_name # Nome DNS público, ex: api.regenerabank.com
#   type    = "A"

#   # Registro Primário (aponta para o API Gateway na região principal)
#   alias {
#     name                   = aws_api_gateway_domain_name.primary.regional_domain_name # DNS do API Gateway
#     zone_id                = aws_api_gateway_domain_name.primary.regional_zone_id
#     evaluate_target_health = true # Usar o health check para determinar a saúde
#   }
#   set_identifier = "primary"
#   failover_routing_policy {
#     type = "PRIMARY"
#   }
#   health_check_id = aws_route53_health_check.api_gateway_primary.id
# }

# resource "aws_route53_record" "api_gateway_dns_standby" {
#   count   = var.create_standby_health_check ? 1 : 0
#   zone_id = aws_route53_zone.main.zone_id
#   name    = var.public_api_dns_name
#   type    = "A"

#   # Registro de Failover (aponta para o API Gateway na região de standby)
#   alias {
#     name                   = aws_api_gateway_domain_name.standby[0].regional_domain_name
#     zone_id                = aws_api_gateway_domain_name.standby[0].regional_zone_id
#     evaluate_target_health = true
#   }
#   set_identifier = "standby"
#   failover_routing_policy {
#     type = "SECONDARY"
#   }
#   health_check_id = aws_route53_health_check.api_gateway_standby[0].id
# }

# --- Variáveis para Health Checks ---
variable "project_name" {
  description = "Nome do projeto para prefixar recursos."
  type        = string
}

variable "api_gateway_primary_hostname" {
  description = "FQDN ou endereço IP do API Gateway primário."
  type        = string
}

variable "api_gateway_standby_hostname" {
  description = "FQDN ou endereço IP do API Gateway de standby."
  type        = string
  default     = ""
}

variable "api_gateway_health_check_port" {
  description = "Porta para a verificação de saúde do API Gateway."
  type        = number
  default     = 443
}

variable "api_gateway_health_check_path" {
  description = "Caminho (path) para a verificação de saúde do API Gateway."
  type        = string
  default     = "/" # Endpoint padrão, mas '/health' é recomendado
}

variable "create_standby_health_check" {
  description = "Booleano para controlar a criação do Health Check para o standby."
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}

# --- Outputs de Health Checks ---
output "health_check_api_gateway_primary_id" {
  description = "ID do Health Check para o API Gateway primário."
  value       = aws_route53_health_check.api_gateway_primary.id
}

output "health_check_api_gateway_standby_id" {
  description = "ID do Health Check para o API Gateway de standby (se criado)."
  value       = var.create_standby_health_check ? aws_route53_health_check.api_gateway_standby[0].id : ""
}
