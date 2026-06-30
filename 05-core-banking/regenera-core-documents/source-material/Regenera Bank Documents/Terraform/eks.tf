# [FILE] /Users/admin/Desktop/pipiline/Infraestrutura como Código/terraform/eks.tf
# Terraform Configuration for AWS EKS Cluster
# Desenvolvedor: Don Paulo Ricardo

resource "aws_eks_cluster" "main" {
  name     = var.eks_cluster_name
  role_arn = var.eks_cluster_role_arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids         = var.private_subnet_ids # EKS Cluster rodando em subnets privadas para segurança
    security_group_ids = [aws_security_group.eks_cluster_sg.id]
    endpoint_private_access = true # Acesso privado ao endpoint da API do EKS
    endpoint_public_access  = true # Opcional: Para acesso público ao endpoint, pode ser desativado para clusters mais restritos
    public_access_cidrs     = ["0.0.0.0/0"] # Restringir se o acesso público for mantido
  }

  # Habilitar o provedor OIDC para IAM Roles for Service Accounts (IRSA)
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = merge(var.common_tags, {
    Name = var.eks_cluster_name
  })

  # Dependências explícitas para garantir a ordem de criação
  depends_on = [
    aws_iam_role.eks_cluster_role,
    aws_vpc.main,
    aws_subnet.private
  ]
}

# Node Group para os Worker Nodes do EKS
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-node-group"
  node_role_arn   = var.eks_nodes_role_arn
  subnet_ids      = var.private_subnet_ids # Worker nodes em subnets privadas

  instance_types = var.node_instance_types
  disk_size      = var.node_disk_size
  desired_size   = var.node_group_desired_size
  max_size       = var.node_group_max_size
  min_size       = var.node_group_min_size

  scaling_config {
    desired_size = var.node_group_desired_size
    max_size     = var.node_group_max_size
    min_size     = var.node_group_min_size
  }

  update_config {
    max_unavailable = 1 # Durante atualizações, apenas 1 nó pode estar indisponível
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-eks-node-group"
    "kubernetes.io/cluster/${var.eks_cluster_name}" = "owned"
  })

  depends_on = [
    aws_iam_role.eks_nodes_role
  ]
}

# Security Group para o Cluster EKS
resource "aws_security_group" "eks_cluster_sg" {
  name        = "${var.project_name}-eks-cluster-sg"
  description = "Security group for EKS cluster"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # Permite todo o tráfego de saída
  }

  tags = var.common_tags
}

# Permite que o Control Plane do EKS se comunique com os Worker Nodes
resource "aws_security_group_rule" "eks_cluster_ingress_workers" {
  description              = "Allow pods to communicate with the cluster API"
  from_port                = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster_sg.id
  to_port                  = 443
  type                     = "ingress"
  source_security_group_id = aws_security_group.eks_cluster_sg.id # O worker node SG também permite
}

# Data source para o OIDC Provider do EKS (necessário para IRSA)
data "aws_iam_openid_connect_provider" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Variáveis para este módulo EKS
variable "eks_cluster_name" {
  description = "Nome do cluster EKS."
  type        = string
}

variable "kubernetes_version" {
  description = "Versão do Kubernetes para o cluster EKS."
  type        = string
  default     = "1.28"
}

variable "eks_cluster_role_arn" {
  description = "ARN do IAM Role para o Cluster EKS."
  type        = string
}

variable "eks_nodes_role_arn" {
  description = "ARN do IAM Role para os Worker Nodes do EKS."
  type        = string
}

variable "vpc_id" {
  description = "O ID da VPC onde o cluster EKS será provisionado."
  type        = string
}

variable "private_subnet_ids" {
  description = "Os IDs das subnets privadas onde o cluster EKS será provisionado."
  type        = list(string)
}

variable "node_instance_types" {
  description = "Lista de tipos de instância para os worker nodes."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_disk_size" {
  description = "Tamanho do disco em GB para os worker nodes."
  type        = number
  default     = 20
}

variable "node_group_desired_size" {
  description = "Número desejado de worker nodes no node group."
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Número máximo de worker nodes no node group."
  type        = number
  default     = 3
}

variable "node_group_min_size" {
  description = "Número mínimo de worker nodes no node group."
  type        = number
  default     = 1
}

variable "project_name" {
  description = "Nome do projeto para prefixar recursos."
  type        = string
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}

# Outputs deste módulo EKS
output "eks_cluster_id" {
  description = "O ID do Cluster EKS."
  value       = aws_eks_cluster.main.id
}

output "eks_cluster_endpoint" {
  description = "Endpoint da API do Cluster EKS."
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_oidc_issuer_url" {
  description = "URL do provedor OIDC do Cluster EKS, usado para IRSA."
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}
