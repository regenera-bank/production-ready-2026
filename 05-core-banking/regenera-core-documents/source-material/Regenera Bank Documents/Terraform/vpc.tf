# [FILE] /Users/admin/Desktop/pipiline/Infraestrutura como Código/terraform/vpc.tf
# Terraform Configuration for VPC and Networking
# Desenvolvedor: Don Paulo Ricardo

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnets_cidr_blocks)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets_cidr_blocks[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true # Para que os recursos nesta subnet recebam um IP público

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index}"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnets_cidr_blocks)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets_cidr_blocks[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index}"
    # Tag necessária para o EKS auto-descobrir as subnets
    "kubernetes.io/cluster/${var.eks_cluster_name}" = "owned"
    "kubernetes.io/role/internal-elb"               = "1"
  })
}

# NAT Gateway para saída da internet de subnets privadas
resource "aws_eip" "nat" {
  count = var.single_nat_gateway ? 1 : length(data.aws_availability_zones.available.names)
  vpc   = true
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-eip-nat-${count.index}"
  })
}

resource "aws_nat_gateway" "main" {
  count         = var.single_nat_gateway ? 1 : length(data.aws_availability_zones.available.names)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id # NAT Gateway em subnet pública

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-nat-gateway-${count.index}"
  })
  # Depende do Internet Gateway estar disponível
  depends_on = [aws_internet_gateway.main]
}

# Route Tables para subnets públicas
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables para subnets privadas
resource "aws_route_table" "private" {
  count  = length(var.private_subnets_cidr_blocks)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id # Tráfego de saída via NAT Gateway
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-private-rt-${count.index}"
  })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Data source para obter as zonas de disponibilidade da região
data "aws_availability_zones" "available" {
  state = "available"
}

# Variáveis para este módulo VPC
variable "project_name" {
  description = "Nome do projeto para prefixar recursos."
  type        = string
}

variable "vpc_cidr_block" {
  description = "CIDR block para a VPC."
  type        = string
}

variable "public_subnets_cidr_blocks" {
  description = "Lista de CIDR blocks para as subnets públicas."
  type        = list(string)
}

variable "private_subnets_cidr_blocks" {
  description = "Lista de CIDR blocks para as subnets privadas."
  type        = list(string)
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}

variable "single_nat_gateway" {
  description = "Cria um único NAT Gateway para todas as AZs se verdadeiro."
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "Região da AWS onde os recursos serão provisionados."
  type        = string
}

variable "eks_cluster_name" {
  description = "Nome do cluster EKS para tagging automático das subnets."
  type        = string
}

# Outputs deste módulo VPC
output "vpc_id" {
  description = "O ID da VPC criada."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Os IDs das subnets públicas."
  value       = aws_subnet.public.*.id
}

output "private_subnet_ids" {
  description = "Os IDs das subnets privadas."
  value       = aws_subnet.private.*.id
}
