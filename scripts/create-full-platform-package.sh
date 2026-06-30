#!/usr/bin/env bash
# Gera REGENERA-BANK-FULL-PLATFORM-CANDIDATE.zip + .sha256 (§26).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ZIP_NAME="REGENERA-BANK-FULL-PLATFORM-CANDIDATE.zip"
SHA_FILE="${ZIP_NAME}.sha256"
STAGING="$(mktemp -d /tmp/regenera-package.XXXXXX)"
trap 'rm -rf "$STAGING"' EXIT

log() { printf '[package] %s\n' "$*"; }

log "Staging em $STAGING"
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'coverage' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '.data' \
  --exclude 'credentials' \
  --exclude '*.pem' \
  --exclude '*.key' \
  --exclude 'logs' \
  --exclude 'test-results' \
  --exclude '.DS_Store' \
  --exclude '__MACOSX' \
  --exclude '._*' \
  --exclude 'REGENERA-BANK-FULL-PLATFORM-CANDIDATE.zip' \
  --exclude '**/build/' \
  --exclude '**/.gradle/' \
  --exclude 'apps/android/local.properties' \
  "$ROOT/" "$STAGING/regenera-bank/"

log "Criando $ZIP_NAME"
rm -f "$ROOT/$ZIP_NAME"
(
  cd "$STAGING"
  zip -rq "$ROOT/$ZIP_NAME" regenera-bank
)

log "SHA-256"
shasum -a 256 "$ROOT/$ZIP_NAME" | awk '{print $1 "  " FILENAME}' >"$ROOT/$SHA_FILE"
cat "$ROOT/$SHA_FILE"

log "Validação extract-and-revalidate"
EXTRACT="$(mktemp -d /tmp/regenera-extract.XXXXXX)"
trap 'rm -rf "$STAGING" "$EXTRACT"' EXIT
unzip -q "$ROOT/$ZIP_NAME" -d "$EXTRACT"

BLOCKERS=0
for forbidden in .git node_modules .env credentials; do
  if find "$EXTRACT" -name "$forbidden" -print -quit 2>/dev/null | grep -q .; then
    log "BLOCKER: $forbidden encontrado no pacote"
    BLOCKERS=1
  fi
done

if [[ $BLOCKERS -ne 0 ]]; then
  log "package validation FAIL"
  exit 1
fi

log "package validation PASS — $(du -h "$ROOT/$ZIP_NAME" | awk '{print $1}')"
exit 0