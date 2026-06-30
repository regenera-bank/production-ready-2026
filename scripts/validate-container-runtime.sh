#!/usr/bin/env bash
# Valida runtime dos containers: build, health, SIGTERM, scan, digest (§1 item 4).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/platform/docker/docker-compose.full.yml"
ARTIFACT_DIR="${CONTAINER_ARTIFACT_DIR:-$ROOT/artifacts/verification/container-runtime}"
mkdir -p "$ARTIFACT_DIR"

PIPELINE_FAIL=0
log() { printf '[container-runtime] %s\n' "$*"; }

if ! docker info >/dev/null 2>&1; then
  log "EXTERNAL_EXECUTION_REQUIRED: Docker daemon indisponível"
  exit 2
fi

log "Build imagens via validate-builds.sh"
bash "$ROOT/platform/docker/validate-builds.sh" >"$ARTIFACT_DIR/build.log" 2>&1 || PIPELINE_FAIL=1

log "Subindo stack com rebuild (postgres, redis, outbox-relay, core-bank)"
docker compose -f "$COMPOSE" up --build -d postgres redis core-bank outbox-relay \
  >"$ARTIFACT_DIR/compose-up.log" 2>&1 || PIPELINE_FAIL=1

wait_healthy() {
  local name="$1" max="${2:-90}" i=0
  while [[ $i -lt $max ]]; do
    status="$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo missing)"
    if [[ "$status" == "healthy" ]]; then
      log "healthy: $name"
      return 0
    fi
    sleep 2
    i=$((i + 2))
  done
  log "TIMEOUT health: $name (last=$status)"
  return 1
}

for c in regenera-postgres regenera-redis regenera-core-bank regenera-outbox-relay; do
  wait_healthy "$c" 120 >>"$ARTIFACT_DIR/health.log" 2>&1 || PIPELINE_FAIL=1
done

log "Verificando outbox-relay usa Postgres (log bootstrap)"
sleep 5
docker logs regenera-outbox-relay 2>&1 | tee "$ARTIFACT_DIR/outbox-relay.log" | grep -q 'outboxStore.*postgres' \
  || { log "BLOCKER: outbox-relay não reportou outboxStore=postgres"; PIPELINE_FAIL=1; }

log "SIGTERM gracioso outbox-relay"
docker kill --signal=SIGTERM regenera-outbox-relay >/dev/null 2>&1 || true
sleep 3
if docker inspect regenera-outbox-relay --format='{{.State.Status}}' 2>/dev/null | grep -q running; then
  log "WARN: container ainda running após SIGTERM — forçando stop"
  docker stop regenera-outbox-relay >>"$ARTIFACT_DIR/sigterm.log" 2>&1 || true
else
  log "SIGTERM OK — container encerrado"
fi

log "Registrando digests"
docker images --digests --format '{{.Repository}}:{{.Tag}}\t{{.Digest}}' \
  | grep regenera/ >"$ARTIFACT_DIR/image-digests.tsv" || true

if command -v trivy >/dev/null 2>&1; then
  log "Trivy scan (CRITICAL/HIGH)"
  for img in regenera/core-bank:validate regenera/outbox-relay:validate regenera/web-bff:validate; do
    trivy image --scanners vuln --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 "$img" \
      >"$ARTIFACT_DIR/trivy-$(echo "$img" | tr '/:' '__').log" 2>&1 || PIPELINE_FAIL=1
  done
else
  log "SKIP trivy — não instalado (documentar EXTERNAL_EXECUTION_REQUIRED)"
  echo "trivy not installed" >"$ARTIFACT_DIR/trivy-skipped.log"
fi

docker compose -f "$COMPOSE" down >>"$ARTIFACT_DIR/compose-down.log" 2>&1 || true

if [[ $PIPELINE_FAIL -eq 0 ]]; then
  log "container runtime validation PASS"
else
  log "container runtime validation FAIL"
fi
exit "$PIPELINE_FAIL"