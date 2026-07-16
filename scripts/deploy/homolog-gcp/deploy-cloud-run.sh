#!/usr/bin/env bash
# Deploy homolog canal web no Google Cloud Run (projeto regenera-bank-501015).
#
# Pré-requisito (uma vez, no Mac):
#   gcloud auth login finance@regenerabank.world
#   gcloud config set project regenera-bank-501015
#
# Uso:
#   bash scripts/deploy/homolog-gcp/deploy-cloud-run.sh
#
# Depois: mapear domínios no Console ou:
#   bash scripts/deploy/homolog-gcp/map-domains.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PROJECT="${GCP_PROJECT:-regenera-bank-501015}"
REGION="${GCP_REGION:-southamerica-east1}"
AR_REPO="${AR_REPO:-regenera-homolog}"
BFF_SERVICE="${BFF_SERVICE:-regenera-web-bff}"
WEB_SERVICE="${WEB_SERVICE:-regenera-web-banking}"
IMAGE_ROOT="${REGION}-docker.pkg.dev/${PROJECT}/${AR_REPO}"

echo "== Regenera homolog Cloud Run =="
echo "Projeto: $PROJECT | Região: $REGION"
gcloud config set project "$PROJECT" >/dev/null

echo "▶ APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

if ! gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" >/dev/null 2>&1; then
  echo "▶ Artifact Registry: $AR_REPO"
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Regenera homolog images"
fi

echo "▶ Build web-bff (5–15 min)"
cat > /tmp/regenera-web-bff.cloudbuild.yaml <<YAML
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - platform/docker/Dockerfile.web-bff
      - -t
      - ${IMAGE_ROOT}/web-bff:latest
      - .
images:
  - ${IMAGE_ROOT}/web-bff:latest
YAML
gcloud builds submit "$ROOT" \
  --config=/tmp/regenera-web-bff.cloudbuild.yaml \
  --timeout=1200

echo "▶ Build web-banking"
cat > /tmp/regenera-web-banking.cloudbuild.yaml <<YAML
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - platform/docker/Dockerfile.web-banking
      - --build-arg
      - VITE_API_URL=https://api.regenerabank.com/v1
      - --build-arg
      - VITE_GOOGLE_OAUTH_CLIENT_ID=241009885907-japk2dlt7a5vkeigpsq0m5vi39b54vlg.apps.googleusercontent.com
      - -t
      - ${IMAGE_ROOT}/web-banking:latest
      - .
images:
  - ${IMAGE_ROOT}/web-banking:latest
YAML
gcloud builds submit "$ROOT" \
  --config=/tmp/regenera-web-banking.cloudbuild.yaml \
  --timeout=1200

BFF_ENV=(
  "NODE_ENV=production"
  "CORE_BANK_STORAGE=memory"
  "KYC_PROVIDER=didit"
  "WEB_ORIGIN=https://app.regenerabank.com"
  "WEBAUTHN_RP_ID=app.regenerabank.com"
  "DIDIT_SESSION_CALLBACK_URL=https://app.regenerabank.com/?didit=callback"

  "GEMINI_USE_VERTEX=true"
  "GEMINI_GCP_PROJECT_ID=${PROJECT}"
  "GEMINI_VERTEX_LOCATION=us-central1"
  "VISION_USE_ADC=true"
  "GOOGLE_VISION_PROJECT_ID=${PROJECT}"
)

# Secrets opcionais no Secret Manager (crie antes se existirem)
BFF_SECRETS=()
for name in DIDIT_API_KEY DIDIT_WEBHOOK_SECRET JWT_SESSION_SECRET FIREBASE_API_KEY GEMINI_API_KEY; do
  if gcloud secrets describe "$name" --project="$PROJECT" >/dev/null 2>&1; then
    BFF_SECRETS+=("${name}=${name}:latest")
  fi
done

SECRET_FLAG=()
if [ "${#BFF_SECRETS[@]}" -gt 0 ]; then
  SECRET_FLAG=(--set-secrets "$(IFS=,; echo "${BFF_SECRETS[*]}")")
fi

echo "▶ Deploy $BFF_SERVICE"
gcloud run deploy "$BFF_SERVICE" \
  --image "${IMAGE_ROOT}/web-bff:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 3200 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "$(IFS=,; echo "${BFF_ENV[*]}")" \
  "${SECRET_FLAG[@]}" \
  --quiet

echo "▶ Deploy $WEB_SERVICE"
gcloud run deploy "$WEB_SERVICE" \
  --image "${IMAGE_ROOT}/web-banking:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3 \
  --quiet

BFF_URL="$(gcloud run services describe "$BFF_SERVICE" --region "$REGION" --format='value(status.url)')"
WEB_URL="$(gcloud run services describe "$WEB_SERVICE" --region "$REGION" --format='value(status.url)')"

echo ""
echo "=== DEPLOY OK ==="
echo "BFF (temporário):  $BFF_URL/v1/health"
echo "Web (temporário):  $WEB_URL"
echo ""
echo "Próximo: domínios regenerabank.com"
echo "  bash scripts/deploy/homolog-gcp/map-domains.sh"
echo ""
echo "Ou Console: Cloud Run → serviço → Integrações → Domínios personalizados"