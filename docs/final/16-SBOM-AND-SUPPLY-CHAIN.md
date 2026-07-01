# 16 — SBOM and Supply Chain

Commit final: `FINAL_COMMIT_PENDING`

## Componentes classificados

Fonte: `artifacts/sbom/final/SBOM-STATUS.json`

| Componente | Classificação |
|------------|---------------|
| domains/core-bank | COMPLETE_TRANSITIVE ou PARTIAL_DECLARED_DEPENDENCIES_ONLY |
| workers/outbox-relay | COMPLETE_TRANSITIVE ou PARTIAL |
| bff/web-bff | COMPLETE_TRANSITIVE ou PARTIAL |
| apps/web-banking | COMPLETE_TRANSITIVE ou PARTIAL |
| bff/mobile-bff | COMPLETE_TRANSITIVE ou PARTIAL |
| bff/operations-bff | COMPLETE_TRANSITIVE ou PARTIAL |
| bff/partner-api-facade | COMPLETE_TRANSITIVE ou PARTIAL |
| apps/partner-developer-portal | COMPLETE_TRANSITIVE ou PARTIAL |
| design-system/web | COMPLETE_TRANSITIVE ou PARTIAL |
| quality/e2e-web | COMPLETE_TRANSITIVE ou PARTIAL |

SBOM parcial nunca recebe `PASS_FULL`. Manifesto: `artifacts/sbom/final/SBOM-MANIFEST.sha256`.
