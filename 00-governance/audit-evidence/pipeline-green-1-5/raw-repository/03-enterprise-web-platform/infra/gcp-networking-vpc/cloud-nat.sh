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
# Senior Cloud NAT & Router Setup
# Required for private GKE nodes and Cloud Run (via VPC connector) to access the internet securely.

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
NETWORK_NAME="bank-vpc"
REGION="${REGION:-southamerica-east1}"
ROUTER_NAME="bank-router"
NAT_NAME="bank-nat"

echo "[INFO] Provisioning Cloud NAT in $REGION for $NETWORK_NAME..."

# Create Cloud Router
if ! gcloud compute routers describe "$ROUTER_NAME" --region="$REGION" >/dev/null 2>&1; then
    echo "[INFO] Creating Cloud Router: $ROUTER_NAME"
    gcloud compute routers create "$ROUTER_NAME" \
        --network="$NETWORK_NAME" \
        --region="$REGION"
fi

# Create Cloud NAT with explicit logging (Compliance/Auditing)
if ! gcloud compute routers nats describe "$NAT_NAME" --router="$ROUTER_NAME" --region="$REGION" >/dev/null 2>&1; then
    echo "[INFO] Creating Cloud NAT: $NAT_NAME"
    gcloud compute routers nats create "$NAT_NAME" \
        --router="$ROUTER_NAME" \
        --region="$REGION" \
        --auto-allocate-nat-external-ips \
        --nat-all-subnet-ip-ranges \
        --enable-logging \
        --log-filter="TRANSLATIONS_ONLY"
fi

echo "[INFO] Cloud NAT configured. Outbound traffic is now routed securely."
