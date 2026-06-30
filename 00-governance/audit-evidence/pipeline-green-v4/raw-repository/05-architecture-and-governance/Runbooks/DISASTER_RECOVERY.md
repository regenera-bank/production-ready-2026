# Regenera Bank Enterprise System - Disaster Recovery Plan (DRP)

**Date:** June 2026
**Compliance:** BACEN Circular 3.909

## 1. Objectives
- **RTO (Recovery Time Objective):** < 4 hours for total regional loss. < 15 minutes for single-zone failure.
- **RPO (Recovery Point Objective):** < 0 seconds (Zero Data Loss) during normal operations via synchronous replication. < 5 minutes for extreme multi-region disaster.

## 2. Backup Strategy
- **Frequency:** Automated incremental backups every hour. Full snapshots daily at 03:00 AM BRT.
- **Retention:** 7 years for all financial transaction logs (BACEN mandate).
- **Storage:** Encrypted at rest (AES-256). Stored in a separate, isolated GCP project with multi-region replication (e.g., `us-central1` and `southamerica-east1`).

## 3. Failover Procedure (Database)
If the primary database region (`southamerica-east1`) goes down:
1. Monitoring detects failure and alerts SRE.
2. SRE triggers the automated failover script promoting the read-replica in `us-east1` to Primary.
3. DNS routing is updated automatically via Cloud DNS to point to the new region.
4. Traffic resumes. Data consistency is verified via checksums.

## 4. Testing & Validation
The Disaster Recovery Plan is tested bi-annually. A "Game Day" is scheduled where a simulated regional failure is injected into the Staging environment to validate the RTO and RPO metrics.
