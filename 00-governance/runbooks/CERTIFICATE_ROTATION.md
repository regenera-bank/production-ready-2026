# Regenera Bank Enterprise System - Certificate & Key Rotation Policy

**Date:** June 2026
**Compliance:** FIPS 140-2 / BACEN

## 1. Overview
Cryptographic keys and certificates must be rotated regularly to limit the amount of data encrypted under a single key and to mitigate the impact of a compromised key.

## 2. Rotation Schedule
- **TLS/SSL Certificates (Public):** Automated via Google Managed Certificates. Rotated every 30 days automatically.
- **mTLS Certificates (Internal Service Mesh):** Automated via Istio Citadel. Rotated every 24 hours.
- **Open Finance ICP-Brasil Certificates:** Manual rotation required 30 days prior to the 1-year expiration date.
- **JWT Signing Keys:** Rotated every 90 days.
- **Webhook HMAC Secrets:** Rotated every 180 days.

## 3. Manual Rotation Procedure (Open Finance / External APIs)
1. **Generate New Key Pair:** Generate a new CSR (Certificate Signing Request) via HSM (Hardware Security Module).
2. **Sign Certificate:** Submit the CSR to the ICP-Brasil CA (Certifying Authority).
3. **Stage New Certificate:** Upload the new certificate to Google Secret Manager.
4. **Deploy:** Update the deployment manifests to reference the new Secret Manager version. Perform a rolling restart of the `open-finance` pods.
5. **Verify:** Run the E2E test suite (`npm run test:e2e`) to ensure communication with Prometeo/BACEN is functional.
6. **Revoke Old Certificate:** 48 hours after successful deployment, revoke the old certificate with the CA.
