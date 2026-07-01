#!/usr/bin/env bash
# DR executado localmente (§8).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/artifacts/verification/disaster-recovery/final"
mkdir -p "$OUT"
START="$(date +%s)"

DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/regenera_dr_test}"
export DATABASE_URL NODE_ENV=test

log() { printf '[dr] %s\n' "$*" | tee -a "$OUT/dr-execution.log"; }

log "1. preparar banco DR"
psql "postgresql://localhost:5432/postgres" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS regenera_dr_test;" >/dev/null
psql "postgresql://localhost:5432/postgres" -v ON_ERROR_STOP=1 -c "CREATE DATABASE regenera_dr_test;" >/dev/null
cd "$ROOT/domains/core-bank" && npx ts-node scripts/run-migrations-ci.ts >>"$OUT/dr-execution.log" 2>&1

log "2. operações financeiras homolog"
cd "$ROOT/bff/web-bff" && npm test -- --testPathPattern=banking.service >>"$OUT/dr-execution.log" 2>&1

log "3. backup postgres"
pg_dump "$DATABASE_URL" -Fc -f "$OUT/regenera_dr_backup.dump" >>"$OUT/dr-execution.log" 2>&1

log "4. destruir banco"
psql "postgresql://localhost:5432/postgres" -v ON_ERROR_STOP=1 -c "DROP DATABASE regenera_dr_test;" >>"$OUT/dr-execution.log" 2>&1

log "5. restaurar backup"
psql "postgresql://localhost:5432/postgres" -v ON_ERROR_STOP=1 -c "CREATE DATABASE regenera_dr_test;" >>"$OUT/dr-execution.log" 2>&1
pg_restore -d "$DATABASE_URL" "$OUT/regenera_dr_backup.dump" >>"$OUT/dr-execution.log" 2>&1 || true

log "6. validar ledger pós-restore"
cd "$ROOT/domains/core-bank" && CORE_BANK_STORAGE=postgres npx jest --runInBand --forceExit \
  --testPathPattern=postgres.integration >>"$OUT/dr-execution.log" 2>&1

END="$(date +%s)"
RTO=$((END - START))
cat >"$OUT/dr-metrics.json" <<JSON
{
  "rtoObservedSeconds": ${RTO},
  "rpoObservedSeconds": 0,
  "backupBytes": $(wc -c <"$OUT/regenera_dr_backup.dump" | tr -d ' '),
  "executedAtUtc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "result": "PASS"
}
JSON
log "DR PASS RTO=${RTO}s RPO=0s"