#!/usr/bin/env bash
# SBOM CycloneDX transitivo para pacotes finais (§5).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/sbom/final"
mkdir -p "$OUT"

declare -A PKG_DIRS=(
  [core-bank]="domains/core-bank"
  [web-bff]="bff/web-bff"
  [outbox-relay]="workers/outbox-relay"
  [web-banking]="apps/web-banking"
  [mobile-bff]="bff/mobile-bff"
  [operations-bff]="bff/operations-bff"
  [partner-api-facade]="bff/partner-api-facade"
  [partner-developer-portal]="apps/partner-developer-portal"
  [design-web]="design-system/web"
  [e2e-web]="quality/e2e-web"
)

generate_one() {
  local name="$1" dir="$2"
  local target="$OUT/sbom-${name}.json"
  local fallback="$OUT/sbom-${name}.PARTIAL_DECLARED_DEPENDENCIES_ONLY.json"
  cd "$ROOT/$dir"
  if [[ ! -f package.json ]]; then
    echo "SKIP missing $dir" >&2
    return 0
  fi
  npm install --ignore-scripts >/dev/null 2>&1 || true
  if npx --yes @cyclonedx/cyclonedx-npm --output-file "$target" 2>"$OUT/sbom-${name}.err.log"; then
    echo "OK cyclonedx $name"
    return 0
  fi
  bash "$ROOT/scripts/generate-sbom.sh" "$fallback"
  echo "FALLBACK $name -> PARTIAL_DECLARED_DEPENDENCIES_ONLY"
}

for name in "${!PKG_DIRS[@]}"; do
  generate_one "$name" "${PKG_DIRS[$name]}"
done

(
  cd "$OUT"
  shasum -a 256 sbom-*.json 2>/dev/null | LC_ALL=C sort >SBOM-MANIFEST.sha256
)
echo "SBOM manifest: $OUT/SBOM-MANIFEST.sha256"