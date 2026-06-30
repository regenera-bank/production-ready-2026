#!/usr/bin/env bash
# Release autoritativa: gates verdes → ZIP → SHA-256 → inventário → GPG (§1 item 6).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
ARTIFACT_DIR="$ROOT/artifacts/release/$RELEASE_ID"
mkdir -p "$ARTIFACT_DIR"
GPG_KEY_ID="${REGENERA_GPG_KEY_ID:-730834AB4126C341A70F6B969826A3AC0BF6A90C}"

log() { printf '[release] %s\n' "$*"; }
fail() { log "BLOCKER: $*"; exit 1; }

if [[ -n "$(git status --porcelain)" ]]; then
  fail "working tree não está limpa — commit antes da release"
fi

HEAD="$(git rev-parse HEAD)"
TREE="$(git rev-parse HEAD^{tree})"
BRANCH="$(git branch --show-current)"

log "Pré-requisito: full CI (2 runs)"
FULL_CI_RUNS=2 bash scripts/run-full-platform-ci.sh >"$ARTIFACT_DIR/full-ci.log" 2>&1 \
  || fail "full CI FAIL — ver $ARTIFACT_DIR/full-ci.log"

log "Pré-requisito: container runtime"
bash scripts/validate-container-runtime.sh >"$ARTIFACT_DIR/container-runtime.log" 2>&1 \
  || fail "container runtime FAIL — ver $ARTIFACT_DIR/container-runtime.log"

log "Empacotamento"
bash scripts/create-full-platform-package.sh >"$ARTIFACT_DIR/package.log" 2>&1 \
  || fail "package FAIL"

ZIP="REGENERA-BANK-FULL-PLATFORM-CANDIDATE.zip"
SHA_FILE="${ZIP}.sha256"
INVENTORY="$ARTIFACT_DIR/RELEASE-INVENTORY.json"

FILE_COUNT="$(unzip -l "$ZIP" | tail -1 | awk '{print $2}')"
ZIP_BYTES="$(wc -c <"$ZIP" | tr -d ' ')"
SHA256="$(awk '{print $1}' "$SHA_FILE")"

cat >"$INVENTORY" <<JSON
{
  "releaseId": "$RELEASE_ID",
  "branch": "$BRANCH",
  "gitHead": "$HEAD",
  "gitTree": "$TREE",
  "zipFile": "$ZIP",
  "zipBytes": $ZIP_BYTES,
  "zipFileCount": $FILE_COUNT,
  "sha256": "$SHA256",
  "createdAtUtc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployExecuted": false,
  "secretsInPackage": false
}
JSON

log "Assinatura GPG"
SIG_FILE="$ARTIFACT_DIR/${ZIP}.asc"
if gpg --batch --yes --local-user "$GPG_KEY_ID" --armor --detach-sign --output "$SIG_FILE" "$ZIP" 2>"$ARTIFACT_DIR/gpg.log"; then
  log "GPG assinatura OK — $SIG_FILE"
  gpg --verify "$SIG_FILE" "$ZIP" >>"$ARTIFACT_DIR/gpg.log" 2>&1 || fail "GPG verify FAIL"
else
  log "EXTERNAL_ACTIVATION_REQUIRED: GPG indisponível — ver $ARTIFACT_DIR/gpg.log"
  echo "GPG_SIGNING_REQUIRED" >"$ARTIFACT_DIR/GPG-PENDING.txt"
fi

cp "$SHA_FILE" "$ARTIFACT_DIR/"
log "Release $RELEASE_ID concluída — HEAD=$HEAD"
cat "$INVENTORY"