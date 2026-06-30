# [FILE] infrastructure/aws/security.tf
# AWS Security Group Configurations

# Security Group for the ALB
resource "aws_security_group" "alb_sg" {
  name_prefix = "${var.project_name}-alb-sg-"
  description = "Allows HTTP/HTTPS traffic to the ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # All protocols
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Security Group for the Application Instances (where microservices run)
# This SG will be associated with the EC2 instances/ECS tasks.
# It allows traffic only from the ALB.
resource "aws_security_group" "app_sg" {
  name_prefix = "${var.project_name}-app-sg-"
  description = "Allows traffic from ALB to application instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3000 # Assuming API Gateway internal port
    to_port     = 3012 # Range of all microservice ports, up to transaction-service (3012)
    protocol    = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # Only from ALB
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Security Group for Database (PostgreSQL)
resource "aws_security_group" "db_sg" {
  name_prefix = "${var.project_name}-db-sg-"
  description = "Allows traffic from application instances to PostgreSQL DB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432 # PostgreSQL default port
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id] # Only from application instances
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Security Group for RabbitMQ, Redis, MongoDB, ElasticSearch
resource "aws_security_group" "messaging_cache_nosql_sg" {
  name_prefix = "${var.project_name}-messaging-cache-nosql-sg-"
  description = "Allows traffic from application instances to RabbitMQ, Redis, MongoDB, ElasticSearch"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5672 # RabbitMQ AMQP port
    to_port     = 5672
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  ingress {
    from_port   = 6379 # Redis default port
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  ingress {
    from_port   = 27017 # MongoDB default port
    to_port     = 27017
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  ingress {
    from_port   = 9200 # ElasticSearch HTTP port
    to_port     = 9200
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  # For gRPC communication from auth-service to user-service
  ingress {
    from_port   = 50051 # gRPC port
    to_port     = 50051
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Add outputs for new security group IDs
output "db_security_group_id" {
  description = "The ID of the Security Group for the PostgreSQL DB."
  value       = aws_security_group.db_sg.id
}

output "messaging_cache_nosql_security_group_id" {
  description = "The ID of the Security Group for Messaging, Cache, and NoSQL DBs."
  value       = aws_security_group.messaging_cache_nosql_sg.id
}