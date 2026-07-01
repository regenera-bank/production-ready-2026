# 21 — FINAL DEPLOYMENT HANDOFF

Commit final: `9b02406eb46868a37c24776038e092f3bd228737`
Tree hash: `f603a0bebb013487e63ece608b51d67a52f19661`
Data UTC: 2026-07-01T00:22:00Z
Pipeline run 1: `artifacts/verification/full-ci/run1` — PASS (50 gates)
Pipeline run 2: `artifacts/verification/full-ci/run2` — PASS (50 gates)
Pacote: `REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip`
SHA-256: `a38c74fb4ee47f62fc26572d653d8e140aa9af41d0c58e078c041d7268a6da3c`
Deploy executado: NÃO

## Entregáveis

| Artefato | Path |
|----------|------|
| Release ZIP | `REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip` |
| SHA-256 | `REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip.sha256` |
| Manifest | `REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.manifest.json` |
| Provenance | `REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.provenance.json` |
| CI run 1 | `artifacts/verification/full-ci/run1/` |
| CI run 2 | `artifacts/verification/full-ci/run2/` |
| SBOM | `artifacts/sbom/final/` |
| Containers | `artifacts/verification/container-runtime/` |
| DR | `artifacts/verification/disaster-recovery/final/` |
| Performance | `artifacts/verification/performance/final/` |

## Bloqueios externos (inalterados)

SPI, DICT, BACEN, processador de cartões produtivo, broker, custodiante, KYC produtivo, pentest externo — `EXTERNAL_ACTIVATION_REQUIRED`.

## Decisão

**READY FOR DEPLOYMENT EXECUTION** — handoff técnico completo; execução de deploy permanece externa.