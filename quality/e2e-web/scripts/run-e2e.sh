#!/usr/bin/env bash
# E2E isolado — evita exit 1 por BFF concorrente na porta 3210
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BFF_PORT="${E2E_BFF_PORT:-3210}"
WEB_PORT="${WEB_PORT:-5177}"
LOCK_DIR="${ROOT}/.tmp/e2e-web.lock.d"

mkdir -p "${ROOT}/.tmp"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "[e2e] ABORT: outra execução E2E em andamento ($LOCK_DIR)"
  echo "[e2e] Aguarde terminar ou remova o lock se processo morreu."
  exit 1
fi
cleanup_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup_lock EXIT INT TERM

for port in "$BFF_PORT" "$WEB_PORT"; do
  if lsof -ti :"$port" >/dev/null 2>&1; then
    echo "[e2e] liberando porta $port"
    lsof -ti :"$port" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done

cd "$ROOT/quality/e2e-web"
export CI=1
npx playwright test --reporter=line "$@"