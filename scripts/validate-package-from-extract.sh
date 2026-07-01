#!/usr/bin/env bash
# Valida pacote a partir de extração limpa (§4).
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ZIP="${1:-REGENERA-BANK-FULL-PLATFORM-RELEASE-CANDIDATE.zip}"
if [[ ! -f "$ZIP" ]]; then
  ZIP="REGENERA-BANK-FULL-PLATFORM-CANDIDATE.zip"
fi
[[ -f "$ZIP" ]] || { echo "BLOCKER: ZIP ausente"; exit 1; }

OUT="$ROOT/artifacts/verification/package-validation"
mkdir -p "$OUT"
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

log() { printf '[package-validation] %s\n' "$*"; }

log "Integridade ZIP"
unzip -t "$ZIP" >"$OUT/zip-integrity.log" 2>&1 || exit 1

log "SHA-256"
shasum -a 256 "$ZIP" >"$OUT/zip-sha256.log"

log "Extrair"
unzip -q "$ZIP" -d "$TMP_ROOT"
PKG="$(find "$TMP_ROOT" -maxdepth 2 -type d -name 'regenera-bank' | head -1)"
[[ -n "$PKG" ]] || PKG="$TMP_ROOT"

log "Inventário"
find "$PKG" -type f | LC_ALL=C sort >"$OUT/package-inventory.txt"
FILE_COUNT="$(wc -l <"$OUT/package-inventory.txt" | tr -d ' ')"
printf '{"fileCount":%s,"zip":"%s","extractedAtUtc":"%s"}\n' \
  "$FILE_COUNT" "$ZIP" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$OUT/package-inventory-summary.json"

log "Arquivos proibidos"
FORBIDDEN=0
{
  echo "scan_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  for pattern in '.git' 'node_modules' '.env' 'credentials' '__MACOSX' '.DS_Store'; do
    hits="$(find "$PKG" -name "$pattern" 2>/dev/null | head -20 || true)"
    if [[ -n "$hits" ]]; then
      echo "BLOCKER: $pattern"
      echo "$hits"
      FORBIDDEN=1
    fi
  done
} >"$OUT/forbidden-files-scan.log"
[[ $FORBIDDEN -eq 0 ]] || exit 1

log "gitleaks no pacote"
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --config "$PKG/.gitleaks.toml" --source "$PKG" --no-git --redact \
    >"$OUT/gitleaks-package.log" 2>&1 || exit 1
else
  echo "gitleaks missing" >"$OUT/gitleaks-package.log"
  exit 1
fi

log "install + test + build no pacote extraído"
{
  cd "$PKG/domains/core-bank" && npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
  cd "$PKG/domains/core-bank" && npx ts-node scripts/run-migrations-ci.ts
  cd "$PKG/domains/core-bank" && npm test
  cd "$PKG/bff/web-bff" && npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
  cd "$PKG/bff/web-bff" && npm test
  cd "$PKG/apps/web-banking" && npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
  cd "$PKG/apps/web-banking" && npm run build
} >"$OUT/build-from-package.log" 2>&1 || { log "build FAIL"; exit 1; }

log "comparação pacote vs repositório"
{
  echo "repo_head=$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo NO_GIT)"
  echo "repo_tree=$(git -C "$ROOT" rev-parse 'HEAD^{tree}' 2>/dev/null || echo NO_GIT)"
  diff <(cd "$ROOT" && find domains/core-bank/src bff/web-bff/src apps/web-banking/src -type f | LC_ALL=C sort) \
       <(cd "$PKG" && find domains/core-bank/src bff/web-bff/src apps/web-banking/src -type f 2>/dev/null | LC_ALL=C sort) \
    || echo "NOTE: diff esperado se commit pós-empacotamento"
} >"$OUT/package-vs-repository-comparison.log"

log "PASS — $OUT"
exit 0