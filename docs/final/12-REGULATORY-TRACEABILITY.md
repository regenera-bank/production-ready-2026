# 12 — Regulatory Traceability

**HEAD:** `FINAL_COMMIT_PENDING`
**CSV canônico:** `domains/core-bank/governance/REGULATORY-TRACEABILITY.csv`
**Referência:** AGENTS.md §10

---

## Matriz de obrigações

| ID | Regulation | Resolution | Domain | Status | Evidence |
|----|------------|------------|--------|--------|----------|
| REG-001 | IP Modalidade Pagamento | Res. BACEN 80/2021 Art. 6 | Core Banking, Pix | **REGULATORY_ACTIVATION_REQUIRED** | SPI exige autorização — `integrations-spi` production adapter |
| REG-002 | Sigilo bancário | LC 105/2001 Art. 1 | Core + Security | **ACTIVE_INTERNAL** | PII redaction BFF — `pii-redaction.spec.ts` |
| REG-003 | SCD | Res. BACEN 4.656/2018 Art. 2 | credit | **REGULATORY_ACTIVATION_REQUIRED** | `domains/credit/README.md` |
| REG-004 | Pix Participante | Manual Pix BACEN Cap. 2 | pix, integrations-spi | **REGULATORY_ACTIVATION_REQUIRED** | E2E ID format em `pix-engine.spec.ts`; homolog pendente |
| REG-005 | LGPD | Lei 13.709/2018 Art. 7 | consent, customers | **ACTIVE_INTERNAL** (parcial) | `domains/consent/`, PIA pendente |
| REG-006 | PCI-DSS v4 | PCI SSC Req. 3 | cards, core-bank | **EXTERNAL_ACTIVATION_REQUIRED** | Tokenização cartão não ativa |
| REG-007 | AML | Res. BACEN 4.753/2019 Art. 2 | aml, fraud | **ACTIVE_INTERNAL** | `domains/aml/`, `domains/fraud/` simulator |
| REG-008 | Cybersecurity | Res. BACEN 4.658/2018 Art. 4 | security, platform | **ACTIVE_INTERNAL** (parcial) | secret scan verde; POCSEG pendente |

---

## Domínios com gate regulatório explícito

| Domain | Production status | Feature flags |
|--------|-------------------|---------------|
| crypto | **REGULATORY_ACTIVATION_REQUIRED** | `CRYPTO_ENABLED=false`, `CRYPTO_TRADING_LIVE=false` |
| integrations-spi | **EXTERNAL_ACTIVATION_REQUIRED** | SPI/DICT BACEN |
| pix | **EXTERNAL_ACTIVATION_REQUIRED** | delega core-bank + integrations-spi |
| credit | **EXTERNAL_ACTIVATION_REQUIRED** | SCD licença |

---

## ADRs relacionados

| ADR | Path |
|-----|------|
| Ledger append-only | `domains/core-bank/docs/adr/ADR-001-LEDGER-APPEND-ONLY.md` |
| Idempotência hash | `domains/core-bank/docs/adr/ADR-002-IDEMPOTENCIA-HASH-PAYLOAD.md` |
| Estado UNKNOWN | `domains/core-bank/docs/adr/ADR-003-ESTADO-UNKNOWN.md` |
| Enquadramento BACEN | `domains/core-bank/docs/adr/ADR-004-ENQUADRAMENTO-BACEN.md` |

---

## Control matrix

`domains/core-bank/governance/CONTROL-MATRIX.csv` — controles operacionais mapeados por módulo.
