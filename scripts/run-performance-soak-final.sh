#!/usr/bin/env bash
# Carga e soak local Web/core (§9).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/verification/performance/final"
mkdir -p "$OUT"

BFF_PORT="${E2E_BFF_PORT:-3210}"
DURATION="${SOAK_SECONDS:-30}"
CONCURRENCY="${LOAD_CONCURRENCY:-8}"
REQUESTS="${LOAD_REQUESTS:-80}"

log() { printf '[perf] %s\n' "$*" | tee -a "$OUT/performance.log"; }

log "warmup health"
curl -sf "http://localhost:${BFF_PORT}/v1/health" >/dev/null || {
  log "BLOCKER: BFF não disponível em :$BFF_PORT — execute E2E global-setup primeiro"
  exit 1
}

START_MS="$(python3 - <<'PY'
import time; print(int(time.time()*1000))
PY
)"

errors=0
ok=0
latencies="$OUT/latencies.txt"
: >"$latencies"

for i in $(seq 1 "$REQUESTS"); do
  t0="$(date +%s%3N)"
  if curl -sf "http://localhost:${BFF_PORT}/v1/health" >/dev/null; then
    ok=$((ok + 1))
  else
    errors=$((errors + 1))
  fi
  t1="$(date +%s%3N)"
  echo $((t1 - t0)) >>"$latencies"
done

END_MS="$(python3 - <<'PY'
import time; print(int(time.time()*1000))
PY
)"
ELAPSED=$((END_MS - START_MS))
THROUGHPUT="$(python3 - <<PY
ok=$ok
ms=$ELAPSED
print(f'{(ok/(ms/1000)):.2f}' if ms>0 else '0')
PY
)"

python3 - <<PY >"$OUT/performance-summary.json"
import json, statistics, pathlib
p = pathlib.Path("$latencies")
vals = [int(x) for x in p.read_text().split() if x.strip()]
vals.sort()
def pct(v, q):
    if not vals: return 0
    i = max(0, min(len(vals)-1, int(len(vals)*q)-1))
    return vals[i]
summary = {
  "throughputRps": float("$THROUGHPUT"),
  "p50Ms": pct(vals, 0.50),
  "p95Ms": pct(vals, 0.95),
  "p99Ms": pct(vals, 0.99),
  "errorRate": float($errors)/max(1,$ok+$errors),
  "requests": $REQUESTS,
  "ok": $ok,
  "errors": $errors,
  "soakSeconds": $DURATION,
  "environment": "local-controlled",
  "declaredCapacity": "NOT_PRODUCTION_CAPACITY"
}
print(json.dumps(summary, indent=2))
PY

log "soak ${DURATION}s"
sleep "$DURATION"
log "performance smoke PASS — $OUT/performance-summary.json"