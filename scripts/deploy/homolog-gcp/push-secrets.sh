#!/usr/bin/env bash
# Sobe secrets do bff/web-bff/.env local para Secret Manager (homolog GCP).
# Rode uma vez antes do deploy-cloud-run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/bff/web-bff/.env}"
PROJECT="${GCP_PROJECT:-regenera-bank-501015}"

gcloud config set project "$PROJECT" >/dev/null

upsert_secret() {
  local name="$1"
  local value="$2"
  [ -n "$value" ] || return 0
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=-
  else
    printf '%s' "$value" | gcloud secrets create "$name" --data-file=-
  fi
  echo "OK $name"
}

get_env() {
  grep -E "^${1}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true
}

[ -f "$ENV_FILE" ] || { echo "Arquivo não encontrado: $ENV_FILE"; exit 1; }

for key in DIDIT_API_KEY DIDIT_WEBHOOK_SECRET JWT_SESSION_SECRET FIREBASE_API_KEY GEMINI_API_KEY; do
  upsert_secret "$key" "$(get_env "$key")"
done

echo "Secrets no projeto $PROJECT. Rode deploy-cloud-run.sh"