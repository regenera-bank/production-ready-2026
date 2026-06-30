# Regenera Bank Enterprise System - Audit Logging Architecture

**Date:** June 2026
**Compliance:** BACEN / ISO 27001

## 1. Immutable Audit Trail
To comply with banking regulations, Regenera Bank implements an immutable, append-only audit trail for all critical business operations.

## 2. In-Scope Events
The following events MUST be logged with the original IP, neural_id, timestamp, and a cryptographic hash of the payload:
- **KYC Engine:** Any approval, rejection, or update to user identity documents.
- **Account Status:** Freezing, unfreezing, or judicial blocking of accounts.
- **Transactions:** Any debit, credit, or PIX transfer exceeding R$ 10.000,00.
- **Security:** Failed login attempts > 3 times, IAM role assignments, Secret Manager access.

## 3. Storage Architecture
- **Hot Tier (30 Days):** Logs are streamed to Google Cloud Logging and DataDog for real-time alerting and SOC monitoring.
- **Cold Tier (7 Years):** Logs are simultaneously exported via Pub/Sub to a Google Cloud Storage bucket with a `Retention Policy` lock configured to 7 years. This ensures that not even a GCP Project Owner can delete the logs before the regulatory period expires.

## 4. Integrity Verification
A nightly batch job calculates a Merkle Tree hash of all logs written in the last 24 hours. The root hash is recorded in the core ledger. This guarantees that logs cannot be silently altered or truncated post-facto.
