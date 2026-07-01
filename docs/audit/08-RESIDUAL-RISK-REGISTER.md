> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

# 08 — Registro de Riscos Residuais

| ID | Risco | Severidade | Mitigação pré-deploy |
|----|-------|------------|----------------------|
| R01 | Secrets em `.env` ativos | Crítico | Rotacionar; não incluir em ZIP |
| R02 | Baseline sem git | Alto | `git init` ou espelhar para repo |
| R03 | Core-bank in-memory | Alto | Adapter Postgres + migrations |
| R04 | BullMQ ausente | Alto | Implementar outbox relay ou adiar |
| R05 | KYC homolog ≠ regulatório | Médio | Documentar em handoff |
| R06 | Bundle web >500KB | Baixo | Code-split opcional |
| R07 | `.env` backups | Mitigado | Movidos para `artifacts/quarantine/env-backups/` |
| R08 | Passkeys não exercitados E2E | Médio | Teste manual pós-deploy |