#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

# ==========================================
# REGENERA HARDENING HEADER
# ==========================================
DRY_RUN=${DRY_RUN:-true}

# Proteção de ambiente
TARGET_DIR=$(realpath "${1:-$(pwd)}")
if [[ "$TARGET_DIR" == "/" || "$TARGET_DIR" == "$HOME" ]]; then
    echo "[FATAL] Execução bloqueada no root ou home directory: $TARGET_DIR"
    exit 1
fi
# ==========================================
\n#!/usr/bin/env bash
set -euo pipefail

fail=0
trip() { echo "V3 GATE: $1"; fail=1; }

# segredo fora do cofre vira incidente.
if find . -name ".env" -o -name ".env.*" | grep -vE "\.env\.example$" >/dev/null 2>&1; then
  trip ".env real encontrado. segredo não entra no repo."
fi

# dependência versionada é aterro sanitário.
if find . -type d -name node_modules | grep . >/dev/null 2>&1; then
  trip "node_modules encontrado. pacote precisa nascer limpo."
fi

# lixo de zip não entra em banco.
if find . -name "__MACOSX" -o -name ".DS_Store" | grep . >/dev/null 2>&1; then
  trip "lixo de zip encontrado. chão sujo derruba auditoria."
fi

# chave óbvia não passa.
secret_hits="/tmp/regenera-v3-secrets.txt"
: > "$secret_hits"

grep -RInE "AIza[0-9A-Za-z_-]{20,}" --exclude-dir=node_modules --exclude-dir=.git --exclude='*.md' --exclude='*.json' --exclude='regenera-v3-surgery-gate.sh' . | grep -v "REDACTED" >> "$secret_hits" 2>/dev/null || true
grep -RInE "postgres(ql)?://[^[:space:]]+" --exclude-dir=node_modules --exclude-dir=.git --exclude='*.md' --exclude='*.json' --exclude='.env.example' --exclude='regenera-v3-surgery-gate.sh' . | grep -v "REDACTED" >> "$secret_hits" 2>/dev/null || true
grep -RInE "regenera-bank-jwt-secret" --exclude-dir=node_modules --exclude-dir=.git --exclude='*.md' --exclude='*.json' --exclude='regenera-v3-surgery-gate.sh' . >> "$secret_hits" 2>/dev/null || true
grep -RInE "PROMETEO_API_KEY=[A-Za-z0-9_-]{30,}" --exclude-dir=node_modules --exclude-dir=.git --exclude='*.md' --exclude='*.json' --exclude='.env.example' --exclude='regenera-v3-surgery-gate.sh' . >> "$secret_hits" 2>/dev/null || true

if [ -s "$secret_hits" ]; then
  cat "$secret_hits"
  trip "padrão de segredo encontrado. segredo fora do cofre é vazamento esperando commit."
fi

# mock em runtime precisa virar fila de cirurgia.
# Não bloqueia a cópia V3 sozinho porque Parte 2 ainda está em reforma.
# Mas imprime. O que aparece aqui não pode dormir em produção.
mock_hits="/tmp/regenera-v3-mocks.txt"
: > "$mock_hits"
grep -RInE "mock|fake|demo" 01-banking-core-engine/src 03-enterprise-web-platform/src 02-customer-mobile-experience/src 2>/dev/null \
  | grep -vE "test|spec|__tests__|fixtures|runtime-mode.guard" >> "$mock_hits" || true
if [ -s "$mock_hits" ]; then
  echo "V3 GATE aviso: mock/fake/demo encontrado em runtime. Isso entra na fila de cirurgia."
  cat "$mock_hits"
fi

if [ "$fail" -ne 0 ]; then
  echo "V3 GATE falhou. Não empurra vidro quebrado pra produção."
  exit 1
fi

echo "V3 GATE passou. Ainda não é glória. É só chão limpo."
