#!/usr/bin/env bash
# Runtime dependency audit — fails only on critical/high (moderate/low allowed with log).
set -euo pipefail
json="$(npm audit --omit=dev --json 2>/dev/null || true)"
node -e "
const j = JSON.parse(process.argv[1]);
const v = j.metadata?.vulnerabilities ?? {};
const crit = v.critical ?? 0;
const high = v.high ?? 0;
const mod = v.moderate ?? 0;
const low = v.low ?? 0;
console.log(JSON.stringify({ critical: crit, high, moderate: mod, low, total: v.total ?? 0 }));
if (crit > 0 || high > 0) process.exit(1);
process.exit(0);
" "$json"