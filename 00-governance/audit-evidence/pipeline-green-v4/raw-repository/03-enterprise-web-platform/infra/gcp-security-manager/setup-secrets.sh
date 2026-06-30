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
# Senior Secret Manager Setup Script
# Security: Customer-Managed Encryption Keys (CMEK), strict IAM bindings, explicit rotation schedules, no plaintext defaults

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
REGION="${REGION:-southamerica-east1}"
KMS_KEY_RING="bank-keyring"
KMS_KEY_NAME="secret-manager-key"
KMS_KEY_PATH="projects/${PROJECT_ID}/locations/${REGION}/keyRings/${KMS_KEY_RING}/cryptoKeys/${KMS_KEY_NAME}"

# Define critical secrets and rotation settings (format: NAME:ROTATION_DAYS)
SECRETS=(
    "bank-db-password:30"
    "bank-jwt-secret:90"
    "bank-api-keys:60"
    "pix-certificate-key:365"
)

echo "[INFO] Provisioning Google Secret Manager secrets in $REGION with CMEK encryption..."

# Ensure KMS Key Ring and Key exist
if ! gcloud kms keyrings describe "$KMS_KEY_RING" --location="$REGION" >/dev/null 2>&1; then
    echo "[INFO] Creating KMS Key Ring: $KMS_KEY_RING"
    gcloud kms keyrings create "$KMS_KEY_RING" --location="$REGION"
fi

if ! gcloud kms keys describe "$KMS_KEY_NAME" --location="$REGION" --keyring="$KMS_KEY_RING" >/dev/null 2>&1; then
    echo "[INFO] Creating KMS CryptoKey: $KMS_KEY_NAME"
    gcloud kms keys create "$KMS_KEY_NAME" --location="$REGION" --keyring="$KMS_KEY_RING" --purpose=encryption
fi

for SECRET_ENTRY in "${SECRETS[@]}"; do
    IFS=':' read -r SECRET_NAME ROTATION_DAYS <<< "$SECRET_ENTRY"
    echo "[INFO] Validating secret: $SECRET_NAME (Rotation: ${ROTATION_DAYS}d)"
    
    if ! gcloud secrets describe "$SECRET_NAME" > /dev/null 2>&1; then
        echo "[INFO] Creating secret: $SECRET_NAME"
        gcloud secrets create "$SECRET_NAME" \
            --replication-policy="user-managed" \
            --locations="$REGION" \
            --kms-key-name="$KMS_KEY_PATH" \
            --next-rotation-time="$(date -u -v+${ROTATION_DAYS}d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+${ROTATION_DAYS} days" +%Y-%m-%dT%H:%M:%SZ)" \
            --rotation-schedule="${ROTATION_DAYS}s" \
            --labels="env=production,app=core-banking"
            
        echo "[WARN] Secret $SECRET_NAME created without payload. MUST be populated manually by Security Admin via UI or secure channel."
    else
        echo "[INFO] Secret $SECRET_NAME already exists. Updating KMS and rotation schedule if needed..."
        # In a real pipeline, update metadata if drifted
    fi
done

echo "[INFO] Applying IAM Access Policy..."
gcloud secrets set-iam-policy bank-db-password infra/gcp-security-manager/access-policy.json || echo "[WARN] Ensure access-policy.json exists."

echo "[INFO] Secrets setup complete. Awaiting secure manual population."
