# RUNBOOK-CORE-003 — Restauração de Disaster Recovery

**Severidade:** P0  
**Domínio:** Core Banking / Platform  
**Trigger:** Falha de AZ, corrupção de dados, ou exercício DR agendado

## Pré-requisitos (PENDENTE em produção)

- Backup PostgreSQL point-in-time testado
- `PACKAGE-CHECKSUMS.sha256` assinado GPG
- RTO/RPO documentados e exercitados

## Procedimento (homologação)

1. Parar tráfego (`CORE_PAYMENTS_ENABLED=false`)
2. Restaurar snapshot PostgreSQL para instância isolada
3. Verificar triggers V001 ativos: append-only, D=C
4. Executar `audit-chain.service.verify()` — cadeia íntegra
5. Rodar suite de 47 invariantes — 0 falhando
6. Comparar checksums de artefatos com evidência assinada
7. Reabrir tráfego em canário (PR-15)

## O que NÃO fazer

- Restaurar backup sem verificar integridade da Audit chain
- Pular testes invariantes pós-restore
- Declarar DR exercitado sem relatório assinado (EXTERNAL-BLOCKERS)

## Evidência obrigatória

- Relatório com RTO medido
- Assinatura GPG do pacote restaurado
- Log de `verifyEntryHash` em amostra de lançamentos