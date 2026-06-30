# [FILE] infrastructure/aws/cloudfront.tf
# AWS CloudFront Distribution Configuration

resource "aws_cloudfront_distribution" "frontend_distribution" {
  origin {
    domain_name = aws_lb.application_lb.dns_name
    origin_id   = "frontend-alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "match-viewer" # Or "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for Regenera Bank frontend"
  default_root_object = "index.html" # Assuming the frontend SPA serves index.html at root

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "frontend-alb-origin"
    viewer_protocol_policy = "redirect-to-https" # Always use HTTPS

    forwarded_values {
      query_string = true
      cookies {
        forward = "none" # Or "all" / "whitelist" based on frontend requirements
      }
    }

    min_ttl                = 0
    default_ttl            = 3600 # 1 hour
    max_ttl                = 86400 # 24 hours
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["BR"] # Restrict to Brazil, or use "none" for global
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2019"
  }

  aliases = [var.frontend_domain_name] # Associate with the custom domain

  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Output CloudFront Distribution ID
output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution."
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution."
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}
