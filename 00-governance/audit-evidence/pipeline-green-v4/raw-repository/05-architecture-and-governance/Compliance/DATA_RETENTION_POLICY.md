# Regenera Bank Enterprise System - Data Retention & LGPD Policy

**Date:** June 2026
**Compliance:** BACEN / LGPD (General Data Protection Law - Brazil)

## 1. Data Classification
- **Public:** Marketing material, public API schemas. (No retention limit).
- **Internal:** System logs, non-PII metrics. (Retention: 90 days).
- **Confidential (PII):** User KYC, Email, Phone, CPF. (Retention: Indefinite while active. Deleted upon account closure).
- **Highly Restricted (Financial):** Transaction Ledger, Account Balances, DARF. (Retention: **7 Years** mandatory by BACEN, even after account closure).

## 2. Right to be Forgotten (LGPD)
When a user requests account deletion under LGPD:
1. PII data (Name, Photo, Address) is immediately **hard-deleted** or completely obfuscated via hashing.
2. Financial data (Ledger entries) CANNOT be deleted due to BACEN Circular 3.978. The neural_id is replaced with a one-way UUID hash to unlink the natural person from the transaction, but the transaction record remains for auditing.

## 3. Data Deletion Workflow (Purge Engine)
A cron job (`purge-worker`) runs daily at 04:00 AM.
- It scans the `users` table for accounts marked as `CLOSED`.
- If the closure date is > 7 years ago, the financial records are permanently deleted from Spanner and BigQuery.
- A cryptographic receipt of the deletion is stored in a separate WORM (Write-Once-Read-Many) storage bucket.
