#!/usr/bin/env bash
# Reproducible pre-deploy CI gates — records cwd, runtime, timestamp, exit code, logs per command.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/domains/core-bank"
BFF="$ROOT/bff/web-bff"
WORKER="$ROOT/workers/outbox-relay"
WEB="$ROOT/apps/web-banking"

DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/regenera_core_test}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

CI_RUN_ID="${CI_RUN_ID:-1}"
CI_CLEAN_DB="${CI_CLEAN_DB:-$([ "$CI_RUN_ID" = "1" ] && echo 1 || echo 0)}"
ARTIFACT_DIR="${CI_ARTIFACT_DIR:-$ROOT/artifacts/verification/ci/run${CI_RUN_ID}}"

export DATABASE_URL REDIS_URL NODE_ENV="${NODE_ENV:-test}"

PIPELINE_FAIL=0
LAST_GATE_EXIT=0
GATE_SEQ=0
INSTALLED_CORE=0
INSTALLED_BFF=0
INSTALLED_WORKER=0
INSTALLED_WEB=0
POSTGRES_AVAILABLE=0
REDIS_AVAILABLE=0
MANIFEST_TSV="$ARTIFACT_DIR/gate-manifest.tsv"
MANIFEST_JSONL="$ARTIFACT_DIR/gate-manifest.jsonl"
RUN_META="$ARTIFACT_DIR/run-metadata.json"

mkdir -p "$ARTIFACT_DIR"/{infra,install,security,lint,typecheck,unit,integration,queue,build,e2e,hash}

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

init_manifest() {
  printf 'seq\tgate\tcwd\texit_code\tlog_path\ttimestamp\truntime\n' >"$MANIFEST_TSV"
  : >"$MANIFEST_JSONL"
}

record_gate() {
  local gate="$1" cwd="$2" exit_code="$3" log_path="$4" ts="$5"
  local runtime_json
  runtime_json="$(printf '{"node":"%s","npm":"%s","bash":"%s"}' "$(node -v 2>/dev/null || echo unknown)" "$(npm -v 2>/dev/null || echo unknown)" "${BASH_VERSION:-unknown}")"
  GATE_SEQ=$((GATE_SEQ + 1))
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$GATE_SEQ" "$gate" "$cwd" "$exit_code" "$log_path" "$ts" "$runtime_json" >>"$MANIFEST_TSV"
  printf '{"seq":%s,"gate":"%s","cwd":"%s","exit_code":%s,"log_path":"%s","timestamp":"%s","runtime":%s}\n' \
    "$GATE_SEQ" "$gate" "$cwd" "$exit_code" "$log_path" "$ts" "$runtime_json" >>"$MANIFEST_JSONL"
}

run_gate() {
  local gate="$1" cwd="$2"
  shift 2
  local slug ts log_dir log_path exit_code
  slug="$(echo "$gate" | tr '[:upper:]' '[:lower:]' | tr ' /:' '___')"
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  case "$gate" in
    infra-*|hash-*) log_dir="$ARTIFACT_DIR/infra" ;;
    install-*) log_dir="$ARTIFACT_DIR/install" ;;
    secret-*|audit-*|sbom-*) log_dir="$ARTIFACT_DIR/security" ;;
    lint-*) log_dir="$ARTIFACT_DIR/lint" ;;
    typecheck-*) log_dir="$ARTIFACT_DIR/typecheck" ;;
    unit-*) log_dir="$ARTIFACT_DIR/unit" ;;
    integration-*|migrations*) log_dir="$ARTIFACT_DIR/integration" ;;
    queue-*) log_dir="$ARTIFACT_DIR/queue" ;;
    security-test-*) log_dir="$ARTIFACT_DIR/security" ;;
    build-*) log_dir="$ARTIFACT_DIR/build" ;;
    e2e-*) log_dir="$ARTIFACT_DIR/e2e" ;;
    *) log_dir="$ARTIFACT_DIR" ;;
  esac

  log_path="$log_dir/${GATE_SEQ}-$(printf '%03d' "$GATE_SEQ")-${slug}.log"
  mkdir -p "$log_dir"

  {
    echo "=== GATE: $gate ==="
    echo "timestamp_utc: $ts"
    echo "cwd: $cwd"
    echo "command: $*"
    echo "node: $(node -v 2>/dev/null || echo missing)"
    echo "npm: $(npm -v 2>/dev/null || echo missing)"
    echo "DATABASE_URL: $DATABASE_URL"
    echo "REDIS_URL: $REDIS_URL"
    echo "CI_RUN_ID: $CI_RUN_ID CI_CLEAN_DB: $CI_CLEAN_DB"
    echo "--- stdout/stderr ---"
  } >"$log_path"

  set +e
  (cd "$cwd" && "$@") >>"$log_path" 2>&1
  exit_code=$?

  {
    echo "--- end ---"
    echo "exit_code: $exit_code"
  } >>"$log_path"

  record_gate "$gate" "$cwd" "$exit_code" "${log_path#$ROOT/}" "$ts"
  log "gate=$gate exit=$exit_code log=${log_path#$ROOT/}"

  LAST_GATE_EXIT=$exit_code
  if [[ $exit_code -ne 0 ]]; then
    PIPELINE_FAIL=1
  fi
  return 0
}

record_runtime() {
  local ts log_path
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log_path="$ARTIFACT_DIR/infra/runtime-versions.log"
  {
    echo "timestamp_utc: $ts"
    echo "uname: $(uname -a)"
    echo "node: $(node -v 2>/dev/null || echo missing)"
    echo "npm: $(npm -v 2>/dev/null || echo missing)"
    echo "bash: ${BASH_VERSION:-unknown}"
    echo "psql: $(psql --version 2>/dev/null || echo missing)"
    echo "redis-cli: $(redis-cli --version 2>/dev/null || echo missing)"
    echo "gitleaks: $(gitleaks version 2>/dev/null || echo missing)"
    echo "git: $(git --version 2>/dev/null || echo missing)"
    echo "DATABASE_URL: $DATABASE_URL"
    echo "REDIS_URL: $REDIS_URL"
    echo "CI_RUN_ID: $CI_RUN_ID"
    echo "CI_CLEAN_DB: $CI_CLEAN_DB"
    echo "ARTIFACT_DIR: $ARTIFACT_DIR"
  } >"$log_path"
  record_gate "runtime-versions" "$ROOT" 0 "${log_path#$ROOT/}" "$ts"
}

record_code_hash() {
  local ts log_path hash_path git_head git_tree combined_hash
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log_path="$ARTIFACT_DIR/hash/code-tested.log"
  hash_path="$ARTIFACT_DIR/hash/implantable-sources.sha256"

  git_head="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo 'NO_GIT')"
  git_tree="$(git -C "$ROOT" rev-parse 'HEAD^{tree}' 2>/dev/null || echo 'NO_GIT')"

  (
    cd "$ROOT"
    find \
      domains/core-bank/src domains/core-bank/db \
      bff/web-bff/src \
      workers/outbox-relay/src \
      apps/web-banking/src apps/web-banking/index.html \
      scripts \
      -type f 2>/dev/null | sort | while read -r f; do
      shasum -a 256 "$f"
    done
  ) >"$hash_path"

  combined_hash="$(shasum -a 256 "$hash_path" | awk '{print $1}')"

  {
    echo "timestamp_utc: $ts"
    echo "git_head: $git_head"
    echo "git_tree: $git_tree"
    echo "implantable_manifest: ${hash_path#$ROOT/}"
    echo "implantable_manifest_sha256: $combined_hash"
    echo "line_count: $(wc -l <"$hash_path" | tr -d ' ')"
  } >"$log_path"

  record_gate "code-hash" "$ROOT" 0 "${log_path#$ROOT/}" "$ts"
}

check_postgres() {
  local ts log_path exit_code
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log_path="$ARTIFACT_DIR/infra/postgres-check.log"
  set +e
  pg_isready -h localhost -p 5432 >>"$log_path" 2>&1
  exit_code=$?
  if [[ $exit_code -eq 0 ]]; then
    POSTGRES_AVAILABLE=1
    psql "$DATABASE_URL" -c 'SELECT version();' >>"$log_path" 2>&1
    exit_code=$?
  else
    echo "BLOCKER: Postgres not accepting connections on localhost:5432" >>"$log_path"
  fi
  record_gate "infra-postgres-check" "$ROOT" "$exit_code" "${log_path#$ROOT/}" "$ts"
  if [[ $exit_code -ne 0 ]]; then PIPELINE_FAIL=1; fi
}

check_redis() {
  local ts log_path exit_code
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log_path="$ARTIFACT_DIR/infra/redis-check.log"
  set +e
  redis-cli -u "$REDIS_URL" ping >>"$log_path" 2>&1
  exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    echo "BLOCKER: Redis not available at $REDIS_URL" >>"$log_path"
  else
    REDIS_AVAILABLE=1
  fi
  record_gate "infra-redis-check" "$ROOT" "$exit_code" "${log_path#$ROOT/}" "$ts"
  if [[ $exit_code -ne 0 ]]; then PIPELINE_FAIL=1; fi
}

prepare_test_database() {
  local ts log_path exit_code db_name
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log_path="$ARTIFACT_DIR/infra/postgres-db-prep.log"
  db_name="${DATABASE_URL##*/}"

  {
    echo "CI_CLEAN_DB=$CI_CLEAN_DB"
    echo "target_database=$db_name"
  } >"$log_path"

  if [[ $POSTGRES_AVAILABLE -ne 1 ]]; then
    echo "SKIP: Postgres unavailable" >>"$log_path"
    record_gate "infra-postgres-db-prep" "$ROOT" 1 "${log_path#$ROOT/}" "$ts"
    PIPELINE_FAIL=1
    return 0
  fi

  set +e
  if [[ "$CI_CLEAN_DB" = "1" ]]; then
    psql "postgresql://localhost:5432/postgres" -v ON_ERROR_STOP=1 >>"$log_path" 2>&1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${db_name}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "${db_name}";
CREATE DATABASE "${db_name}";
SQL
    exit_code=$?
    echo "action=drop_recreate_database" >>"$log_path"
  else
    psql "postgresql://localhost:5432/postgres" -v ON_ERROR_STOP=1 -c "SELECT 1 FROM pg_database WHERE datname='${db_name}'" >>"$log_path" 2>&1
    exit_code=$?
    echo "action=reuse_existing_database" >>"$log_path"
  fi

  record_gate "infra-postgres-db-prep" "$ROOT" "$exit_code" "${log_path#$ROOT/}" "$ts"
  if [[ $exit_code -ne 0 ]]; then PIPELINE_FAIL=1; fi
}

run_migrations() {
  if [[ $POSTGRES_AVAILABLE -ne 1 ]]; then
    local ts log_path
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log_path="$ARTIFACT_DIR/integration/migrations-skipped.log"
    echo "BLOCKER: migrations skipped — Postgres unavailable" >"$log_path"
    record_gate "migrations" "$CORE" 1 "${log_path#$ROOT/}" "$ts"
    PIPELINE_FAIL=1
    return 0
  fi
  if [[ $INSTALLED_CORE -ne 1 ]]; then
    local ts log_path
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log_path="$ARTIFACT_DIR/integration/migrations-skipped.log"
    echo "BLOCKER: migrations skipped — core-bank install failed" >"$log_path"
    record_gate "migrations" "$CORE" 1 "${log_path#$ROOT/}" "$ts"
    PIPELINE_FAIL=1
    return 0
  fi
  run_gate "migrations" "$CORE" npx ts-node scripts/run-migrations-ci.ts
}

run_secret_scans() {
  local scopes=(
    "domains/core-bank"
    "bff/web-bff"
    "apps/web-banking"
    "workers/outbox-relay"
    "scripts"
  )
  local scope target
  for scope in "${scopes[@]}"; do
    if command -v gitleaks >/dev/null 2>&1; then
      run_gate "secret-scan-gitleaks-${scope//\//-}" "$ROOT" \
        gitleaks detect --source "$ROOT/$scope" --no-git --redact --verbose
    else
      local ts log_path
      ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      log_path="$ARTIFACT_DIR/security/gitleaks-missing.log"
      echo "BLOCKER: gitleaks not installed" >"$log_path"
      record_gate "secret-scan-gitleaks" "$ROOT" 1 "${log_path#$ROOT/}" "$ts"
      PIPELINE_FAIL=1
    fi
    if [[ -d "$ROOT/$scope/src" ]]; then
      target="$ROOT/$scope/src"
    else
      target="$ROOT/$scope"
    fi
    run_gate "secret-scan-secretlint-${scope//\//-}" "$ROOT" \
      npx --yes @secretlint/quick-start "$target"
  done
}

run_audits_and_sbom() {
  local pkg dir name
  for pkg in core-bank bff worker web; do
    case "$pkg" in
      core-bank) dir="$CORE"; name="core-bank" ;;
      bff) dir="$BFF"; name="web-bff" ;;
      worker) dir="$WORKER"; name="outbox-relay" ;;
      web) dir="$WEB"; name="web-banking" ;;
    esac
    run_gate "audit-npm-${name}" "$dir" npm audit --json
    run_gate "sbom-${name}" "$dir" npx --yes @cyclonedx/cyclonedx-npm \
      --output-file "$ARTIFACT_DIR/security/sbom-${name}.json"
  done
}

run_lint_and_typecheck() {
  run_gate "lint-core-bank" "$CORE" npm run lint
  run_gate "lint-web-bff" "$BFF" npm run lint
  run_gate "lint-web-banking" "$WEB" npm run lint

  run_gate "typecheck-core-bank" "$CORE" npx tsc --noEmit -p tsconfig.json
  run_gate "typecheck-web-bff" "$BFF" npx tsc --noEmit -p tsconfig.json
  run_gate "typecheck-web-banking" "$WEB" npx tsc --noEmit -p tsconfig.json
}

run_unit_tests() {
  if [[ $INSTALLED_CORE -eq 1 ]]; then
    run_gate "unit-test-core-bank" "$CORE" npm test
  fi
  if [[ $INSTALLED_BFF -eq 1 ]]; then
    run_gate "unit-test-web-bff" "$BFF" npm test
  fi
  if [[ $INSTALLED_WEB -eq 1 ]]; then
    run_gate "unit-test-web-banking" "$WEB" npm test
  fi
}

run_integration_tests() {
  if [[ $POSTGRES_AVAILABLE -ne 1 || $INSTALLED_CORE -ne 1 ]]; then
    local ts log_path
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log_path="$ARTIFACT_DIR/integration/postgres-integration-skipped.log"
    echo "BLOCKER: postgres integration tests skipped" >"$log_path"
    record_gate "integration-test-postgres" "$CORE" 1 "${log_path#$ROOT/}" "$ts"
    PIPELINE_FAIL=1
    return 0
  fi
  run_gate "integration-test-postgres" "$CORE" env CORE_BANK_STORAGE=postgres npx jest \
    --runInBand --forceExit src/integration/postgres.integration.spec.ts
}

run_queue_tests() {
  if [[ $REDIS_AVAILABLE -ne 1 || $INSTALLED_WORKER -ne 1 ]]; then
    local ts log_path
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    log_path="$ARTIFACT_DIR/queue/redis-queue-skipped.log"
    echo "BLOCKER: redis queue tests skipped" >"$log_path"
    record_gate "queue-test-redis" "$WORKER" 1 "${log_path#$ROOT/}" "$ts"
    PIPELINE_FAIL=1
    return 0
  fi
  run_gate "queue-test-redis" "$WORKER" npm run test:redis
}

run_security_tests() {
  if [[ $INSTALLED_CORE -eq 1 ]]; then
    run_gate "security-test-core-bank" "$CORE" npx jest --runInBand \
      --testPathPattern="float-guard|money.value-object|ledger-invariants"
  fi
  if [[ $INSTALLED_BFF -eq 1 ]]; then
    run_gate "security-test-web-bff" "$BFF" npx jest --runInBand \
      --testPathPattern="production-kyc-guard|pii-redaction|auth.service"
  fi
}

run_builds() {
  if [[ $INSTALLED_CORE -eq 1 ]]; then
    run_gate "build-core-bank" "$CORE" npm run build
  fi
  if [[ $INSTALLED_BFF -eq 1 ]]; then
    run_gate "build-web-bff" "$BFF" npm run build
  fi
  if [[ $INSTALLED_WORKER -eq 1 ]]; then
    run_gate "build-outbox-relay" "$WORKER" npm run build
  fi
  if [[ $INSTALLED_WEB -eq 1 ]]; then
    run_gate "build-web-banking" "$WEB" npm run build
  fi
}

run_e2e_gate() {
  local ts log_path exit_code=0
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log_path="$ARTIFACT_DIR/e2e/e2e-availability.log"
  {
    echo "Playwright/Cypress scan in apps/web-banking"
    if [[ -f "$WEB/playwright.config.ts" || -f "$WEB/playwright.config.js" ]]; then
      echo "playwright=configured"
    else
      echo "playwright=not_configured"
    fi
    if [[ -f "$WEB/cypress.config.ts" || -f "$WEB/cypress.config.js" ]]; then
      echo "cypress=configured"
    else
      echo "cypress=not_configured"
    fi
    if npm --prefix "$WEB" run 2>/dev/null | grep -qE '^\s+e2e'; then
      echo "npm_script_e2e=present"
    else
      echo "npm_script_e2e=absent"
      echo "RESULT: SKIP — E2E not configured in web-banking"
    fi
  } >"$log_path"
  if ! npm --prefix "$WEB" run 2>/dev/null | grep -qE '^\s+e2e'; then
    exit_code=0
    echo "exit_policy=skip_not_failure" >>"$log_path"
  fi
  record_gate "e2e-availability-check" "$WEB" "$exit_code" "${log_path#$ROOT/}" "$ts"
}

install_packages() {
  run_gate "install-core-bank" "$CORE" npm install
  if [[ $LAST_GATE_EXIT -eq 0 && -d "$CORE/node_modules" ]]; then INSTALLED_CORE=1; fi

  run_gate "install-web-bff" "$BFF" npm install
  if [[ $LAST_GATE_EXIT -eq 0 && -d "$BFF/node_modules" ]]; then INSTALLED_BFF=1; fi

  run_gate "install-outbox-relay" "$WORKER" npm install
  if [[ $LAST_GATE_EXIT -eq 0 && -d "$WORKER/node_modules" ]]; then INSTALLED_WORKER=1; fi

  run_gate "install-web-banking" "$WEB" npm install
  if [[ $LAST_GATE_EXIT -eq 0 && -d "$WEB/node_modules" ]]; then INSTALLED_WEB=1; fi
}

write_run_metadata() {
  local end_ts result
  end_ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if [[ $PIPELINE_FAIL -eq 0 ]]; then result="PASS"; else result="FAIL"; fi
  cat >"$RUN_META" <<JSON
{
  "run_id": ${CI_RUN_ID},
  "clean_db": ${CI_CLEAN_DB},
  "result": "${result}",
  "started_at": "${RUN_STARTED_AT}",
  "finished_at": "${end_ts}",
  "postgres_available": ${POSTGRES_AVAILABLE},
  "redis_available": ${REDIS_AVAILABLE},
  "database_url": "${DATABASE_URL}",
  "redis_url": "${REDIS_URL}",
  "artifact_dir": "${ARTIFACT_DIR#$ROOT/}",
  "gates_executed": ${GATE_SEQ},
  "pipeline_fail": ${PIPELINE_FAIL}
}
JSON
}

main() {
  RUN_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  log "Starting pre-deploy gates run_id=$CI_RUN_ID clean_db=$CI_CLEAN_DB"
  init_manifest
  record_runtime
  record_code_hash
  check_postgres
  check_redis
  prepare_test_database
  install_packages
  run_migrations
  run_secret_scans
  run_audits_and_sbom
  run_lint_and_typecheck
  run_unit_tests
  run_integration_tests
  run_queue_tests
  run_security_tests
  run_builds
  run_e2e_gate
  write_run_metadata
  log "Pipeline finished run_id=$CI_RUN_ID result=$([ $PIPELINE_FAIL -eq 0 ] && echo PASS || echo FAIL)"
  exit "$PIPELINE_FAIL"
}

main "$@"