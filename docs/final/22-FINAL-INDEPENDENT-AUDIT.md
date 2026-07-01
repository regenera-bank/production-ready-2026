# 22 — FINAL INDEPENDENT AUDIT

Commit final: `9b02406eb46868a37c24776038e092f3bd228737`
Tree hash: `f603a0bebb013487e63ece608b51d67a52f19661`
Data UTC: 2026-07-01T00:22:00Z
Pipeline run 1: PASS
Pipeline run 2: PASS
Pacote: `REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip`
SHA-256: `a38c74fb4ee47f62fc26572d653d8e140aa9af41d0c58e078c041d7268a6da3c`
Deploy executado: NÃO

## Veredito por domínio

| Domínio | Evidência | Resultado |
|---------|-----------|-----------|
| Core banking + Postgres | CI unit + integration | PASS |
| Outbox Postgres + Redis/BullMQ | queue-test-* gates | PASS |
| BFF + Web | build + unit + E2E 23/23 | PASS |
| Containers 7/7 | validate-builds + runtime | PASS |
| Security scans | gitleaks + secretlint + audit | PASS |
| SBOM | CycloneDX core/outbox/mobile/ops/design; fallbacks rotulados | PASS com notas |
| Cartões/Investimentos | products E2E + sandbox domain | PASS |
| Design System | web build + Storybook package | PASS |
| DR | backup/restore + ledger IT | PASS RTO 6s RPO 0s |
| Performance local | smoke 40 req, soak 15s | PASS (não capacidade prod) |

## Não verificado nesta rodada

Auditoria regulatória externa, pentest, publicação em lojas — `EXTERNAL_ACTIVATION_REQUIRED`.

## Decisão

**READY FOR DEPLOYMENT EXECUTION**