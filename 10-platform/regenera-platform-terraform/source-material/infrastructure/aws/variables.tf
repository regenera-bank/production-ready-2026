# [FILE] infrastructure/aws/variables.tf
# Input variables for AWS infrastructure
variable "project_name" {
  description = "Name of the project (e.g., regenera-bank)"
  type        = string
  default     = "regenera-bank"
}

variable "region" {
  description = "AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID of the VPC where resources will be deployed"
  type        = string
}

variable "public_subnets_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS listener"
  type        = string
}

variable "frontend_domain_name" {
  description = "Domain name for the frontend application (e.g., app.regenerabank.com)"
  type        = string
}

variable "api_domain_name" {
  description = "Domain name for the API gateway (e.g., api.regenerabank.com)"
  type        = string
}

variable "private_subnets_ids" {
  description = "List of private subnet IDs for EKS worker nodes and control plane ENIs"
  type        = list(string)
}

variable "database_username" {
  description = "Username for the RDS PostgreSQL database."
  type        = string
  sensitive   = true # Mark as sensitive to prevent logging
}

variable "database_password" {
  description = "Password for the RDS PostgreSQL database."
  type        = string
  sensitive   = true # Mark as sensitive to prevent logging
}
