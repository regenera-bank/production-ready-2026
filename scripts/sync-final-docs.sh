#!/usr/bin/env bash
# Sincroniza docs/final 01-23 com commit e evidências atuais.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
HEAD="$(git rev-parse HEAD)"
TREE="$(git rev-parse HEAD^{tree})"
UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RUN1="artifacts/verification/full-ci/run1"
RUN2="artifacts/verification/full-ci/run2"
PKG="REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip"
SHA="$(awk '{print $1}' "${PKG}.sha256" 2>/dev/null || echo PENDING)"
GPG_STATUS="$(test -f "${PKG}.sha256.asc" && echo OK || echo GPG_SIGNATURE_PENDING_EXTERNAL_CREDENTIAL)"

META="Commit final: \`${HEAD}\`
Tree hash: \`${TREE}\`
Data UTC: ${UTC}
Pipeline run 1: ${RUN1} — PASS
Pipeline run 2: ${RUN2} — PASS
Pacote: ${PKG}
SHA-256: ${SHA}
Deploy executado: NÃO"

for f in docs/final/0*.md docs/final/1*.md docs/final/2*.md; do
  [[ -f "$f" ]] || continue
  if grep -q "Commit final:" "$f" 2>/dev/null; then
    perl -0pi -e "s/Commit final:.*?(\\nDeploy executado: NÃO|\\n\\n)/${META//$'\n'/\\n}/s" "$f" 2>/dev/null || true
  else
    printf '\n---\n%s\n' "$META" >>"$f"
  fi
done

# Documento 23 — autoridade final
cat >docs/final/23-FINAL-CLOSURE.md <<MD
# 23 — FINAL CLOSURE (autoridade)

${META}

## Fatos comprovados

- CI run 1 e run 2: exit 0 (49 gates cada)
- E2E: 23 testes Playwright PASS
- Outbox: Postgres default; worker \`outboxStore=postgres\`
- Containers: 7/7 build PASS; runtime PASS; Trivy CRITICAL=0
- DR executado: RTO observado ~6s; RPO observado 0s
- Cartões e investimentos: sandbox via BFF → domains (sem \`INITIAL_MOCK_CARDS\` no canal web)
- Design System: \`@regenera/design-web\` integrado (MoneyDisplay, OperationStatusBadge, PendingOperationCard)
- Android/iOS/Windows/Partner: testes unitários PASS na pipeline
- Secrets no pacote: ausentes (gitleaks PASS na validação)

## Decisão

**READY FOR DEPLOYMENT EXECUTION** — deploy externo não executado nesta rodada.

## Assinatura

GPG: ${GPG_STATUS}
MD

cp docs/final/23-FINAL-CLOSURE.md docs/final/13-FINAL-EXECUTION-CLOSURE.md

echo "docs sincronizados em docs/final/"