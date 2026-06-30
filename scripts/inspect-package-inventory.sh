#!/usr/bin/env bash
# Inspeciona inventário do pacote: contagem, exclusões proibidas, amostra de paths.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="${1:-$ROOT/REGENERA-BANK-FULL-PLATFORM-CANDIDATE.zip}"
OUT="${2:-$ROOT/artifacts/verification/package-inventory.tsv}"

if [[ ! -f "$ZIP" ]]; then
  echo "BLOCKER: ZIP ausente: $ZIP" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
export LC_ALL=C
unzip -l "$ZIP" | awk 'NR>3 && $4!="" {print $4}' | sort >"$OUT"

TOTAL="$(wc -l <"$OUT" | tr -d ' ')"
FORBIDDEN=0
for pattern in '/node_modules/' '/.git/' '.env' '/credentials/' '/private-keys/'; do
  if grep -qF "$pattern" "$OUT"; then
    echo "BLOCKER: padrão proibido no pacote: $pattern" >&2
    FORBIDDEN=1
  fi
done
if grep -E '(^|/)\.env($|\.)' "$OUT" >/dev/null; then
  echo "BLOCKER: arquivo .env no pacote" >&2
  FORBIDDEN=1
fi

MANIFEST="$ROOT/artifacts/verification/package-inventory-summary.json"
cat >"$MANIFEST" <<JSON
{
  "zip": "$(basename "$ZIP")",
  "fileCount": $TOTAL,
  "inventoryTsv": "${OUT#$ROOT/}",
  "forbiddenPatternsFound": $FORBIDDEN,
  "samplePaths": [
$(head -5 "$OUT" | sed 's/^/    "/;s/$/",/' | sed '$ s/,$//')
  ],
  "generatedAtUtc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

echo "inventory fileCount=$TOTAL forbidden=$FORBIDDEN"
echo "manifest: $MANIFEST"
exit "$FORBIDDEN"