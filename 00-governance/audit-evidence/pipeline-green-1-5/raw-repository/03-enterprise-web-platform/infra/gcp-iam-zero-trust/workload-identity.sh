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
# Senior Workload Identity Setup Script
# Maps Kubernetes Service Accounts (KSAs) to Google Service Accounts (GSAs) without exporting keys.

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
NAMESPACE="bank-production"
KSA_NAME="backend-ksa"
GSA_NAME="backend-sa"

echo "[INFO] Configuring Workload Identity for $KSA_NAME -> $GSA_NAME..."

# Create Namespace if it doesn't exist
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Create GCP Service Account if it doesn't exist
if ! gcloud iam service-accounts describe "${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
    echo "[INFO] Creating GSA: $GSA_NAME"
    gcloud iam service-accounts create "$GSA_NAME" \
        --display-name="Backend Workload Identity Service Account" \
        --description="Zero-trust GSA mapped to backend pod"
fi

# Allow Kubernetes Service Account to impersonate the GCP Service Account
echo "[INFO] Binding KSA to GSA via IAM policy..."
gcloud iam service-accounts add-iam-policy-binding "${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="serviceAccount:${PROJECT_ID}.svc.id.goog[${NAMESPACE}/${KSA_NAME}]"

# Create Kubernetes Service Account
kubectl create serviceaccount "$KSA_NAME" --namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Annotate the Kubernetes Service Account for the GKE Metadata Server
echo "[INFO] Annotating KSA..."
kubectl annotate serviceaccount "$KSA_NAME" \
    --namespace "$NAMESPACE" \
    iam.gke.io/gcp-service-account="${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --overwrite

echo "[INFO] Workload Identity configuration applied successfully. Pods using $KSA_NAME will inherit $GSA_NAME."
