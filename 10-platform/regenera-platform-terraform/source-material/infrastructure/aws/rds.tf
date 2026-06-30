# [FILE] infrastructure/aws/rds.tf
# AWS RDS PostgreSQL Multi-AZ Configuration

resource "aws_db_instance" "postgres_db_multi_az" {
  allocated_storage    = 20
  storage_type         = "gp2" # General Purpose SSD
  engine               = "postgres"
  engine_version       = "15.2"
  instance_class       = "db.t3.micro" # Choose appropriate instance type
  identifier           = "${var.project_name}-postgres-db"
  username             = var.database_username
  password             = var.database_password
  db_subnet_group_name = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db_sg.id] # Allow traffic from app SG
  multi_az             = true # High availability
  skip_final_snapshot  = true # Set to false for production
  publicly_accessible  = false # Should not be publicly accessible in production

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnets_ids # DB should be in private subnets

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Add outputs for RDS instance
output "rds_endpoint" {
  description = "The endpoint of the RDS PostgreSQL instance."
  value       = aws_db_instance.postgres_db_multi_az.address
}

output "rds_port" {
  description = "The port of the RDS PostgreSQL instance."
  value       = aws_db_instance.postgres_db_multi_az.port
}