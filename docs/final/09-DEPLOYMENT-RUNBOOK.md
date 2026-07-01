# 09 — Deployment Runbook

1. Provisionar Postgres + Redis (Terraform ou compose)
2. Aplicar migrations `domains/core-bank/db/migrations/`
3. Rotacionar secrets (`11-SECRETS-ROTATION-PLAN.md`)
4. Subir core-bank → outbox-relay → web-bff → web-banking
5. Smoke: `GET /v1/health` em cada BFF
6. E2E homolog: `cd quality/e2e-web && npx playwright test`

Deploy executado nesta execução: **NÃO**
