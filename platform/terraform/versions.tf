terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend "s3" {
  #   bucket         = "regenera-terraform-state"
  #   key            = "platform/terraform.tfstate"
  #   region         = "sa-east-1"
  #   dynamodb_table = "regenera-terraform-locks"
  #   encrypt        = true
  # }
}