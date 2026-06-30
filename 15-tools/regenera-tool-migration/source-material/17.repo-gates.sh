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

# GATE 1: node_modules não é versionado
if find . -path ./node_modules -prune -o -type d -name node_modules -print | grep -q .; then
  echo "GATE node_modules: diretório versionado fora da raiz"; fail=1
fi
if git ls-files 2>/dev/null | grep -q '^node_modules/'; then
  echo "GATE node_modules: dependências commitadas"; fail=1
fi

# GATE 2: dinheiro não é number, é contrato
if grep -RInE "amount: number|amountCents: number|balance: number|Math\.round\(.*(amount|reais)|parseFloat\(.*amount" --include='*.ts' src 2>/dev/null; then
  echo "GATE money: valor monetário como number"; fail=1
fi

# GATE 3: erro tem nome, catch é unknown
if grep -RInE "catch \((error|e|err)\)( |$)" --include='*.ts' src 2>/dev/null | grep -v ': unknown'; then
  echo "GATE error: catch sem tipagem unknown"; fail=1
fi

# GATE 4: mock fora de teste é mentira
if grep -RIn "from '.*adapters/mock" --include='*.ts' src 2>/dev/null; then
  echo "GATE mock: import de mock fora de teste"; fail=1
fi

# GATE 5: pendência em código é dívida
if grep -RInE "TODO|FIXME|XXX|HACK|placeholder|implement later" --include='*.ts' --include='*.sql' src migrations 2>/dev/null; then
  echo "GATE pendência: marcador de trabalho incompleto"; fail=1
fi

# GATE 6: credencial vazada não passa
if grep -RInE "postgres(ql)?://[^\"'\$ ]*:[^\"'\$ ]*@|BEGIN PRIVATE KEY|AKIA[0-9A-Z]{16}" --include='*.ts' --include='*.sql' src migrations 2>/dev/null; then
  echo "GATE secret: credencial em texto plano"; fail=1
fi

# GATE 7: comentário virou novela? Não pode
awk '/\/\*/{c=0} /\/\*/,/\*\//{c++} /\*\//{if(c>15) print FILENAME": bloco de comentario com "c" linhas"}' $(find src -name '*.ts') 2>/dev/null | sort -u | while read -r line; do
  echo "GATE comentário: $line"; fail=1
done

# GATE 8: deploy manual é risco
for sh_file in DEPLOY_*.sh FIX_AND_DEPLOY.sh deploy.sh deploy_front_mobile.sh; do
  if [ -f "$sh_file" ]; then
    echo "GATE deploy: script manual $sh_file deve sair (pipeline é a única via)"; fail=1
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "Todos os portões passaram. Risco zero até aqui."
fi

exit "$fail"