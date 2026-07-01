#!/usr/bin/env bash
# Cadeia de release final (§13).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ZIP_NAME="REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip"
SHA_FILE="${ZIP_NAME}.sha256"
MANIFEST="${ZIP_NAME%.zip}.manifest.json"
PROVENANCE="${ZIP_NAME%.zip}.provenance.json"
GPG_KEY_ID="${REGENERA_GPG_KEY_ID:-730834AB4126C341A70F6B969826A3AC0BF6A90C}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "BLOCKER: working tree não limpa"
  exit 1
fi

HEAD="$(git rev-parse HEAD)"
TREE="$(git rev-parse HEAD^{tree})"
BRANCH="$(git branch --show-current)"
UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Empacota (reusa script existente com nome final)
STAGING_ROOT="${REGENERA_PACKAGE_STAGING:-/Volumes/PRINCIPAL/Grok/eleve projeto/regenera-bank/.package-staging}"
mkdir -p "$STAGING_ROOT"
STAGING="$(mktemp -d "$STAGING_ROOT/release.XXXXXX")"
trap 'rm -rf "$STAGING"' EXIT
rsync -a \
  --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude 'coverage' \
  --exclude '.env' --exclude '.env.*' --exclude '.data' --exclude 'credentials' \
  --exclude '*.pem' --exclude '*.key' --exclude 'logs' --exclude 'test-results' \
  --exclude '.DS_Store' --exclude '__MACOSX' --exclude '._*' \
  --exclude 'REGENERA-BANK-FULL-PLATFORM-*.zip' \
  --exclude '**/build/' --exclude '**/.build/' --exclude '**/.gradle/' \
  --exclude 'apps/android/local.properties' --exclude 'apps/ios/.build/' \
  --exclude '00-governance/audit-evidence/' \
  --exclude 'artifacts/verification/disaster-recovery/final/*.dump' \
  "$ROOT/" "$STAGING/regenera-bank/"
(
  cd "$STAGING"
  zip -rq "$ROOT/$ZIP_NAME" regenera-bank
)

SHA256="$(shasum -a 256 "$ROOT/$ZIP_NAME" | awk '{print $1}')"
echo "${SHA256}  ${ZIP_NAME}" >"$ROOT/$SHA_FILE"
FILE_COUNT="$(unzip -l "$ROOT/$ZIP_NAME" | tail -1 | awk '{print $2}')"
ZIP_BYTES="$(wc -c <"$ROOT/$ZIP_NAME" | tr -d ' ')"

cat >"$ROOT/$MANIFEST" <<JSON
{
  "package": "${ZIP_NAME}",
  "branch": "${BRANCH}",
  "commit": "${HEAD}",
  "treeHash": "${TREE}",
  "sha256": "${SHA256}",
  "fileCount": ${FILE_COUNT},
  "bytes": ${ZIP_BYTES},
  "createdAtUtc": "${UTC}",
  "deployExecuted": false,
  "secretsInPackage": false
}
JSON

cat >"$ROOT/$PROVENANCE" <<JSON
{
  "predicateType": "https://slsa.dev/provenance/v1",
  "buildDefinition": {
    "buildType": "regenera/local-release",
    "commit": "${HEAD}",
    "treeHash": "${TREE}",
    "createdAtUtc": "${UTC}"
  },
  "artifacts": [
    { "name": "${ZIP_NAME}", "sha256": "${SHA256}" }
  ],
  "deployExecuted": false
}
JSON

if gpg --batch --yes --local-user "$GPG_KEY_ID" --armor --detach-sign --output "${SHA_FILE}.asc" "$SHA_FILE" 2>/dev/null; then
  echo "GPG_SIGNATURE_OK"
else
  echo "GPG_SIGNATURE_PENDING_EXTERNAL_CREDENTIAL" >"${SHA_FILE}.gpg-status"
fi

echo "RELEASE_CANDIDATE_OK commit=$HEAD sha256=$SHA256"