variable "project_name" {
  description = "Prefixo de recursos Regenera Bank"
  type        = string
  default     = "regenera-bank"
}

variable "environment" {
  description = "Ambiente (development | homologation | production)"
  type        = string
  default     = "homologation"
}

variable "aws_region" {
  description = "Região AWS primária"
  type        = string
  default     = "sa-east-1"
}

variable "vpc_cidr" {
  description = "CIDR da VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "AZs para subnets privadas/públicas"
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1b", "sa-east-1c"]
}

variable "db_instance_class" {
  description = "Classe RDS PostgreSQL"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage_gb" {
  description = "Storage inicial RDS (GB)"
  type        = number
  default     = 100
}

variable "redis_node_type" {
  description = "Classe ElastiCache Redis"
  type        = string
  default     = "cache.t4g.small"
}

# Referências a secrets — sem credenciais reais no repositório
variable "database_secret_arn" {
  description = "ARN do secret no AWS Secrets Manager (username/password/url)"
  type        = string
  default     = "arn:aws:secretsmanager:sa-east-1:000000000000:secret:regenera/db/credentials"
}

variable "redis_auth_secret_arn" {
  description = "ARN do secret Redis AUTH token"
  type        = string
  default     = "arn:aws:secretsmanager:sa-east-1:000000000000:secret:regenera/redis/auth"
}

variable "jwt_session_secret_arn" {
  description = "ARN do secret JWT_SESSION_SECRET"
  type        = string
  default     = "arn:aws:secretsmanager:sa-east-1:000000000000:secret:regenera/jwt/session"
}

variable "partner_api_keys_secret_arn" {
  description = "ARN do secret de API keys de parceiros"
  type        = string
  default     = "arn:aws:secretsmanager:sa-east-1:000000000000:secret:regenera/partner/api-keys"
}