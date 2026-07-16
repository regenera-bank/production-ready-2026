#!/usr/bin/env bash
# Reinicia web-bff (:3200) e mobile-bff (:3201) locais preservando o env do
# processo chamador — usado pelo passo 18 da prova final (§43).
# Os dados NÃO podem depender dos processos: tudo que importa está no PostgreSQL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${PROOF_LOG_DIR:-$ROOT/artifacts/prova-final}"
mkdir -p "$LOG_DIR"

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    [[ -n "$pids" ]] && echo "$pids" | xargs kill -KILL 2>/dev/null || true
  fi
}

echo "[restart-stack] derrubando :3200 e :3201"
kill_port 3200
kill_port 3201
sleep 1

echo "[restart-stack] subindo web-bff (node dist/main.js)"
(cd "$ROOT/bff/web-bff" && nohup node dist/main.js >>"$LOG_DIR/web-bff-restarted.log" 2>&1 &)

echo "[restart-stack] subindo mobile-bff (node dist/server.js)"
(cd "$ROOT/bff/mobile-bff" && nohup node dist/server.js >>"$LOG_DIR/mobile-bff-restarted.log" 2>&1 &)

for i in $(seq 1 60); do
  if curl -sf http://localhost:3200/v1/health/ready >/dev/null 2>&1 \
     && curl -sf http://localhost:3201/health/ready >/dev/null 2>&1; then
    echo "[restart-stack] BFFs prontos após restart"
    exit 0
  fi
  sleep 2
done
echo "[restart-stack] TIMEOUT — BFFs não voltaram" >&2
exit 1
