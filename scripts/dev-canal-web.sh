#!/usr/bin/env bash
# Sobe BFF + Vite e mantém o terminal preso até Ctrl+C.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web-banking"
BFF="$ROOT/bff/web-bff"
CORE="$ROOT/domains/core-bank"
WEB_PORT="${VITE_PORT:-5176}"
BFF_PORT="${PORT:-3200}"
WEB_URL="http://localhost:${WEB_PORT}"
HEALTH_URL="http://localhost:${BFF_PORT}/v1/health"

cleanup() {
  echo ""
  echo "Encerrando serviços..."
  for pid in $(jobs -p); do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Regenera dev:canal-web — BFF + Web Banking"
echo ""

echo "▶ Liberar portas de dev"
node "$ROOT/scripts/free-dev-ports.mjs"

echo "▶ Dependências web-banking"
(cd "$WEB" && npm install)

echo "▶ Dependências BFF"
(cd "$BFF" && npm install)

if [ "${PULL_SECRETS:-}" = "1" ]; then
  echo "▶ Sincronizar secrets GCP → bff/web-bff/.env"
  node "$BFF/scripts/pull-secrets.mjs" || {
    echo "⚠ pull-secrets falhou — BFF sobe com .env atual"
  }
fi

echo "▶ Build core-bank"
(cd "$CORE" && npm run build)

echo "▶ Garantir dist do BFF"
node "$BFF/scripts/ensure-dist.mjs"
node "$BFF/scripts/verify-core-bank.mjs"

echo ""
echo "▶ Iniciando BFF (nest --watch) em background"
(
  cd "$BFF"
  export PORT="$BFF_PORT"
  if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
  fi
  exec npx nest start --watch
) &

echo "Aguardando ${HEALTH_URL} ..."
ready=0
for _ in $(seq 1 120); do
  if curl -sf "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "✗ BFF não respondeu a tempo."
  exit 1
fi

echo "✓ BFF online"
echo "▶ Iniciando Vite em ${WEB_URL}"
echo ""
echo "  Abra: ${WEB_URL}"
echo "  Mantenha ESTE terminal aberto. Ctrl+C para parar."
echo ""

(
  cd "$WEB"
  export VITE_PORT="$WEB_PORT"
  if [ -f "$BFF/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$BFF/.env"
    set +a
    export VITE_FIREBASE_API_KEY="${FIREBASE_API_KEY:-}"
    export VITE_FIREBASE_AUTH_DOMAIN="${FIREBASE_AUTH_DOMAIN:-}"
    export VITE_FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
    export VITE_FIREBASE_STORAGE_BUCKET="${FIREBASE_STORAGE_BUCKET:-}"
    export VITE_FIREBASE_MESSAGING_SENDER_ID="${FIREBASE_MESSAGING_SENDER_ID:-}"
    export VITE_FIREBASE_APP_ID="${FIREBASE_APP_ID:-}"
    export VITE_FIREBASE_MEASUREMENT_ID="${FIREBASE_MEASUREMENT_ID:-}"
  fi
  exec npx vite --port "$WEB_PORT" --strictPort
) &

wait