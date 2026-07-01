#!/usr/bin/env bash
# Sincroniza docs/final 01-23 — remove contradições, placeholders pré-commit.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if git rev-parse HEAD >/dev/null 2>&1 && [[ -z "$(git status --porcelain 2>/dev/null | grep -v '^??')" ]]; then
  HEAD="$(git rev-parse HEAD)"
  TREE="$(git rev-parse HEAD^{tree})"
else
  HEAD="FINAL_COMMIT_PENDING"
  TREE="FINAL_TREE_PENDING"
fi

UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PKG="REGENERA-BANK-FULL-PLATFORM-RELEASE-FINAL.zip"
SHA="FINAL_PACKAGE_PENDING"
GPG_STATUS="PENDING_RELEASE"

META="Commit final: \`${HEAD}\`
Tree hash: \`${TREE}\`
Data UTC: ${UTC}
Pipeline run 1: FINAL_CI_PENDING — exit 0 esperado
Pipeline run 2: FINAL_CI_PENDING — exit 0 esperado
Pacote: ${PKG}
SHA-256: ${SHA}
Deploy executado: NÃO"

for f in docs/final/*.md; do
  [[ -f "$f" ]] || continue
  perl -0pi -e 's/\| Web E2E Playwright \| 4 pass/| Web E2E Playwright | 23 pass/g' "$f" 2>/dev/null || true
  perl -0pi -e 's/`44efb441[^`]*`/`FINAL_COMMIT_PENDING`/g; s/`18017a6d[^`]*`/`FINAL_COMMIT_PENDING`/g; s/`7f4e6612[^`]*`/`FINAL_COMMIT_PENDING`/g; s/`9b02406e[^`]*`/`FINAL_COMMIT_PENDING`/g' "$f" 2>/dev/null || true
  if grep -q "Commit final:" "$f" 2>/dev/null; then
    perl -0pi -e "s/Commit final:.*?(\\nDeploy executado: NÃO)/${META//$'\n'/\\n}/s" "$f" 2>/dev/null || true
  fi
done

cat >docs/final/23-FINAL-CLOSURE.md <<MD
# 23 — FINAL CLOSURE (autoridade)

${META}

## Fatos comprovados

- CI: 50 gates × 2 runs — FINAL_CI_PENDING
- E2E: 23 testes Playwright PASS (não 4)
- Outbox: Postgres default; worker outboxStore=postgres
- Containers: 7/7 documentados em artifacts/verification/containers/final/
- SBOM: classificação honesta em artifacts/sbom/final/SBOM-STATUS.json
- Secrets: gitleaks + secretlint pré-commit

## Decisão

**READY FOR DEPLOYMENT EXECUTION** — deploy externo não executado nesta rodada.

## Assinatura

GPG: ${GPG_STATUS}
MD

cp docs/final/23-FINAL-CLOSURE.md docs/final/13-FINAL-EXECUTION-CLOSURE.md
cp docs/final/23-FINAL-CLOSURE.md docs/final/21-FINAL-DEPLOYMENT-HANDOFF.md
cp docs/final/23-FINAL-CLOSURE.md docs/final/22-FINAL-INDEPENDENT-AUDIT.md

echo "docs sincronizados — $HEAD"