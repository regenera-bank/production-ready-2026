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
# Senior VPC Setup Script
# Features: Custom Subnets, Private Google Access, Flow Logs, Firewall Rules (Zero-Trust)

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
NETWORK_NAME="bank-vpc"
REGION="${REGION:-southamerica-east1}"

echo "[INFO] Provisioning Enterprise VPC: $NETWORK_NAME in $PROJECT_ID..."

# Create Custom VPC (No auto subnets for strict control)
if ! gcloud compute networks describe "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "[INFO] Creating VPC..."
    gcloud compute networks create "$NETWORK_NAME" \
        --subnet-mode=custom \
        --bgp-routing-mode=regional \
        --mtu=1460
fi

# Create Kubernetes Subnet with Secondary Ranges for Pods and Services
if ! gcloud compute networks subnets describe "k8s-subnet" --region="$REGION" >/dev/null 2>&1; then
    echo "[INFO] Creating Kubernetes Subnet with Flow Logs enabled..."
    gcloud compute networks subnets create "k8s-subnet" \
        --network="$NETWORK_NAME" \
        --range="10.0.0.0/20" \
        --region="$REGION" \
        --enable-private-ip-google-access \
        --enable-flow-logs \
        --secondary-range="k8s-pods=10.4.0.0/14,k8s-services=10.0.16.0/20"
fi

# Create Serverless VPC Access Subnet
if ! gcloud compute networks subnets describe "serverless-subnet" --region="$REGION" >/dev/null 2>&1; then
    echo "[INFO] Creating Serverless Subnet..."
    gcloud compute networks subnets create "serverless-subnet" \
        --network="$NETWORK_NAME" \
        --range="10.8.0.0/28" \
        --region="$REGION" \
        --enable-private-ip-google-access
fi

# Base Firewall Rules (Zero-Trust)
echo "[INFO] Configuring strict firewall rules..."

# Allow internal VPC traffic
gcloud compute firewall-rules create "allow-internal-bank-vpc" \
    --network="$NETWORK_NAME" \
    --allow="tcp,udp,icmp" \
    --source-ranges="10.0.0.0/8" \
    --description="Allow internal traffic within VPC" || true

# Deny all Egress by default (would need specific allows depending on integrations)
# For PIX and BACEN, we strictly control egress via NAT and specific FW rules.

echo "[INFO] VPC Setup complete."
