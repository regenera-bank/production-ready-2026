# [FILE] infrastructure/aws/waf.tf
# AWS Web Application Firewall (WAF) Configuration

resource "aws_wafv2_web_acl" "main_web_acl" {
  name        = "${var.project_name}-web-acl"
  description = "WAF Web ACL for CloudFront distribution"
  scope       = "CLOUDFRONT" # Apply to CloudFront
  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10
    action {
      count {} # Count only for now, change to block for production
    }
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20
    action {
      count {}
    }
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Add more rules as needed (e.g., SQLi, XSS, rate-limiting rules)

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-WebACL"
    sampled_requests_enabled   = true
  }

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Associate WAF Web ACL with CloudFront Distribution
resource "aws_wafv2_web_acl_association" "web_acl_association" {
  resource_arn = aws_cloudfront_distribution.frontend_distribution.arn # ARN from cloudfront.tf
  web_acl_arn  = aws_wafv2_web_acl.main_web_acl.arn
}

# Update outputs.tf to include WAF ARN
output "waf_web_acl_arn" {
  description = "The ARN of the WAF Web ACL."
  value       = aws_wafv2_web_acl.main_web_acl.arn
}
