#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HEADER='> **STATUS:** SUPERSEDED
> **CANONICAL_SOURCE:** docs/final/23-FINAL-CLOSURE.md

'
for f in "$ROOT"/docs/audit/*.md; do
  [[ -f "$f" ]] || continue
  if ! grep -q 'STATUS: SUPERSEDED' "$f" 2>/dev/null; then
    tmp="$(mktemp)"
    printf '%s' "$HEADER" >"$tmp"
    cat "$f" >>"$tmp"
    mv "$tmp" "$f"
  fi
done
echo "docs/audit marked SUPERSEDED"