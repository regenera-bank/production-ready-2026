# [FILE] /Users/admin/Desktop/pipiline/Infraestrutura como Código/terraform/versions.tf
# Terraform Versions and Provider Configuration
# Desenvolvedor: Don Paulo Ricardo

terraform {
  required_version = ">= 1.0.0" # Versão mínima do Terraform CLI

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Versão do provider AWS
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23" # Versão do provider Kubernetes
    }
  }

  # Configuração do backend remoto para o estado do Terraform
  # Substitua 'your-s3-bucket-name', 'your-dynamodb-table-name' e 'your-aws-region'
  # por valores reais do seu ambiente.
  backend "s3" {
    bucket         = "regenera-bank-tfstate" # Nome do bucket S3 para armazenar o estado
    key            = "eks/terraform.tfstate" # Caminho do arquivo de estado dentro do bucket
    region         = "us-east-1"             # Região do bucket S3
    dynamodb_table = "regenera-bank-tf-locks" # Tabela DynamoDB para bloqueio de estado
    encrypt        = true
  }
}

# Configuração do provedor AWS
provider "aws" {
  region = var.aws_region
}
