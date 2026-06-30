# [FILE] infrastructure/aws/outputs.tf
# Outputs from our AWS infrastructure deployment

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer."
  value       = aws_lb.application_lb.dns_name
}

output "alb_zone_id" {
  description = "The Route 53 Hosted Zone ID of the Application Load Balancer."
  value       = aws_lb.application_lb.zone_id
}

output "api_gateway_target_group_arn" {
  description = "The ARN of the target group for the API Gateway."
  value       = aws_lb_target_group.api_gateway_tg.arn
}

output "frontend_target_group_arn" {
  description = "The ARN of the target group for the Frontend SPA."
  value       = aws_lb_target_group.frontend_tg.arn
}

output "waf_web_acl_arn" {
  description = "The ARN of the WAF Web ACL."
  value       = aws_wafv2_web_acl.main_web_acl.arn
}

output "db_security_group_id" {
  description = "The ID of the Security Group for the PostgreSQL DB."
  value       = aws_security_group.db_sg.id
}

output "messaging_cache_nosql_security_group_id" {
  description = "The ID of the Security Group for Messaging, Cache, and NoSQL DBs."
  value       = aws_security_group.messaging_cache_nosql_sg.id
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster."
  value       = aws_eks_cluster.regenera_eks_cluster.name
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster API."
  value       = aws_eks_cluster.regenera_eks_cluster.endpoint
}
