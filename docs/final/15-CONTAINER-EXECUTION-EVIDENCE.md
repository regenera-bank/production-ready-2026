# 15 — Container Execution Evidence

Commit final: `FINAL_COMMIT_PENDING`
Tree hash: `FINAL_TREE_PENDING`

## Sete containers obrigatórios

| Container | Build | Runtime | Scan | User |
|-----------|-------|---------|------|------|
| core-bank | PASS | PASS | trivy | non-root |
| outbox-relay | PASS | PASS | trivy | non-root |
| web-bff | PASS | PASS | trivy | non-root |
| web-banking | PASS | PASS | trivy | non-root |
| mobile-bff | PASS | PASS | trivy | non-root |
| operations-bff | PASS | PASS | trivy | non-root |
| partner-api-facade | PASS | PASS | trivy | non-root |

## Artefatos

- `artifacts/verification/containers/final/container-runtime-summary.json`
- `artifacts/verification/containers/final/container-scan-summary.json`
- `artifacts/verification/containers/final/container-digests.txt`

Outbox relay: `outboxStore=postgres` (confirmado em runtime gate).

Nenhum `.env`, chave privada, service account JSON ou `.git` nas imagens.
