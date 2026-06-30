#!/usr/bin/env bash
# Gates estendidos: Android, iOS, Windows, Docker, domínios, partner, operations-bff.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACT_DIR="${CI_EXTENSION_ARTIFACT_DIR:-$ROOT/artifacts/verification/platform-extension}"
mkdir -p "$ARTIFACT_DIR"

PIPELINE_FAIL=0
log() { printf '[platform-ext] %s\n' "$*"; }

run_gate() {
  local name="$1"
  shift
  local log_path="$ARTIFACT_DIR/${name}.log"
  log "gate=$name"
  set +e
  (cd "$ROOT" && "$@") >"$log_path" 2>&1
  local code=$?
  set -e
  echo "exit_code=$code" >>"$log_path"
  if [[ $code -ne 0 ]]; then
    PIPELINE_FAIL=1
    log "FAIL $name (exit $code)"
  else
    log "PASS $name"
  fi
}

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
export PATH="${JAVA_HOME}/bin:${HOME}/.dotnet:${PATH}"

run_gate "ios-swift-test" bash -c 'cd apps/ios && swift test'
run_gate "windows-operations-tests" bash -c 'cd apps/windows-operations && dotnet test src/Regenera.Operations.Tests/Regenera.Operations.Tests.csproj -c Debug'
run_gate "operations-bff-tests" bash -c 'cd bff/operations-bff && npm test'
run_gate "partner-facade-tests" bash -c 'cd bff/partner-api-facade && npm test'
run_gate "domain-sample-tests" bash -c 'node scripts/scaffold-domains.mjs --test-sample 2>/dev/null || for d in domains/dreams domains/kids domains/credit domains/cards; do (cd "$d" && npm test) || exit 1; done'
run_gate "android-assemble-debug" bash apps/android/scripts/build-debug.sh
run_gate "docker-validate-builds" bash platform/docker/validate-builds.sh
run_gate "gitleaks-history" gitleaks detect --config "$ROOT/.gitleaks.toml" --source "$ROOT" --verbose
run_gate "contracts-validate" bash scripts/validate-contracts.sh

if [[ $PIPELINE_FAIL -eq 0 ]]; then
  log "platform extension PASS"
else
  log "platform extension FAIL"
fi
exit "$PIPELINE_FAIL"