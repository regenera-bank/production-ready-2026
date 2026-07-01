#!/usr/bin/env bash
# Orquestrador fechamento definitivo pré-deploy.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ART="$ROOT/artifacts/verification/final-closure"
mkdir -p "$ART"
LOG="$ART/closure.log"
exec > >(tee -a "$LOG") 2>&1

echo "=== FINAL CLOSURE $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "HEAD=$(git rev-parse HEAD) TREE=$(git rev-parse 'HEAD^{tree}')"

bash scripts/run-full-platform-ci.sh || exit 1
bash scripts/generate-final-sbom.sh || exit 1
bash scripts/validate-containers-final.sh || exit 1
bash scripts/run-disaster-recovery-final.sh || exit 1
bash scripts/run-performance-soak-final.sh || exit 1
bash scripts/create-release-candidate.sh || exit 1
bash scripts/validate-package-from-extract.sh REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip || exit 1

echo "=== FINAL CLOSURE PASS ==="