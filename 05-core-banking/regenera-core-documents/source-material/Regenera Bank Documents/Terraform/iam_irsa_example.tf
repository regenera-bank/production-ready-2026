# [FILE] /Users/admin/Desktop/pipiline/Infraestrutura como Código/terraform/iam_irsa_example.tf
# Terraform Configuration for IAM Roles for Service Accounts (IRSA)
# Desenvolvedor: Don Paulo Ricardo
# Exemplo para o user-service

# --- Pré-requisito: EKS Cluster deve estar criado e seu OIDC Provider disponível ---
# Obter o OIDC Provider do EKS Cluster existente
data "aws_eks_cluster" "main" {
  name = var.eks_cluster_name
}

data "aws_iam_openid_connect_provider" "main" {
  url = data.aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# --- IAM Policy para acesso ao AWS Secrets Manager ---
# Esta política concede permissão para ler um segredo específico do Secrets Manager.
resource "aws_iam_policy" "user_service_secrets_policy" {
  name        = "${var.project_name}-user-service-secrets-policy"
  description = "Permite que o user-service acesse segredos específicos no AWS Secrets Manager."

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:user-service-db-credentials-*" # Substitua pelo ARN real do segredo
      }
    ]
  })

  tags = var.common_tags
}

# --- IAM Role para o Service Account do Kubernetes ---
# Este role é configurado para ser assumido por um Service Account específico do Kubernetes
# através do provedor OIDC do EKS.
resource "aws_iam_role" "user_service_sa_role" {
  name = "${var.project_name}-user-service-sa-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.main.arn
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "${data.aws_iam_openid_connect_provider.main.url}:sub" = "system:serviceaccount:${var.kubernetes_namespace}:${var.user_service_sa_name}"
            "${data.aws_iam_openid_connect_provider.main.url}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

# Anexa a política de acesso a segredos ao IAM Role.
resource "aws_iam_role_policy_attachment" "user_service_secrets_attachment" {
  policy_arn = aws_iam_policy.user_service_secrets_policy.arn
  role       = aws_iam_role.user_service_sa_role.name
}

# --- Kubernetes Service Account (para ser criado no cluster EKS) ---
# Este bloco ilustra como a Service Account seria definida.
# Na prática, isso seria parte do seu manifesto YAML do Kubernetes (e.g., user-service-k8s.yaml),
# ou gerenciado via Helm.
resource "kubernetes_service_account_v1" "user_service_sa" {
  metadata {
    name      = var.user_service_sa_name
    namespace = var.kubernetes_namespace
    annotations = {
      # Esta anotação vincula o Service Account ao IAM Role que acabamos de criar.
      "eks.amazonaws.com/role-arn" = aws_iam_role.user_service_sa_role.arn
    }
    labels = var.common_tags
  }
}

# Variáveis para este módulo IRSA
variable "project_name" {
  description = "Nome do projeto para prefixar recursos."
  type        = string
}

variable "eks_cluster_name" {
  description = "Nome do cluster EKS existente."
  type        = string
}

variable "aws_region" {
  description = "Região da AWS onde os recursos estão."
  type        = string
}

variable "kubernetes_namespace" {
  description = "Namespace do Kubernetes onde o user-service será implantado."
  type        = string
  default     = "default"
}

variable "user_service_sa_name" {
  description = "Nome da Service Account Kubernetes para o user-service."
  type        = string
  default     = "user-service-sa" # Deve corresponder ao 'serviceAccountName' no deployment.
}

variable "common_tags" {
  description = "Mapa de tags comuns a serem aplicadas em todos os recursos."
  type        = map(string)
  default     = {}
}

# Data source para obter o ID da conta AWS atual
data "aws_caller_identity" "current" {}
