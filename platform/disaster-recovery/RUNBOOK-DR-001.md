# RUNBOOK-DR-001 — Recuperação de Desastre Regenera Bank

| Campo | Valor |
|-------|-------|
| **ID** | DR-001 |
| **Frente** | 16 — Platform Engineering |
| **RTO alvo** | 4 h (homologação) / 2 h (produção) |
| **RPO alvo** | 15 min (WAL + snapshot RDS) |
| **Owner** | Platform Engineering + DBA |
| **Última revisão** | 2026-06-30 |

## 1. Escopo

Este runbook cobre recuperação de:

- Falha de AZ/região AWS (`sa-east-1`)
- Corrupção ou perda de RDS PostgreSQL (ledger + outbox)
- Indisponibilidade ElastiCache Redis (filas BullMQ / idempotency)
- Perda de cluster Kubernetes (EKS)

**Fora de escopo:** rotação de secrets comprometidos (ver `14-SECURITY-AND-SECRETS-Audit.md`), rollback de release de aplicação (ver manifests K8s).

## 2. Pré-requisitos

- [ ] Acesso break-glass IAM documentado (não neste repositório)
- [ ] Snapshots RDS automáticos habilitados (`backup_retention_period >= 35` em produção)
- [ ] Replicação cross-region ou snapshot export validada trimestralmente
- [ ] `BACKUP_FILE` e `TARGET_DB_URL` definidos no pipeline DR (placeholders — sem credenciais reais)
- [ ] Contatos: Platform on-call, Compliance, BACEN liaison (se incidente regulatório)

## 3. Classificação do incidente

| Severidade | Critério | Ação imediata |
|------------|----------|---------------|
| **SEV-1** | Ledger indisponível ou divergência de saldo confirmada | Acionar DR completo, congelar débitos |
| **SEV-2** | RDS degradado, Redis down, BFF up com cache miss | Failover parcial |
| **SEV-3** | Canal web down, core íntegro | Restaurar front/nginx apenas |

## 4. Procedimento — Falha RDS PostgreSQL

### 4.1 Detecção

```bash
# Health core-bank
curl -sf http://core-bank:3100/v1/health

# Conectividade Postgres (sem expor senha no shell — usar IAM/Secrets Manager)
psql "$DATABASE_URL" -c "SELECT 1"
```

### 4.2 Contenção

1. Colocar BFFs em modo manutenção (feature flag ou ingress 503 controlado).
2. Pausar `outbox-relay` — evita publicação duplicada durante gap.
3. Registrar `correlationId` do incidente em ticket P1.

### 4.3 Restauração

```bash
export BACKUP_FILE="s3://regenera-dr-snapshots/postgres/YYYYMMDD-HHMM.dump"
export TARGET_DB_URL="postgresql://regenera_admin@rds-restore.sa-east-1.amazonaws.com:5432/regenera"

DRY_RUN=false ./16.dr-restore.sh /path/to/restore/workspace
```

**Checklist pós-restore:**

- [ ] `verify_ledger_chain_integrity()` — hash bloco 0 → head
- [ ] Contagem de `journal_entries` vs snapshot pré-incidente (±0)
- [ ] Outbox `PENDING` reprocessado com idempotência (`payloadHash`)
- [ ] Reconciliação PIX gap (eventos entre último WAL e restore)

### 4.4 Validação

```bash
curl -sf http://web-bff:3200/v1/health/integrations
curl -sf http://outbox-relay:3109/health
# Smoke: GET saldo homolog + POST idempotente com mesma chave
```

## 5. Procedimento — Falha Redis (ElastiCache)

1. Verificar `outbox-relay` health: `redis: false` → SEV-2.
2. Failover automático Multi-AZ (produção) — aguardar 2–5 min.
3. Se cluster irrecuperável: restaurar snapshot ElastiCache ou recriar cluster vazio.
4. **Atenção:** filas BullMQ vazias exigem re-dispatch do outbox Postgres (append-only, seguro com idempotência).

```bash
curl -sf http://outbox-relay:3109/health | jq .
```

## 6. Procedimento — Falha Kubernetes

1. ArgoCD / `kubectl apply -f platform/kubernetes/` em cluster DR.
2. Ordem de subida:
   1. Secrets (CSI → `regenera-database`, `regenera-redis`, `regenera-jwt`)
   2. `core-bank`
   3. `outbox-relay`
   4. BFFs (`web-bff`, `mobile-bff`, `operations-bff`, `partner-api-facade`)
   5. `web-banking`
3. Validar probes liveness/readiness em todos os deployments.

## 7. Comunicação

| Público | Mensagem mínima |
|---------|-----------------|
| Clientes | Indisponibilidade parcial/total, sem detalhes internos |
| Parceiros API | Status page + ETA baseado em RTO |
| Regulador | Se SEV-1 > 2h ou vazamento — acionar Compliance |

## 8. Rollback do DR

- Se restore introduziu divergência: **não** re-aplicar snapshot antigo sobre dados novos.
- Correção via partidas compensatórias no ledger (append-only).
- Documentar evidências em `docs/audit/` com hash do snapshot restaurado.

## 9. Testes periódicos

| Teste | Frequência | Evidência |
|-------|------------|-----------|
| Restore RDS em ambiente isolado | Trimestral | Log `DR-RESTORE` + checksum |
| Failover Redis | Semestral | Métrica `redis_up` |
| Game day K8s | Anual | Tempo real vs RTO |

## 10. Referências

- `platform/terraform/` — RDS, ElastiCache, Secrets Manager ARNs
- `platform/docker/docker-compose.full.yml` — stack local para reproduzir ordem de dependências
- `domains/core-bank/docs/runbooks/RUNBOOK-CORE-002-LEDGER-IMBALANCE.md`
- `docs/audit/18-DEPLOYMENT-HANDOFF-FINAL.md`