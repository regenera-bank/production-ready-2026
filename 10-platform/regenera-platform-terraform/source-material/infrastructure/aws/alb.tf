# [FILE] infrastructure/aws/alb.tf
# AWS Application Load Balancer (ALB) Configuration

resource "aws_lb" "application_lb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.public_subnets_ids # Assumes these are defined elsewhere

  enable_deletion_protection = false # Set to true for production
  
  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.application_lb.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.application_lb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08" # Or more recent
  certificate_arn   = var.acm_certificate_arn    # Must be provided

  default_action {
    type             = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Gateway error: No matching rule found."
      status_code  = "503"
    }
  }
}

# Target Group for our API Gateway microservice (assuming it will run on an EC2/ECS instance)
resource "aws_lb_target_group" "api_gateway_tg" {
  name        = "${var.project_name}-api-gateway-tg"
  port        = 3000 # The port our api-gateway listens on
  protocol    = "HTTP"
  vpc_id      = var.vpc_id # Assumes VPC is defined elsewhere
  target_type = "ip" # Or 'instance' if using EC2 directly

  health_check {
    path                = "/health" # Assumes a health endpoint is available
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
  
  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

# Listener rule to forward traffic to the API Gateway target group
resource "aws_lb_listener_rule" "api_gateway_rule" {
  listener_arn = aws_lb_listener.https_listener.arn
  priority     = 100 # Adjust priority as needed

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"] # All /api traffic goes to the API Gateway
    }
  }
}

# Listener rule to forward remaining traffic (e.g., frontend) to the frontend target group
resource "aws_lb_target_group" "frontend_tg" {
  name        = "${var.project_name}-frontend-tg"
  port        = 5173 # The port our frontend SPA listens on
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
  
  tags = {
    Project = var.project_name
    ManagedBy = "Terraform"
  }
}

resource "aws_lb_listener_rule" "frontend_rule" {
  listener_arn = aws_lb_listener.https_listener.arn
  priority     = 200 # Lower priority than API Gateway rule

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }

  condition {
    # Default rule for paths not matching /api/*
    host_header {
      values = [var.frontend_domain_name]
    }
  }
}
