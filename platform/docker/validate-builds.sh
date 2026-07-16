#!/usr/bin/env bash
# Valida todas as imagens Frente 16 — requer Docker daemon ativo.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! docker info >/dev/null 2>&1; then
  echo "EXTERNAL_EXECUTION_REQUIRED: Docker daemon indisponível."
  echo "Inicie Docker Desktop e execute: bash platform/docker/validate-builds.sh"
  exit 2
fi

IMAGES=(
  "platform/docker/Dockerfile.core-bank:regenera/core-bank:validate"
  "platform/docker/Dockerfile.web-bff:regenera/web-bff:validate"
  "platform/docker/Dockerfile.mobile-bff:regenera/mobile-bff:validate"
  "platform/docker/Dockerfile.operations-bff:regenera/operations-bff:validate"
  "platform/docker/Dockerfile.partner-api-facade:regenera/partner-api-facade:validate"
  "platform/docker/Dockerfile.outbox-relay:regenera/outbox-relay:validate"
  "platform/docker/Dockerfile.web-banking:regenera/web-banking:validate"
)

FAILED=0
for entry in "${IMAGES[@]}"; do
  dockerfile="${entry%%:*}"
  tag="${entry#*:}"
  echo "==> docker build -f $dockerfile -t $tag ."
  if docker build -f "$dockerfile" -t "$tag" .; then
    echo "PASS $tag"
  else
    echo "FAIL $tag"
    FAILED=1
  fi
done

exit "$FAILED"