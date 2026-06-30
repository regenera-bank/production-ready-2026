#!/usr/bin/env bash
# Espelha artefatos da sessão Grok para Versão atualizada Grok/
# Nunca copia node_modules, dist, coverage.
set -euo pipefail

BASE="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$(cd "$(dirname "$0")" && pwd)"

echo "Base: $BASE"
echo "Dest: $DEST"

mkdir -p "$DEST/domains/core-bank" "$DEST/.github/workflows" "$DEST/entrega-core-bank"

# Limpa lixo de sync anterior
rm -rf "$DEST/domains/core-bank/node_modules" \
       "$DEST/domains/core-bank/dist" \
       "$DEST/domains/core-bank/coverage" \
       "$DEST/domains/core-bank/src/.regenera-agent"

cp "$BASE/AGENTS.md" "$DEST/"
cp "$BASE/money.value-object.ts" "$DEST/"
cp "$BASE/STYLE_pt-BR.md" "$DEST/" 2>/dev/null || cp "$BASE/STYLE.pt-BR.md" "$DEST/STYLE.pt-BR.md"
cp "$BASE/Versão atualizada Grok/MAPA-COMPLETO-ORQUESTRACAO.md" "$DEST/" 2>/dev/null || true

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude 'coverage' \
    --exclude '.regenera-agent' \
    --exclude 'src/.regenera-agent' \
    "$BASE/domains/core-bank/" "$DEST/domains/core-bank/"
else
  echo "rsync ausente — cópia seletiva"
  (cd "$BASE/domains/core-bank" && find . -type f \
    ! -path './node_modules/*' \
    ! -path './dist/*' \
    ! -path './coverage/*' \
    ! -path './.regenera-agent/*' \
    ! -path './src/.regenera-agent/*' \
    -print0) | while IFS= read -r -d '' f; do
    mkdir -p "$DEST/domains/core-bank/$(dirname "$f")"
    cp "$BASE/domains/core-bank/$f" "$DEST/domains/core-bank/$f"
  done
fi

cp "$BASE/.github/workflows/core-bank-ci.yml" "$DEST/.github/workflows/"

cp "$DEST/00-SESSAO-ORQUESTRACAO-GROK.md" "$DEST/entrega-core-bank/" 2>/dev/null || true
cp "$DEST/MAPA-COMPLETO-ORQUESTRACAO.md" "$DEST/entrega-core-bank/" 2>/dev/null || true
cp "$DEST/MANIFESTO-ARTEFATOS.json" "$DEST/entrega-core-bank/"

COUNT=$(find "$DEST" -type f \
  ! -path '*/node_modules/*' \
  ! -path '*/dist/*' \
  ! -path '*/coverage/*' | wc -l | tr -d ' ')
echo "OK — $COUNT arquivos (sem node_modules/dist/coverage)"