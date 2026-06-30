# [FILE] /Users/admin/Desktop/pipiline/Infraestrutura como Código/terraform/iam_for_eks.tf
# Terraform Configuration for EKS Cluster IAM Roles
# Desenvolvedor: Don Paulo Ricardo

# IAM Role para o Cluster EKS
# Este role permite que o EKS faça chamadas para outros serviços AWS em seu nome
# para gerenciar os recursos do cluster.
resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.project_name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "eks.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.common_tags
}

# Anexa a política gerenciada do EKS para o Cluster Role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

# Opcional: Política para que o EKS possa gerenciar as ENIs da VPC.
# Necessária se o VPC CNI (Container Network Interface) for usado.
resource "aws_iam_role_policy_attachment" "eks_vpc_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster_role.name
}

# IAM Role para os Node Groups (instâncias EC2 que rodam os Workers do EKS)
resource "aws_iam_role" "eks_nodes_role" {
  name = "${var.project_name}-eks-nodes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.common_tags
}

# Anexa políticas gerenciadas necessárias para os Node Groups
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes_role.name
}

resource "aws_iam_role_policy_attachment" "ec2_container_registry_readonly_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes_role.name
}


# Variáveis para este módulo IAM
variable "project_name" {
  description = "Nome do projeto para prefixar recursos."
  type        = string
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}

# Outputs deste módulo IAM
output "eks_cluster_role_arn" {
  description = "ARN do IAM Role para o Cluster EKS."
  value       = aws_iam_role.eks_cluster_role.arn
}

output "eks_nodes_role_arn" {
  description = "ARN do IAM Role para os Node Groups do EKS."
  value       = aws_iam_role.eks_nodes_role.arn
}
