#!/usr/bin/env bash
# Mapeia api.regenerabank.com e app.regenerabank.com no Cloud Run.
# Depois copie os registros DNS que o Google mostrar → GoDaddy.
set -euo pipefail

PROJECT="${GCP_PROJECT:-regenera-bank-501015}"
REGION="${GCP_REGION:-southamerica-east1}"
BFF_SERVICE="${BFF_SERVICE:-regenera-web-bff}"
WEB_SERVICE="${WEB_SERVICE:-regenera-web-banking}"
API_DOMAIN="${API_DOMAIN:-api.regenerabank.com}"
APP_DOMAIN="${APP_DOMAIN:-app.regenerabank.com}"

gcloud config set project "$PROJECT" >/dev/null

echo "Mapeando $API_DOMAIN → $BFF_SERVICE"
gcloud beta run domain-mappings create \
  --service "$BFF_SERVICE" \
  --domain "$API_DOMAIN" \
  --region "$REGION" \
  --quiet 2>/dev/null || echo "(já existe ou em verificação)"

echo "Mapeando $APP_DOMAIN → $WEB_SERVICE"
gcloud beta run domain-mappings create \
  --service "$WEB_SERVICE" \
  --domain "$APP_DOMAIN" \
  --region "$REGION" \
  --quiet 2>/dev/null || echo "(já existe ou em verificação)"

echo ""
echo "=== DNS para colar no GoDaddy (Registros DNS) ==="
gcloud beta run domain-mappings describe --domain "$API_DOMAIN" --region "$REGION" \
  --format='table(resourceRecords.type,resourceRecords.name,resourceRecords.rrdata)' 2>/dev/null || true
echo "---"
gcloud beta run domain-mappings describe --domain "$APP_DOMAIN" --region "$REGION" \
  --format='table(resourceRecords.type,resourceRecords.name,resourceRecords.rrdata)' 2>/dev/null || true
echo ""
echo "Console: https://console.cloud.google.com/run/domains?project=$PROJECT"