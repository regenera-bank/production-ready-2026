# [FILE] /Users/admin/Desktop/Regenera Bank Documents/Terraform/standby-us-east-2.tf
# Terraform Configuration for Standby AWS EKS Cluster in us-east-2
# Desenvolvedor: Don Paulo Ricardo

# --- Provedor AWS para a Região de Standby (us-east-2) ---
provider "aws" {
  alias  = "us_east_2"
  region = "us-east-2"
}

# --- Variáveis Específicas para o Cluster Standby ---
variable "standby_project_name" {
  description = "Nome do projeto para o cluster standby."
  type        = string
  default     = "regenera-bank-standby"
}

variable "standby_vpc_cidr_block" {
  description = "CIDR block para a VPC do cluster standby."
  type        = string
  default     = "10.100.0.0/16" # Diferente do primário
}

variable "standby_public_subnets_cidr_blocks" {
  description = "Lista de CIDR blocks para as subnets públicas do standby."
  type        = list(string)
  default     = ["10.100.1.0/24", "10.100.2.0/24"]
}

variable "standby_private_subnets_cidr_blocks" {
  description = "Lista de CIDR blocks para as subnets privadas do standby."
  type        = list(string)
  default     = ["10.100.101.0/24", "10.100.102.0/24"]
}

variable "standby_eks_cluster_name" {
  description = "Nome do cluster EKS standby."
  type        = string
  default     = "regenera-standby-eks-cluster"
}

variable "standby_kubernetes_version" {
  description = "Versão do Kubernetes para o cluster EKS standby."
  type        = string
  default     = "1.28" # Manter consistência com o primário
}

variable "standby_node_instance_types" {
  description = "Lista de tipos de instância para os worker nodes do standby."
  type        = list(string)
  default     = ["t3.medium"] # Manter consistência ou ajustar conforme necessidade
}

variable "standby_node_group_desired_size" {
  description = "Número desejado de worker nodes no node group do standby."
  type        = number
  default     = 1 # Pode ser menor para o standby
}

variable "standby_node_group_max_size" {
  description = "Número máximo de worker nodes no node group do standby."
  type        = number
  default     = 2
}

variable "standby_node_group_min_size" {
  description = "Número mínimo de worker nodes no node group do standby."
  type        = number
  default     = 0
}

# --- VPC para o Cluster Standby (us-east-2) ---
resource "aws_vpc" "standby_main" {
  provider             = aws.us_east_2
  cidr_block           = var.standby_vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-vpc"
  })
}

resource "aws_internet_gateway" "standby_main" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.standby_main.id

  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-igw"
  })
}

# Public Subnets (Standby)
resource "aws_subnet" "standby_public" {
  provider                = aws.us_east_2
  count                   = length(var.standby_public_subnets_cidr_blocks)
  vpc_id                  = aws_vpc.standby_main.id
  cidr_block              = var.standby_public_subnets_cidr_blocks[count.index]
  availability_zone       = data.aws_availability_zones.standby_available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-public-subnet-${count.index}"
  })
}

# Private Subnets (Standby)
resource "aws_subnet" "standby_private" {
  provider          = aws.us_east_2
  count             = length(var.standby_private_subnets_cidr_blocks)
  vpc_id            = aws_vpc.standby_main.id
  cidr_block        = var.standby_private_subnets_cidr_blocks[count.index]
  availability_zone = data.aws_availability_zones.standby_available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-private-subnet-${count.index}"
    "kubernetes.io/cluster/${var.standby_eks_cluster_name}" = "owned"
    "kubernetes.io/role/internal-elb"                        = "1"
  })
}

# Data source para obter as zonas de disponibilidade da região standby
data "aws_availability_zones" "standby_available" {
  provider = aws.us_east_2
  state    = "available"
}

# EIP e NAT Gateway (Standby)
resource "aws_eip" "standby_nat" {
  provider = aws.us_east_2
  count    = var.single_nat_gateway ? 1 : length(data.aws_availability_zones.standby_available.names)
  vpc      = true
  tags     = merge(var.common_tags, {
    Name = "${var.standby_project_name}-eip-nat-${count.index}"
  })
}

resource "aws_nat_gateway" "standby_main" {
  provider      = aws.us_east_2
  count         = var.single_nat_gateway ? 1 : length(data.aws_availability_zones.standby_available.names)
  allocation_id = aws_eip.standby_nat[count.index].id
  subnet_id     = aws_subnet.standby_public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-nat-gateway-${count.index}"
  })
  depends_on = [aws_internet_gateway.standby_main]
}

# Route Tables (Standby)
resource "aws_route_table" "standby_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.standby_main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.standby_main.id
  }
  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-public-rt"
  })
}

resource "aws_route_table_association" "standby_public" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.standby_public)
  subnet_id      = aws_subnet.standby_public[count.index].id
  route_table_id = aws_route_table.standby_public.id
}

resource "aws_route_table" "standby_private" {
  provider = aws.us_east_2
  count    = length(var.standby_private_subnets_cidr_blocks)
  vpc_id   = aws_vpc.standby_main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.standby_main[count.index].id
  }
  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-private-rt-${count.index}"
  })
}

resource "aws_route_table_association" "standby_private" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.standby_private)
  subnet_id      = aws_subnet.standby_private[count.index].id
  route_table_id = aws_route_table.standby_private[count.index].id
}

# --- IAM Roles para o Cluster EKS Standby ---
resource "aws_iam_role" "standby_eks_cluster_role" {
  provider           = aws.us_east_2
  name               = "${var.standby_project_name}-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "eks.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "standby_eks_cluster_policy" {
  provider   = aws.us_east_2
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.standby_eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "standby_eks_vpc_cni_policy" {
  provider   = aws.us_east_2
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.standby_eks_cluster_role.name
}

resource "aws_iam_role" "standby_eks_nodes_role" {
  provider           = aws.us_east_2
  name               = "${var.standby_project_name}-eks-nodes-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "standby_eks_worker_node_policy" {
  provider   = aws.us_east_2
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.standby_eks_nodes_role.name
}

resource "aws_iam_role_policy_attachment" "standby_eks_cni_policy" {
  provider   = aws.us_east_2
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.standby_eks_nodes_role.name
}

resource "aws_iam_role_policy_attachment" "standby_ec2_container_registry_readonly_policy" {
  provider   = aws.us_east_2
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.standby_eks_nodes_role.name
}

# --- Cluster EKS Standby (us-east-2) ---
resource "aws_eks_cluster" "standby_main" {
  provider = aws.us_east_2
  name     = var.standby_eks_cluster_name
  role_arn = aws_iam_role.standby_eks_cluster_role.arn
  version  = var.standby_kubernetes_version

  vpc_config {
    subnet_ids              = aws_subnet.standby_private.*.id
    security_group_ids      = [aws_security_group.standby_eks_cluster_sg.id]
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  tags = merge(var.common_tags, {
    Name = var.standby_eks_cluster_name
  })
  depends_on = [
    aws_iam_role.standby_eks_cluster_role,
    aws_vpc.standby_main,
    aws_subnet.standby_private
  ]
}

resource "aws_eks_node_group" "standby_main" {
  provider        = aws.us_east_2
  cluster_name    = aws_eks_cluster.standby_main.name
  node_group_name = "${var.standby_project_name}-node-group"
  node_role_arn   = aws_iam_role.standby_eks_nodes_role.arn
  subnet_ids      = aws_subnet.standby_private.*.id

  instance_types = var.standby_node_instance_types
  disk_size      = var.standby_node_disk_size
  desired_size   = var.standby_node_group_desired_size
  max_size       = var.standby_node_group_max_size
  min_size       = var.standby_node_group_min_size

  scaling_config {
    desired_size = var.standby_node_group_desired_size
    max_size     = var.standby_node_group_max_size
    min_size     = var.standby_node_group_min_size
  }

  update_config {
    max_unavailable = 1
  }

  tags = merge(var.common_tags, {
    Name = "${var.standby_project_name}-eks-node-group"
    "kubernetes.io/cluster/${var.standby_eks_cluster_name}" = "owned"
  })

  depends_on = [
    aws_iam_role.standby_eks_nodes_role
  ]
}

resource "aws_security_group" "standby_eks_cluster_sg" {
  provider    = aws.us_east_2
  name        = "${var.standby_project_name}-eks-cluster-sg"
  description = "Security group for EKS cluster"
  vpc_id      = aws_vpc.standby_main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.common_tags
}

resource "aws_security_group_rule" "standby_eks_cluster_ingress_workers" {
  provider                 = aws.us_east_2
  description              = "Allow pods to communicate with the cluster API"
  from_port                = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.standby_eks_cluster_sg.id
  to_port                  = 443
  type                     = "ingress"
  source_security_group_id = aws_security_group.standby_eks_cluster_sg.id
}

# --- Outputs para o Cluster Standby ---
output "standby_eks_cluster_id" {
  description = "O ID do Cluster EKS standby."
  value       = aws_eks_cluster.standby_main.id
}

output "standby_eks_cluster_endpoint" {
  description = "Endpoint da API do Cluster EKS standby."
  value       = aws_eks_cluster.standby_main.endpoint
}

output "standby_eks_cluster_oidc_issuer_url" {
  description = "URL do provedor OIDC do Cluster EKS standby, usado para IRSA."
  value       = aws_eks_cluster.standby_main.identity[0].oidc[0].issuer
}

# --- Variáveis Comuns (assumindo que já existem ou serão passadas) ---
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
