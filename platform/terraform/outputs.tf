output "vpc_id" {
  description = "ID da VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Subnets privadas para workloads"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Subnets dedicadas RDS"
  value       = aws_subnet.database[*].id
}

output "rds_endpoint" {
  description = "Endpoint RDS PostgreSQL"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "Porta RDS"
  value       = aws_db_instance.postgres.port
}

output "redis_primary_endpoint" {
  description = "Endpoint primário ElastiCache"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "secret_arns" {
  description = "ARNs de secrets referenciados pelos serviços"
  value = {
    database         = data.aws_secretsmanager_secret.database.arn
    redis_auth       = data.aws_secretsmanager_secret.redis_auth.arn
    jwt_session      = data.aws_secretsmanager_secret.jwt_session.arn
    partner_api_keys = data.aws_secretsmanager_secret.partner_api_keys.arn
  }
}

output "app_security_group_id" {
  description = "SG para pods/containers da aplicação"
  value       = aws_security_group.app.id
}