#!/usr/bin/env bash
# Full platform CI — matrix: foundation, backend, web, worker, security, E2E.
# Runs twice by default: run1 (clean DB) + run2 (idempotent reuse).
# Critical gates must fail the pipeline — no || true swallowing.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRE_DEPLOY="$ROOT/scripts/run-pre-deploy-gates.sh"
FULL_CI_RUNS="${FULL_CI_RUNS:-2}"

PIPELINE_FAIL=0

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

gate_stage() {
  local gate="$1"
  case "$gate" in
    runtime-versions|code-hash|infra-*|install-*|migrations)
      echo "foundation" ;;
    lint-core-bank|typecheck-core-bank|unit-test-core-bank|integration-test-*|security-test-core-bank|build-core-bank)
      echo "backend" ;;
    lint-web-*|typecheck-web-*|unit-test-web-*|security-test-web-bff|build-web-*)
      echo "web" ;;
    queue-test-*|build-outbox-relay)
      echo "worker" ;;
    secret-scan-*|audit-npm-*|sbom-*)
      echo "security" ;;
    e2e-*)
      echo "e2e" ;;
    *)
      echo "other" ;;
  esac
}

stage_count() {
  local stage="$1" field="$2" artifact_dir="$3"
  local gate_manifest="$artifact_dir/gate-manifest.tsv"
  local seq gate cwd exit_code log_path ts runtime mapped
  local total=0 pass=0 fail=0
  while IFS=$'\t' read -r seq gate cwd exit_code log_path ts runtime; do
    [[ "$seq" == "seq" || -z "$gate" ]] && continue
    mapped="$(gate_stage "$gate")"
    [[ "$mapped" != "$stage" ]] && continue
    total=$((total + 1))
    if [[ "$exit_code" -eq 0 ]]; then
      pass=$((pass + 1))
    else
      fail=$((fail + 1))
    fi
  done <"$gate_manifest"
  case "$field" in
    gates) echo "$total" ;;
    pass) echo "$pass" ;;
    fail) echo "$fail" ;;
  esac
}

write_matrix_manifest() {
  local run_id="$1" artifact_dir="$2"
  local gate_manifest="$artifact_dir/gate-manifest.tsv"
  local matrix_tsv="$artifact_dir/matrix-manifest.tsv"
  local matrix_json="$artifact_dir/matrix-manifest.json"
  local stages=(foundation backend web worker security e2e)

  if [[ ! -f "$gate_manifest" ]]; then
    echo "BLOCKER: gate-manifest ausente em $artifact_dir" >"$artifact_dir/matrix-manifest.error"
    return 1
  fi

  printf 'run\tstage\tgates\tpass\tfail\tresult\n' >"$matrix_tsv"
  local overall_fail=0 stage gates pass fail result
  for stage in "${stages[@]}"; do
    gates="$(stage_count "$stage" gates "$artifact_dir")"
    pass="$(stage_count "$stage" pass "$artifact_dir")"
    fail="$(stage_count "$stage" fail "$artifact_dir")"
    result="PASS"
    if [[ "$fail" -gt 0 ]]; then
      result="FAIL"
      overall_fail=1
    elif [[ "$gates" -eq 0 ]]; then
      result="SKIP"
    fi
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$run_id" "$stage" "$gates" "$pass" "$fail" "$result" >>"$matrix_tsv"
  done

  cat >"$matrix_json" <<JSON
{
  "run_id": ${run_id},
  "artifact_dir": "${artifact_dir#$ROOT/}",
  "stages": [
JSON
  local first=1
  for stage in "${stages[@]}"; do
    gates="$(stage_count "$stage" gates "$artifact_dir")"
    pass="$(stage_count "$stage" pass "$artifact_dir")"
    fail="$(stage_count "$stage" fail "$artifact_dir")"
    result="PASS"
    if [[ "$fail" -gt 0 ]]; then
      result="FAIL"
    elif [[ "$gates" -eq 0 ]]; then
      result="SKIP"
    fi
    [[ $first -eq 1 ]] && first=0 || echo "," >>"$matrix_json"
    printf '    {"stage":"%s","gates":%s,"pass":%s,"fail":%s,"result":"%s"}' \
      "$stage" "$gates" "$pass" "$fail" "$result" >>"$matrix_json"
  done
  cat >>"$matrix_json" <<JSON

  ],
  "pipeline_fail": ${overall_fail}
}
JSON

  return "$overall_fail"
}

run_full_ci() {
  local run_id="$1" clean_db="$2"
  local artifact_dir="${RELEASE_EVIDENCE_ROOT:-$ROOT/artifacts/verification/full-ci/run${run_id}}"

  export CI_RUN_ID="$run_id"
  export CI_CLEAN_DB="$clean_db"
  export CI_ARTIFACT_DIR="$artifact_dir"
  export CI_FULL_PLATFORM=1

  mkdir -p "$artifact_dir"
  log "full-platform-ci run_id=$run_id clean_db=$clean_db artifact=${artifact_dir#$ROOT/}"

  set +e
  "$PRE_DEPLOY"
  local exit_code=$?
  set -e

  write_matrix_manifest "$run_id" "$artifact_dir" || exit_code=1
  log "full-platform-ci run_id=$run_id exit=$exit_code"
  return "$exit_code"
}

main() {
  log "Starting full platform CI runs=$FULL_CI_RUNS"
  local run_id=1
  while [[ $run_id -le $FULL_CI_RUNS ]]; do
    local clean_db=0
    [[ $run_id -eq 1 ]] && clean_db=1
    if ! run_full_ci "$run_id" "$clean_db"; then
      PIPELINE_FAIL=1
    fi
    run_id=$((run_id + 1))
  done
  log "Full platform CI finished result=$([ $PIPELINE_FAIL -eq 0 ] && echo PASS || echo FAIL)"
  exit "$PIPELINE_FAIL"
}

main "$@"