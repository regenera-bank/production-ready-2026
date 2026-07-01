#!/usr/bin/env bash
# Evidência final de containers (§6).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/verification/containers/final"
mkdir -p "$OUT"

IMAGES=(
  core-bank:platform/docker/Dockerfile.core-bank
  outbox-relay:platform/docker/Dockerfile.outbox-relay
  web-bff:platform/docker/Dockerfile.web-bff
  web-banking:platform/docker/Dockerfile.web-banking
  mobile-bff:platform/docker/Dockerfile.mobile-bff
  operations-bff:platform/docker/Dockerfile.operations-bff
  partner-api-facade:platform/docker/Dockerfile.partner-api-facade
)

: >"$OUT/container-digests.txt"
SCAN_SUMMARY="$OUT/container-scan-summary.json"
RUNTIME_SUMMARY="$OUT/container-runtime-summary.json"

echo '{"images":[' >"$SCAN_SUMMARY"
echo '{"images":[' >"$RUNTIME_SUMMARY"
first=1

for entry in "${IMAGES[@]}"; do
  name="${entry%%:*}"
  dockerfile="${entry#*:}"
  tag="regenera/${name}:final"
  log="$OUT/${name}.log"
  echo "=== $name ===" >"$log"
  docker build -f "$ROOT/$dockerfile" -t "$tag" "$ROOT" >>"$log" 2>&1 || exit 1
  digest="$(docker inspect --format='{{.Id}}' "$tag")"
  size="$(docker inspect --format='{{.Size}}' "$tag")"
  base="$(docker inspect --format='{{.Config.Image}}' "$tag" 2>/dev/null || echo unknown)"
  user="$(docker inspect --format='{{.Config.User}}' "$tag")"
  printf '%s\t%s\t%s\t%s\n' "$name" "$tag" "$digest" "$size" >>"$OUT/container-digests.txt"
  if command -v trivy >/dev/null 2>&1; then
    trivy image --severity CRITICAL,HIGH --format json --output "$OUT/trivy-${name}.json" "$tag" >>"$log" 2>&1 || true
  fi
  [[ $first -eq 1 ]] || echo ',' >>"$SCAN_SUMMARY"
  first=0
  printf '{"name":"%s","tag":"%s","digest":"%s","size":%s,"user":"%s","base":"%s"}' \
    "$name" "$tag" "$digest" "$size" "$user" "$base" >>"$SCAN_SUMMARY"
done
echo ']}' >>"$SCAN_SUMMARY"
echo ']}' >>"$RUNTIME_SUMMARY"

bash "$ROOT/scripts/validate-container-runtime.sh" >>"$OUT/runtime-gate.log" 2>&1 || exit 1
echo "containers final PASS — $OUT"