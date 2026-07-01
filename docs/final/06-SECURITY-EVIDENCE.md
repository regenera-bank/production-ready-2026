# 06 — Security Evidence

| Scan | Comando | Exit | Log |
|------|---------|------|-----|
| Gitleaks core-bank | `gitleaks detect --config .gitleaks.toml` | 0 | `full-ci/run1/security/*gitleaks-core-bank*` |
| Gitleaks web-bff | idem | 0 | `full-ci/run1/security/*gitleaks-bff*` |
| Secretlint | `@secretlint/quick-start` | 0 | `full-ci/run1/security/*secretlint*` |
| Runtime audit core-bank | `scripts/npm-audit-runtime.sh` | 0 | critical=0 high=0 |
| Runtime audit web-bff | idem | 0 | critical=0 high=0 |
| SBOM | cyclonedx-npm ×4 | 0 | `full-ci/run1/security/sbom-*.json` |

Secrets no tree: 0 `.env` (apenas `.env.example`). Quarentena: `.local-credentials/regenera-bank/`.
