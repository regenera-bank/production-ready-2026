# 01 — Full Platform Architecture

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`  
**Git tree:** `a9e3a8b8bb2b8e40d23c9947331fd0c47f171919`  
**Timestamp:** 2026-06-30 UTC  
**Evidence root:** `artifacts/verification/full-ci/run1/`

---

## Decisão de status

| Camada | Status global | Nota honesta |
|--------|---------------|--------------|
| Core Banking | **ACTIVE_INTERNAL** | Ledger, Pix, payments, Postgres IT verdes |
| Domínios scaffold (46) | **ACTIVE_INTERNAL** (simulator) / **EXTERNAL_ACTIVATION_REQUIRED** (production) | Port/adapter pattern; 2 testes/domínio |
| BFF Web | **ACTIVE_SANDBOX** | Homolog KYC, banking real via core-bank |
| Canal Web | **ACTIVE_SANDBOX** | 7 rotas reais; 16+ módulos mock |
| Android / iOS / Windows | **EXTERNAL_ACTIVATION_REQUIRED** | Build/execução fora do CI agente |
| Produção BACEN | **REGULATORY_ACTIVATION_REQUIRED** | SPI/DICT, licenças IP/SCD pendentes |

**Pipeline CI:** `artifacts/verification/full-ci/run1/run-metadata.json` → `result: FAIL` (security stage 16/18).

---

## Diagrama lógico

```
┌─────────────────────────────────────────────────────────────────┐
│  CANAIS (intenção — não postam ledger)                          │
│  apps/web-banking  apps/android  apps/ios  windows-operations   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────────┐
│  BFF (composição — não acessa tabela interna)                   │
│  bff/web-bff (:3200/v1)  bff/mobile-bff (:3201/v1)             │
└────────────────────────────┬────────────────────────────────────┘
                             │ NestJS modules
┌────────────────────────────▼────────────────────────────────────┐
│  DOMÍNIOS (46 scaffold + core-bank)                             │
│  domains/core-bank ← ledger, payments, pix, reconciliation      │
│  domains/{identity,pix,accounts,...} ← port/adapter boundaries  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  INFRA                                                          │
│  PostgreSQL (regenera_core_test)  Redis (BullMQ outbox-relay)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pacotes implantáveis (evidência hash)

| Pacote | Path | Test log |
|--------|------|----------|
| core-bank | `domains/core-bank/` | `artifacts/verification/full-ci/run1/unit/34-034-unit-test-core-bank.log` — **198 pass, 1 skip** |
| web-bff | `bff/web-bff/` | `artifacts/verification/full-ci/run1/unit/35-035-unit-test-web-bff.log` — **35 pass** |
| web-banking | `apps/web-banking/` | `artifacts/verification/full-ci/run1/unit/36-036-unit-test-web-banking.log` — **8 pass** |
| outbox-relay | `workers/outbox-relay/` | `artifacts/verification/full-ci/run1/queue/38-038-queue-test-redis.log` — **5 pass** |
| e2e-web | `quality/e2e-web/` | `artifacts/verification/full-ci/run1/e2e/47-047-e2e-playwright.log` — **4 pass** |

**Implantable manifest:** `artifacts/verification/full-ci/run1/hash/implantable-sources.sha256` (221 linhas, SHA256 `4e4c3b07…`).

---

## Contratos

| Contrato | Path |
|----------|------|
| Web BFF OpenAPI | `contracts/openapi/web-banking-v1.yaml` |
| Platform API | `contracts/openapi/regenera-bank-v1.openapi.yaml` |
| Partner API | `contracts/openapi/partner-api-v1.openapi.yaml` |
| Events | `contracts/asyncapi/regenera-events-v1.asyncapi.yaml` |

---

## Design System (multi-canal)

| Canal | Path | Tokens |
|-------|------|--------|
| Web Storybook | `design-system/web/` | Manrope, `#22d3ee`, `#020617` |
| Android | `apps/android/core-design/` | `RegeneraTokens.kt` |
| iOS | `design-system/ios/Sources/RegeneraDesign/` | `Color+Regenera.swift` |
| Windows | `design-system/windows/` | `RegeneraTokens.xaml` |
| Protótipo HTML | `desing-final-escolhido-geral-index.html` | Fonte canônica visual |

---

## Workers e filas

- **Outbox relay:** `workers/outbox-relay/` — BullMQ + Redis, 5 testes IT (`38-038-queue-test-redis.log`)
- **Postgres IT:** 14 testes (`37-037-integration-test-postgres.log`)
- **Migrations:** V001/V002 aplicadas (`integration/9-009-migrations.log` exit 0)

---

## Referências

- Comando mestre: `AGENTS.md`
- Scaffold manifest: `domains/SCAFFOLD-MANIFEST.json` (46 domínios, 602 arquivos)
- Auditoria independente: `docs/audit/19-INDEPENDENT-FINAL-AUDIT.md` (NO-GO — security gates)