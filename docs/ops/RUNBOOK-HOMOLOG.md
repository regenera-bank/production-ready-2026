# Runbook — Ambiente Homolog

## Startup

```bash
cd bff/web-bff && HOMOLOG_STORE_MEMORY=true CORE_BANK_STORAGE=memory npm run start:dev
cd apps/web-banking && npm run dev
```

Health: `GET http://localhost:3210/v1/health` → `{ "status": "ok" }`

## Rollback BFF

1. `git checkout <sha-estável>`
2. `cd bff/web-bff && npm run build`
3. Reiniciar processo na porta configurada

## Restore store homolog

```bash
bash scripts/ops/dr-restore-homolog.sh --dry-run
bash scripts/ops/dr-restore-homolog.sh --apply
```

## Monitoramento mínimo

- Logs estruturados: `BankingService`, `ProductsService`, `LifestyleService`
- Health: `/v1/health`, `/v1/health/integrations`
- Alertas homolog: falha consecutiva em `run-pre-deploy-gates.sh`

## Bloqueios externos (não simular)

