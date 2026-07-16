#!/usr/bin/env bash
# Sobe BFF + Vite e mantém o terminal preso até Ctrl+C.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web-banking"
BFF="$ROOT/bff/web-bff"
MOBILE="$ROOT/bff/mobile-bff"
OPS="$ROOT/bff/operations-bff"
CORE="$ROOT/domains/core-bank"
WEB_PORT="${VITE_PORT:-5176}"
BFF_PORT="${PORT:-3200}"
MOBILE_PORT="${MOBILE_BFF_PORT:-3201}"
OPS_PORT="${OPS_BFF_PORT:-3202}"
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

echo "Regenera dev:canal-web — Web BFF + Mobile BFF + Ops BFF + Web Banking"
echo ""

echo "▶ Liberar portas de dev"
node "$ROOT/scripts/free-dev-ports.mjs"

echo "▶ Dependências web-banking"
(cd "$WEB" && npm install)

echo "▶ Dependências BFF"
(cd "$BFF" && npm install)
(cd "$MOBILE" && npm install)
if [ -f "$OPS/package.json" ]; then
  (cd "$OPS" && npm install)
fi

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
  if [ -f .env.local ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env.local
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

echo "▶ Iniciando mobile-bff (:${MOBILE_PORT})"
(
  cd "$MOBILE"
  export PORT="$MOBILE_PORT"
  export WEB_BFF_BASE_URL="http://localhost:${BFF_PORT}/v1"
  exec npm run dev
) &

for _ in $(seq 1 30); do
  if curl -sf "http://localhost:${MOBILE_PORT}/v1/health" 2>/dev/null | grep -q '"status":"ok"'; then
    echo "✓ mobile-bff online"
    break
  fi
  sleep 1
done

if [ -f "$OPS/package.json" ]; then
  echo "▶ Iniciando operations-bff (:${OPS_PORT})"
  (
    cd "$OPS"
    export PORT="$OPS_PORT"
    export CORE_API_BASE_URL="http://localhost:3100/v1"
    exec npm run dev 2>/dev/null || exec npx tsx watch src/main.ts
  ) &
fi

echo "▶ Iniciando Vite em ${WEB_URL}"
echo ""
echo "  Web UI:    ${WEB_URL}"
echo "  Web BFF:   http://localhost:${BFF_PORT}/v1/health"
echo "  Mobile:    http://localhost:${MOBILE_PORT}/v1/health"
echo "  Ops BFF:   http://localhost:${OPS_PORT}/v1/health"
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
    export VITE_GOOGLE_OAUTH_CLIENT_ID="${GOOGLE_OAUTH_CLIENT_ID:-}"
  fi
  if [ -f "$BFF/.env.local" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$BFF/.env.local"
    set +a
    export VITE_GOOGLE_OAUTH_CLIENT_ID="${GOOGLE_OAUTH_CLIENT_ID:-$VITE_GOOGLE_OAUTH_CLIENT_ID}"
  fi
  # Didit: sem Firebase no browser. Fallback legado: KYC_PROVIDER=firebase em .env.local
  if [ "${KYC_PROVIDER:-}" = "didit" ]; then
    export VITE_FIREBASE_API_KEY=""
    export VITE_FIREBASE_AUTH_DOMAIN=""
    export VITE_FIREBASE_PROJECT_ID=""
    export VITE_FIREBASE_STORAGE_BUCKET=""
    export VITE_FIREBASE_MESSAGING_SENDER_ID=""
    export VITE_FIREBASE_APP_ID=""
    export VITE_FIREBASE_MEASUREMENT_ID=""
  elif [ -f "$BFF/.env" ]; then
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