# [FILE] infrastructure/aws/documentdb.tf
# AWS DocumentDB (MongoDB Compatible) Cluster Configuration for Analytics/NoSQL

resource "aws_security_group" "documentdb_sg" {
  name_prefix = "${var.project_name}-documentdb-sg-"
  description = "Allows traffic from application instances to DocumentDB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 27017 # Default MongoDB port
    to_port     = 27017
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

resource "aws_docdb_subnet_group" "default" {
  name       = "${var.project_name}-docdb-subnet-group"
  subnet_ids = var.private_subnets_ids # DocumentDB should be in private subnets

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_docdb_cluster" "regenera_documentdb_cluster" {
  cluster_identifier      = "${var.project_name}-documentdb-cluster"
  engine                  = "docdb"
  master_username         = var.database_username
  master_password         = var.database_password
  db_subnet_group_name    = aws_docdb_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.documentdb_sg.id]
  skip_final_snapshot     = true # Set to false for production
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.default.name

  # For production, enable backup retention, deletion protection etc.
  # This example defines a sharded-ready cluster but doesn't explicitly configure sharding
  # within the cluster itself. Sharding is configured at the MongoDB layer or via specific API calls.
  # num_elastic_nodes = 2 # For elastic clusters, sharding is handled differently

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = 2 # Multi-AZ for high availability
  identifier         = "${var.project_name}-docdb-instance-${count.index}"
  cluster_identifier = aws_docdb_cluster.regenera_documentdb_cluster.id
  instance_class     = "db.t3.medium" # Choose appropriate instance type
  engine             = "docdb"
}

resource "aws_docdb_cluster_parameter_group" "default" {
  family      = "docdb4.0" # Based on engine version
  name        = "${var.project_name}-docdb-param-group"
  description = "Regenera Bank DocumentDB Cluster Parameter Group"
}

# Add outputs for DocumentDB
output "documentdb_cluster_endpoint" {
  description = "The endpoint of the DocumentDB cluster."
  value       = aws_docdb_cluster.regenera_documentdb_cluster.endpoint
}

output "documentdb_cluster_port" {
  description = "The port of the DocumentDB cluster."
  value       = aws_docdb_cluster.regenera_documentdb_cluster.port
}