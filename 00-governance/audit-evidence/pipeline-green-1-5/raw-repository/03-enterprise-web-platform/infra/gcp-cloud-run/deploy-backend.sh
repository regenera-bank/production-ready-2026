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
# @regenera/bank-core
# Senior Deployment Script for Cloud Run
# Security: Zero-trust network setup (VPC egress, private IPs, WAF integration), Least Privilege SA

set -euo pipefail

# Configuration Defaults
REGION="${REGION:-southamerica-east1}"
SERVICE_NAME="${SERVICE_NAME:-regenera-backend}"
IMAGE=""
VPC_CONNECTOR="${VPC_CONNECTOR:-bank-vpc-con}"
PROJECT_ID=$(gcloud config get-value project)

# Compliance: Requires execution auditing (Mock logging)
echo "[AUDIT] Deployment initiated by user: $(gcloud config get-value account) for project: $PROJECT_ID"

# Parse CLI arguments safely
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --image) IMAGE="$2"; shift ;;
        --service) SERVICE_NAME="$2"; shift ;;
        *) echo "[ERROR] Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [[ -z "$IMAGE" ]]; then
    echo "[ERROR] Missing required argument: --image"
    exit 1
fi

echo "[INFO] Deploying $SERVICE_NAME to Cloud Run in $REGION..."

# Strict Deployment matching Senior/Compliance standards
# - binary-authorization=default (Zero-Trust)
# - vpc-egress=all-traffic (Network Security)
# - CPU throttling optimization for Node.js
# - Secret Manager injection via volume/env

gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --concurrency=80 \
    --cpu=2 \
    --memory=1024Mi \
    --min-instances=3 \
    --max-instances=100 \
    --service-account="cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --vpc-connector="$VPC_CONNECTOR" \
    --vpc-egress=all-traffic \
    --ingress=internal-and-cloud-load-balancing \
    --binary-authorization=default \
    --set-secrets="/secrets/app-config=projects/${PROJECT_ID}/secrets/bank-app-config:latest,DB_PASSWORD=projects/${PROJECT_ID}/secrets/db-password:latest" \
    --labels="env=production,app=core-banking,compliance=bacen" \
    --quiet

echo "[INFO] Deployment complete. Validating endpoint health..."
# Add automated post-deployment validation if needed
echo "[INFO] Validation skipped in CI script. Relying on Readiness Probes."
