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
echo "Scanning for generated files and local metadata..."
FOUND=0
TARGETS=(
"__pycache__"
".pytest_cache"
".mypy_cache"
".ruff_cache"
".DS_Store"
"Thumbs.db"
"desktop.ini"
"*.pyc"
"*.pyo"
"*.log"
".coverage"
)
for target in "${TARGETS[@]}"; do
if find . -name "$target" -not -path "./.git/*" | grep -q .; then
find . -name "$target" -not -path "./.git/*"
FOUND=1
fi
done
if [ "$FOUND" -eq 1 ]; then
echo "Generated files or local metadata found. Run scripts/clean-repo.sh."
exit 1
fi
echo "Metadata scan passed."
