# 09 — External Blockers Consolidated

**HEAD:** `44efb4413583bbc7cb108892cd1f060034c2bc19`  
**Template:** AGENTS.md §9

---

## Bloqueios institucionais (todos os domínios)

| Item | Provider | Status | Nota |
|------|----------|--------|------|
| HSM / KMS | AWS CloudHSM + KMS | **EXTERNAL_ACTIVATION_REQUIRED** | Credenciais institucionais |
| IAM corporativo | AWS IAM / GKE Workload | **EXTERNAL_ACTIVATION_REQUIRED** | Conta corporativa |
| Certificado ICP-Brasil A3 | AC credenciada | **EXTERNAL_ACTIVATION_REQUIRED** | PJ + token físico |
| Homologação SPI/DICT | BACEN | **REGULATORY_ACTIVATION_REQUIRED** | Participação direta exige licença IP |
| Licença IP Res. 80/2021 | BACEN | **REGULATORY_ACTIVATION_REQUIRED** | Processo + patrimônio mínimo |
| Licença SCD Res. 4.656 | BACEN | **REGULATORY_ACTIVATION_REQUIRED** | Crédito direto |
| Parecer jurídico | Advogado especializado | **EXTERNAL_ACTIVATION_REQUIRED** | Interpretação Res. BACEN |
| SOC / SIEM | Datadog Security | **EXTERNAL_ACTIVATION_REQUIRED** | Contrato + integração |
| DR exercitado | Ambiente DR | **EXTERNAL_ACTIVATION_REQUIRED** | RTO medido, relatório assinado |
| Banco correspondente | Parceiro bancário | **EXTERNAL_ACTIVATION_REQUIRED** | Conta liquidação |
| Pentest externo | Empresa especializada | **EXTERNAL_ACTIVATION_REQUIRED** | Relatório + mitigação |
| Revisão independente | Auditor externo | **EXTERNAL_ACTIVATION_REQUIRED** | Quem fez não aprova |

---

## Bloqueios por domínio (production adapter)

Todos os 46 domínios scaffold seguem o padrão:

```
simulator  → ACTIVE_INTERNAL
sandbox    → ACTIVE_SANDBOX
production → EXTERNAL_ACTIVATION_REQUIRED (ou REGULATORY para crypto)
```

**Evidência:** `domains/*/README.md` — gerado por `scripts/scaffold-domains.mjs`.

**Exceção crypto:** `REGULATORY_ACTIVATION_REQUIRED` + flags `CRYPTO_ENABLED=false` (`governance/feature-flags/FEATURE-FLAGS.json`).

---

## Bloqueios de canal

| Canal | Bloqueador | Evidence |
|-------|------------|----------|
| Android | JDK 17 + Gradle + SDK 35 | `apps/android/EXTERNAL_EXECUTION_REQUIRED.md` |
| iOS | Xcode build toolchain | não no CI agente |
| Windows Ops | .NET/WinUI runtime | tokens only em `design-system/windows/` |
| Deploy GCP | Rotação secrets | `docs/audit/19-INDEPENDENT-FINAL-AUDIT.md` B-05 |

---

## Bloqueios de infraestrutura worker

| Item | Status | Evidence |
|------|--------|----------|
| Outbox Postgres store em prod | **PASS (código)** | `workers/outbox-relay/src/resolve-outbox-store.ts` — fail-closed sem `DATABASE_URL` |
| Load test 50k/dia | **EXTERNAL_ACTIVATION_REQUIRED** | skipped em `TEST-RESULTS.txt` |

---

## Distinção honesta

- **Baseline:** implementado + verificado localmente (simulator/postgres test)  
- **Produção:** exige itens desta lista — nunca declarar resolvido sem evidência no pacote