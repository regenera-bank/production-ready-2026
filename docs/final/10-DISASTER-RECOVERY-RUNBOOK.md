# 10 — Disaster Recovery Runbook

Ver `platform/disaster-recovery/RUNBOOK-DR-001.md` e `domains/core-bank/docs/runbooks/RUNBOOK-CORE-003-DR-RESTORE.md`.

RPO/RTO declarados em Terraform outputs. Restore Postgres via snapshot + replay outbox pendente.