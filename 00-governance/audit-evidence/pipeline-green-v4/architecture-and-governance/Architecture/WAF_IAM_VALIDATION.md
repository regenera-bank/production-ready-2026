# Regenera Bank Enterprise System - WAF & IAM Validation

**Date:** June 2026
**Compliance:** OWASP Top 10 / BACEN

## 1. Cloud Armor (WAF) Validation
The Google Cloud Armor policies have been configured and validated against the OWASP Top 10 vulnerabilities.

### Enforced Rulesets
- **owasp-crs-v030001-id942100-sqli:** Blocks SQL Injection attempts (e.g., `1 OR 1=1`). Validated via `security-auth.spec.ts`.
- **owasp-crs-v030001-id941100-xss:** Blocks Cross-Site Scripting (XSS) payloads.
- **owasp-crs-v030001-id930100-lfi:** Blocks Local File Inclusion directory traversal attacks.

### Rate Limiting Mitigation
- The `/auth/login` endpoint is restricted to 5 requests per IP per minute.
- The `/pix/transfer` endpoint is restricted to 30 requests per user per minute.

## 2. IAM Least-Privilege Policies
All microservices operate under strict Service Accounts (SA).
- **Backend Application SA (`regenera-backend-sa`):**
  - `roles/spanner.databaseUser`
  - `roles/secretmanager.secretAccessor` (Restricted via condition to only access secrets tagged with `env:prod`).
- **Pub/Sub Publisher SA (`regenera-events-sa`):**
  - `roles/pubsub.publisher`
- **Root/Admin Access:** Human access to production environments is forbidden. Break-glass access requires dual approval and is logged to SIEM.

## 3. VPC Isolation & Private Endpoints
- The Spanner database instance is isolated in a VPC without external IP addresses.
- Cloud Run instances connect to the database via Serverless VPC Access Connectors.
- All ingress traffic routes strictly through the Global HTTP(S) Load Balancer. Direct access to Cloud Run URLs is disabled via Ingress settings (`internal-and-cloud-load-balancing`).
