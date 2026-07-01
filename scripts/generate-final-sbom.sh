#!/usr/bin/env bash
# SBOM CycloneDX transitivo para pacotes finais (§5).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/sbom/final"
mkdir -p "$OUT"

PKG_NAMES=(
  core-bank web-bff outbox-relay web-banking mobile-bff operations-bff
  partner-api-facade partner-developer-portal design-web e2e-web
)
PKG_DIRS=(
  domains/core-bank bff/web-bff workers/outbox-relay apps/web-banking bff/mobile-bff
  bff/operations-bff bff/partner-api-facade apps/partner-developer-portal
  design-system/web quality/e2e-web
)

generate_one() {
  local name="$1" dir="$2"
  local target="$OUT/sbom-${name}.json"
  local fallback="$OUT/sbom-${name}.PARTIAL_DECLARED_DEPENDENCIES_ONLY.json"
  if [[ ! -f "$ROOT/$dir/package.json" ]]; then
    echo "SKIP missing $dir" >&2
    return 0
  fi
  cd "$ROOT/$dir"
  npm install --ignore-scripts >/dev/null 2>&1 || true
  if npx --yes @cyclonedx/cyclonedx-npm --output-file "$target" 2>"$OUT/sbom-${name}.err.log"; then
    echo "OK cyclonedx $name"
    return 0
  fi
  bash "$ROOT/scripts/generate-sbom.sh" "$fallback"
  echo "FALLBACK $name -> PARTIAL_DECLARED_DEPENDENCIES_ONLY"
}

idx=0
while [[ $idx -lt ${#PKG_NAMES[@]} ]]; do
  generate_one "${PKG_NAMES[$idx]}" "${PKG_DIRS[$idx]}"
  idx=$((idx + 1))
done

(
  cd "$OUT"
  shasum -a 256 sbom-*.json 2>/dev/null | LC_ALL=C sort >SBOM-MANIFEST.sha256
)
echo "SBOM manifest: $OUT/SBOM-MANIFEST.sha256"