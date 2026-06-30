#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test -f "${ROOT}/package.json" || { echo "FALTA: package.json" >&2; exit 1; }
test -f "${ROOT}/package-lock.json" || { echo "FALTA: package-lock.json" >&2; exit 1; }
test -f "${ROOT}/vercel.json" || { echo "FALTA: vercel.json" >&2; exit 1; }
test -f "${ROOT}/.vercel/project.json" || { echo "FALTA: .vercel/project.json" >&2; exit 1; }
test -f "${ROOT}/.env" || { echo "FALTA: .env" >&2; exit 1; }
test -f "${ROOT}/src/main.tsx" || { echo "FALTA: src/main.tsx" >&2; exit 1; }
(cd "$ROOT" && sha256sum -c CHECKSUMS.sha256)
echo "OK: estrutura e checksums íntegros."
