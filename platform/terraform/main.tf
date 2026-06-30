# Frente 16 — skeleton Terraform (VPC + RDS + ElastiCache + Secrets Manager refs)
# Não contém credenciais reais. Aplicar apenas após revisão de segurança.

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Frente      = "16-platform-engineering"
    }
  }
}

data "aws_secretsmanager_secret" "database" {
  arn = var.database_secret_arn
}

data "aws_secretsmanager_secret" "redis_auth" {
  arn = var.redis_auth_secret_arn
}

data "aws_secretsmanager_secret" "jwt_session" {
  arn = var.jwt_session_secret_arn
}

data "aws_secretsmanager_secret" "partner_api_keys" {
  arn = var.partner_api_keys_secret_arn
}