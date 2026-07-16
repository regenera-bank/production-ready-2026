# Runbook — monorepo Regenera Bank

Procedimentos operacionais vivem no pacote dono do serviço (quando houver runtime).

## Padrão

1. Health do serviço e dependências (DB, Redis, BFF).
2. Logs com `correlation_id`; sem PII/PAN/token.
3. Rollback: reverter deploy; migrações só forward-compatible.
4. Incidentes financeiros: verificar ledger D=C, outbox e reconciliação antes de reprocessar.

Política de segurança: [SECURITY.md](./SECURITY.md).  
Contribuição: [CONTRIBUTING.md](./CONTRIBUTING.md).
