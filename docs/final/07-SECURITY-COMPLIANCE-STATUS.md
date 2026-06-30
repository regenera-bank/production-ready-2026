# 07 — Security & Compliance Status

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`  
**CI security stage:** `artifacts/verification/full-ci/run1/matrix-manifest.json` → **16 pass / 2 fail**

---

## Gates de segurança (run1)

| Gate | Exit | Log |
|------|------|-----|
| gitleaks core-bank | 0 | `security/10-010-secret-scan-gitleaks-domains-core-bank.log` |
| gitleaks web-bff | 0 | `security/12-012-secret-scan-gitleaks-bff-web-bff.log` |
| gitleaks web-banking | 0 | `security/14-014-secret-scan-gitleaks-apps-web-banking.log` |
| secretlint (3 pacotes) | 0 | `security/11,13,15-*.log` |
| npm audit core-bank | **1** | `security/20-020-audit-npm-core-bank.log` — moderate transitive (@nestjs/cli) |
| npm audit web-bff | **1** | `security/22-022-audit-npm-web-bff.log` — high/moderate transitive |
| npm audit web-banking | 0 | `security/26-026-audit-npm-web-banking.log` — 0 vulns |
| npm audit outbox-relay | 0 | `security/24-024-audit-npm-outbox-relay.log` |
| SBOM (4 pacotes) | 0 | `security/sbom-*.json` |
| security-test BFF | 0 | `security/40-040-security-test-web-bff.log` |
| security-test core-bank | 0 | `security/39-039-security-test-core-bank.log` |

**Status global segurança:** **FAIL** — bloqueia deploy (`docs/audit/19-INDEPENDENT-FINAL-AUDIT.md` NO-GO).

---

## Compliance financeiro (implementado)

| Regra | Status | Evidence |
|-------|--------|----------|
| Money BigInt (no float) | **ACTIVE_INTERNAL** | `money.value-object.spec.ts`, `load/float-guard.spec.ts` |
| Ledger append-only | **ACTIVE_INTERNAL** | DB triggers V001, `ledger.spec.ts` |
| Idempotency hash payload | **ACTIVE_INTERNAL** | `idempotency.spec.ts` |
| UNKNOWN sagrado | **ACTIVE_INTERNAL** | `payment-engine.spec.ts` T38 |
| PII redaction BFF | **ACTIVE_INTERNAL** | `bff/web-bff/src/common/pii-redaction.spec.ts` |
| Production KYC guard | **ACTIVE_INTERNAL** | `production-kyc-guard.spec.ts` |

---

## Bloqueios regulatórios

| Obrigação | Regulation | Status |
|-----------|------------|--------|
| REG-001 IP Pagamento | Res. BACEN 80/2021 | **REGULATORY_ACTIVATION_REQUIRED** |
| REG-003 SCD | Res. BACEN 4.656/2018 | **REGULATORY_ACTIVATION_REQUIRED** |
| REG-004 Pix SPI/DICT | Manual Pix BACEN | **REGULATORY_ACTIVATION_REQUIRED** |
| REG-006 PCI-DSS | PCI SSC v4 | **EXTERNAL_ACTIVATION_REQUIRED** |
| REG-007 AML | Res. BACEN 4.753/2019 | **ACTIVE_INTERNAL** (policy scaffold) |

**CSV:** `domains/core-bank/governance/REGULATORY-TRACEABILITY.csv`

---

## Secrets & rotação

| Item | Status |
|------|--------|
| `.env` na raiz | Removido — quarentena `.local-credentials/` |
| Rotação pré-deploy | **EXTERNAL_ACTIVATION_REQUIRED** — `ROTATION_REQUIRED_BEFORE_DEPLOY` |
| GPG fingerprint | `730834AB4126C341A70F6B969826A3AC0BF6A90C` (AGENTS.md) |