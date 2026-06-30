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
echo "Cleaning local generated files..."
find . -type d -name "__pycache__" -prune -exec rm -rf {} +
find . -type d -name ".pytest_cache" -prune -exec rm -rf {} +
find . -type d -name ".mypy_cache" -prune -exec rm -rf {} +
find . -type d -name ".ruff_cache" -prune -exec rm -rf {} +
find . -type d -name "coverage" -prune -exec rm -rf {} +
find . -type d -name "htmlcov" -prune -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name ".coverage" -delete
find . -type f -name ".DS_Store" -delete
find . -type f -name "Thumbs.db" -delete
find . -type f -name "desktop.ini" -delete
find . -type f -name "*.log" -delete
echo "Local generated files removed."
