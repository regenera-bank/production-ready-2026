# [FILE] infrastructure/aws/eks.tf
# AWS EKS Cluster Configuration for Microservices Orchestration

resource "aws_eks_cluster" "regenera_eks_cluster" {
  name     = "${var.project_name}-eks-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids         = var.private_subnets_ids # EKS control plane eni needs private subnets
    security_group_ids = [aws_security_group.eks_cluster_sg.id]
  }

  version = "1.28" # Specify desired Kubernetes version

  # This is a conceptual configuration. In production, careful consideration
  # of networking, logging, monitoring, and security best practices is required.
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

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
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "eks_service_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

# Worker Node Group
resource "aws_eks_node_group" "regenera_node_group" {
  cluster_name    = aws_eks_cluster.regenera_eks_cluster.name
  node_group_name = "${var.project_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = var.private_subnets_ids # Worker nodes go in private subnets

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 1
  }

  instance_types = ["t3.medium"] # Choose appropriate instance types

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role" "eks_node_role" {
  name = "${var.project_name}-eks-node-role"

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
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "ec2_container_registry_readonly_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}

# Security Group for EKS cluster (control plane access)
resource "aws_security_group" "eks_cluster_sg" {
  name_prefix = "${var.project_name}-eks-cluster-sg-"
  description = "Security group for EKS cluster control plane."
  vpc_id      = var.vpc_id

  # Ingress rules to allow access to the control plane (e.g., from app_sg or jump boxes)
  # egress rules to allow control plane to communicate with worker nodes (managed by EKS)

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

# Update outputs to include EKS cluster details
output "eks_cluster_name" {
  description = "The name of the EKS cluster."
  value       = aws_eks_cluster.regenera_eks_cluster.name
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster API."
  value       = aws_eks_cluster.regenera_eks_cluster.endpoint
}
