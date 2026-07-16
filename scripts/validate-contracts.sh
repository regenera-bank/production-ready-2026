#!/usr/bin/env bash
# Validates that required contract and governance JSON schemas exist and are parseable.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REQUIRED_JSON=(
  "contracts/events/event-envelope.schema.json"
  "governance/error-catalog/CORE-ERRORS.json"
  "governance/feature-flags/FEATURE-FLAGS.json"
)

REQUIRED_YAML=(
  "contracts/openapi/regenera-bank-v1.openapi.yaml"
  "contracts/openapi/partner-api-v1.openapi.yaml"
  "contracts/asyncapi/regenera-events-v1.asyncapi.yaml"
  "contracts/asyncapi/partner-webhooks-v1.asyncapi.yaml"
)

errors=0

echo "==> Validating contract file presence"

for file in "${REQUIRED_JSON[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "MISSING: $file"
    errors=$((errors + 1))
    continue
  fi
  echo "OK (exists): $file"
done

for file in "${REQUIRED_YAML[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "MISSING: $file"
    errors=$((errors + 1))
    continue
  fi
  echo "OK (exists): $file"
done

echo "==> Validating JSON schemas"

if command -v python3 >/dev/null 2>&1; then
  for file in "${REQUIRED_JSON[@]}"; do
    if [[ -f "$file" ]]; then
      if python3 - "$file" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as fh:
    json.load(fh)
PY
      then
        echo "OK (parse): $file"
      else
        echo "INVALID JSON: $file"
        errors=$((errors + 1))
      fi
    fi
  done
else
  echo "WARN: python3 not found; skipping JSON parse validation"
fi

echo "==> Validating event envelope required fields"

if [[ -f "contracts/events/event-envelope.schema.json" ]] && command -v python3 >/dev/null 2>&1; then
  if python3 <<'PY'
import json
from pathlib import Path

schema = json.loads(Path("contracts/events/event-envelope.schema.json").read_text(encoding="utf-8"))
required = {
    "eventId",
    "eventType",
    "eventVersion",
    "occurredAt",
    "correlationId",
    "causationId",
    "aggregateId",
    "tenantId",
    "payload",
}
actual = set(schema.get("required", []))
missing = required - actual
if missing:
    raise SystemExit(f"event envelope missing required fields: {sorted(missing)}")
PY
  then
    echo "OK: event-envelope.schema.json required fields"
  else
    echo "INVALID: event-envelope.schema.json required fields"
    errors=$((errors + 1))
  fi
fi

if [[ "$errors" -gt 0 ]]; then
  echo "FAILED: $errors contract validation error(s)"
  exit 1
fi

echo "PASSED: contract validation"