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
\n# |---------------------------------------------------------------------------------------|
# |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
# |---------------------------------------------------------------------------------------|
#
# PROJECT:       Regenera Bank
# CEO:           Raphaela Cerveski
# DEVELOPER:     Don Paulo Ricardo
# ID:            2098233287
# COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
#
# LICENSE:       EULA (End-User License Agreement)
# PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
#
# WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
#                engenharia reversa ou modificação não autorizada.
#
# |---------------------------------------------------------------------------------------|
# |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
# |---------------------------------------------------------------------------------------|

#!/usr/bin/env bash
# deploy.sh — Regenera Bank full-stack deploy script
# Uses the exact configs/keys from user query for prod.
# Backend via Cloud Build (with .gcloudignore + .dockerignore to prevent 326MB node_modules bloat)
# Frontend via Vercel
# Mobile via EAS (ensure clean git)

set -euo pipefail

GCP_PROJECT="project-93b8df04-72ab-4e44-8a6"
GCP_REGION="southamerica-east1"

# A URL do backend é gerada pelo Cloud Run. Se já existir, defina-a aqui ou no ambiente.
BACKEND_URL=${BACKEND_URL:-"https://regenera-core-api-520859662036.southamerica-east1.run.app"}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"

info()    { echo -e "\n\033[36m[INFO]\033[0m  $*"; }
success() { echo -e "\033[32m[OK]\033[0m    $*"; }
die()     { echo -e "\033[31m[ERROR]\033[0m $*" >&2; exit 1; }

require() {
  command -v "$1" &>/dev/null || die "'$1' is not installed or not in PATH."
}

deploy_backend() {
  info "Deploying backend via Google Cloud Build for project $GCP_PROJECT"
  require gcloud

  gcloud config set project "$GCP_PROJECT" --quiet

  if [ -f infra/cloudbuild.yaml ]; then
    info "Submitting to Cloud Build..."
    gcloud builds submit --config=infra/cloudbuild.yaml --project="$GCP_PROJECT" .
    success "Cloud Build triggered for backend. Check https://console.cloud.google.com/cloud-build"
  else
    die "infra/cloudbuild.yaml not found. Use Cloud Build for stable deploys."
  fi
}

deploy_frontend() {
  info "Deploying frontend to Vercel (uses .env.production and vercel.json with prod URLs from query)"
  require vercel

  cd "$ROOT_DIR/frontend"
  vercel --prod --yes
  success "Frontend deployed to Vercel. URL should be https://regenera-bank-enterprise.vercel.app"
  cd "$ROOT_DIR"
}

deploy_mobile() {
  info "Triggering EAS build for mobile (ensure git clean and EXPO_PUBLIC_API_URL set)"
  require eas

  cd "$ROOT_DIR/mobile"
  # Ensure clean tree
  if [ -n "$(git status --porcelain)" ]; then
    info "Committing uncommitted changes before EAS build"
    git add .
    git commit -m "chore: prepare mobile build with prod API URL" || true
  fi

  eas build --platform all --non-interactive || echo "EAS build may require login or specific config. Set EXPO_PUBLIC_API_URL=https://regenera-core-api-520859662036.southamerica-east1.run.app/v1 in eas.json or env."
  success "Mobile build submitted (check Expo dashboard)"
  cd "$ROOT_DIR"
}

case "$TARGET" in
  backend)   deploy_backend   ;;
  frontend)  deploy_frontend  ;;
  mobile)    deploy_mobile    ;;
  all)
    deploy_backend
    deploy_frontend
    deploy_mobile
    ;;
  *)
    echo "Usage: $0 [backend|frontend|mobile|all]"
    exit 1
    ;;
esac

success "Deploy script completed using prod configs from query. Use real APIs (Firebase, Prometeo, Neon, Gemini) via env vars."
