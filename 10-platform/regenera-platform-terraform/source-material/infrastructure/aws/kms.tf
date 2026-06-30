# [FILE] infrastructure/aws/kms.tf
# AWS Key Management Service (KMS) Configuration

resource "aws_kms_key" "regenera_app_key" {
  description             = "${var.project_name} application encryption key"
  deletion_window_in_days = 10 # For production, consider 30 days
  enable_key_rotation     = true

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_kms_alias" "regenera_app_alias" {
  name          = "alias/${var.project_name}-app-key"
  target_key_id = aws_kms_key.regenera_app_key.key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key for application encryption."
  value       = aws_kms_key.regenera_app_key.arn
}

output "kms_key_id" {
  description = "The ID of the KMS key for application encryption."
  value       = aws_kms_key.regenera_app_key.id
}