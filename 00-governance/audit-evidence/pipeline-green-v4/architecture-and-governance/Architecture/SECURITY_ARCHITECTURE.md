# Regenera Bank Enterprise System - Security Architecture

**Date:** June 2026
**Compliance:** BACEN / LGPD / FIPS 140-2

## 1. Zero-Trust Identity
No internal service inherently trusts another. All inter-service communication requires authentication via GCP IAM identities or internal JWTs.

## 2. Cryptography & FIPS 140-2 Compliance
- **At-Rest:** All databases (Spanner, Neon) are encrypted at rest using AES-256 via Google Cloud KMS.
- **In-Transit:** All endpoints enforce TLS 1.3. Service-to-service communication is encrypted via Istio mTLS.
- **Key Rotation:** Automated via Cloud Secret Manager with a 90-day TTL policy.

## 3. Perimeter Defense (WAF & DDoS)
- **Cloud Armor:** WAF policies are strictly enforced at the global load balancer level.
- **OWASP Top 10 Mitigation:** Pre-configured rules block SQLi, XSS, and LFI attempts.
- **Rate Limiting:** IP-based and User-based rate limiting prevent credential stuffing and DDoS attacks.

## 4. Open Finance & MTLS
The Open Finance / ITP integration leverages Mutual TLS (MTLS) using Brazil's ICP-Brasil certificates to establish verifiable trust with Prometeo and BACEN sandbox environments.

## 5. Audit Trail & SIEM
All critical events (account freezes, KYC changes, large transfers) are published to a Pub/Sub topic that ingests directly into our SIEM (Google Chronicle / Splunk) for real-time monitoring by the SOC team.
