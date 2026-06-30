#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/."
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major!==22||minor<18){throw new Error("Node 22.18+ obrigatório")}'
rm -rf node_modules package-lock.json
npm install --package-lock-only --ignore-scripts --legacy-peer-deps --no-audit --no-fund
npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
npm run lint
npm run test
npm run build
printf 'lockfile regenerado e validado: %s\n' "$(sha256sum package-lock.json | awk '{print $1}')"
