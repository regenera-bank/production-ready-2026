# Referências a secrets — valores reais vivem apenas no AWS Secrets Manager.
# Aplicações (EKS/ECS) montam via CSI driver ou injeção de env a partir destes ARNs.

locals {
  secret_refs = {
    database_url = {
      arn         = data.aws_secretsmanager_secret.database.arn
      description = "DATABASE_URL — Postgres connection string"
      keys        = ["username", "password", "host", "port", "dbname", "url"]
    }
    redis_auth = {
      arn         = data.aws_secretsmanager_secret.redis_auth.arn
      description = "REDIS_URL / AUTH token"
      keys        = ["auth_token", "url"]
    }
    jwt_session = {
      arn         = data.aws_secretsmanager_secret.jwt_session.arn
      description = "JWT_SESSION_SECRET — sessão web-bff"
      keys        = ["secret"]
    }
    partner_api_keys = {
      arn         = data.aws_secretsmanager_secret.partner_api_keys.arn
      description = "Partner API keys + webhook verify tokens"
      keys        = ["api_key", "webhook_verify_token"]
    }
  }
}

# Placeholder para secrets criados fora do Terraform (recomendado em produção)
resource "aws_secretsmanager_secret" "database_placeholder" {
  name                    = "${var.project_name}/${var.environment}/db/credentials"
  description             = "Placeholder — popular manualmente ou via pipeline"
  recovery_window_in_days = 7

  tags = {
    Purpose = "database-credentials"
    Rotate  = "quarterly"
  }
}

resource "aws_secretsmanager_secret" "redis_auth_placeholder" {
  name                    = "${var.project_name}/${var.environment}/redis/auth"
  description             = "Placeholder — AUTH token ElastiCache"
  recovery_window_in_days = 7

  tags = {
    Purpose = "redis-auth"
    Rotate  = "quarterly"
  }
}

resource "aws_secretsmanager_secret" "jwt_session_placeholder" {
  name                    = "${var.project_name}/${var.environment}/jwt/session"
  description             = "Placeholder — JWT_SESSION_SECRET"
  recovery_window_in_days = 7

  tags = {
    Purpose = "jwt-session"
    Rotate  = "on-compromise"
  }
}

resource "aws_secretsmanager_secret" "partner_api_keys_placeholder" {
  name                    = "${var.project_name}/${var.environment}/partner/api-keys"
  description             = "Placeholder — partner credentials"
  recovery_window_in_days = 7

  tags = {
    Purpose = "partner-api"
    Rotate  = "on-compromise"
  }
}