# [FILE] /Users/admin/Desktop/Regenera Bank Documents/Terraform/rds.tf
# Terraform Configuration for AWS RDS PostgreSQL with Multi-AZ and Read Replicas
# Desenvolvedor: Don Paulo Ricardo

# --- DB Subnet Group para RDS ---
# Define em quais subnets o RDS pode ser provisionado.
# Recomenda-se o uso de subnets privadas em diferentes Availability Zones.
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = var.private_subnet_ids # Reusa as subnets privadas da VPC EKS

  tags = var.common_tags
}

# --- Security Group para acesso ao RDS ---
# Permite acesso ao banco de dados apenas de security groups específicos,
# como o security group dos microsserviços.
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow traffic from EKS worker nodes / microservices"
    from_port   = 5432 # Porta padrão do PostgreSQL
    to_port     = 5432
    protocol    = "tcp"
    # Este 'security_groups' deve ser o SG associado aos worker nodes do EKS ou aos pods do microserviço
    # Para simplicidade, vamos permitir de um SG fictício ou do SG do cluster EKS principal
    security_groups = [var.eks_cluster_sg_id] # Permitir do SG do cluster EKS principal
    # Ou de um SG específico dos microsserviços, se definido
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # Permite todo o tráfego de saída da DB
  }

  tags = var.common_tags
}

# --- Instância Primária do RDS (Multi-AZ) ---
resource "aws_db_instance" "primary" {
  allocated_storage     = var.db_allocated_storage
  storage_type          = "gp2"
  engine                = "postgres"
  engine_version        = var.db_engine_version
  instance_class        = var.db_instance_class
  identifier            = "${var.project_name}-db-primary"
  username              = var.db_username
  password              = var.db_password # **MELHOR USAR AWS SECRETS MANAGER**
  db_name               = var.db_name
  port                  = 5432
  multi_az              = true # Habilita Multi-AZ para alta disponibilidade
  db_subnet_group_name  = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot   = false # Em produção, sempre false
  backup_retention_period = var.db_backup_retention_period
  apply_immediately     = false # Evita interrupções em produção, aplica na próxima janela de manutenção

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-db-primary"
    Role = "Primary"
  })
}

# --- Read Replica do RDS ---
resource "aws_db_instance" "replica" {
  count                 = var.create_read_replica ? 1 : 0
  replicate_source_db   = aws_db_instance.primary.identifier
  instance_class        = var.db_replica_instance_class # Pode ser diferente do primário
  identifier            = "${var.project_name}-db-replica"
  db_subnet_group_name  = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot   = true # Geralmente true para réplicas, mas pode ser false
  apply_immediately     = false

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-db-replica"
    Role = "ReadReplica"
  })
}

# --- Variáveis para este módulo RDS ---
variable "project_name" {
  description = "Nome do projeto para prefixar recursos."
  type        = string
}

variable "vpc_id" {
  description = "ID da VPC onde os recursos RDS serão provisionados."
  type        = string
}

variable "private_subnet_ids" {
  description = "Lista de IDs das subnets privadas para o DB Subnet Group."
  type        = list(string)
}

variable "eks_cluster_sg_id" {
  description = "ID do Security Group do cluster EKS para permitir acesso ao RDS."
  type        = string
}

variable "db_allocated_storage" {
  description = "Tamanho do armazenamento alocado para a instância DB (em GB)."
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "Versão do motor do banco de dados (e.g., '14.7')."
  type        = string
  default     = "14.7"
}

variable "db_instance_class" {
  description = "Classe da instância DB para a instância primária (e.g., 'db.t3.medium')."
  type        = string
  default     = "db.t3.medium"
}

variable "db_replica_instance_class" {
  description = "Classe da instância DB para a Read Replica (e.g., 'db.t3.small')."
  type        = string
  default     = "db.t3.small"
}

variable "db_username" {
  description = "Nome de usuário mestre para a instância DB."
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Senha mestre para a instância DB."
  type        = string
  sensitive   = true # Marca como sensível para evitar logs
}

variable "db_name" {
  description = "Nome inicial do banco de dados a ser criado."
  type        = string
  default     = "regenerabank"
}

variable "db_backup_retention_period" {
  description = "Período de retenção de backups em dias."
  type        = number
  default     = 7
}

variable "create_read_replica" {
  description = "Booleano para controlar a criação da Read Replica."
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}

# --- Outputs deste módulo RDS ---
output "rds_primary_endpoint" {
  description = "Endpoint da instância primária do RDS."
  value       = aws_db_instance.primary.address
}

output "rds_replica_endpoint" {
  description = "Endpoint da Read Replica do RDS (se criada)."
  value       = var.create_read_replica ? aws_db_instance.replica[0].address : ""
}

output "rds_security_group_id" {
  description = "ID do Security Group do RDS."
  value       = aws_security_group.rds_sg.id
}
