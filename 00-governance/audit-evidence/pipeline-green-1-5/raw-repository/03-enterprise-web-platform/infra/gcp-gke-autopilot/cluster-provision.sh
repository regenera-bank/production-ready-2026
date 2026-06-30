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
# Senior GKE Autopilot Provisioning Script
# Security: Private nodes, master authorized networks, Workload Identity, Shielded Nodes, Datapath V2

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
CLUSTER_NAME="${CLUSTER_NAME:-regenera-autopilot-cluster}"
REGION="${REGION:-southamerica-east1}"
NETWORK="${NETWORK:-bank-vpc}"
SUBNET="${SUBNET:-k8s-subnet}"

echo "[INFO] Provisioning secure GKE Autopilot Cluster: $CLUSTER_NAME in $REGION..."

# Compliance: Requires execution auditing (Mock logging)
echo "[AUDIT] GKE Provisioning initiated by user: $(gcloud config get-value account) for project: $PROJECT_ID"

# Strict cluster creation:
# - enable-private-nodes: No public IPs for nodes
# - enable-master-authorized-networks: Restrict control plane access
# - workload-pool: Enable Workload Identity (Zero-Trust)
# - binauthz-evaluation-mode: Enforce container signatures
# - release-channel: Rapid/Regular based on env
# - enable-dataplane-v2: Enhanced network policies/security
# - shielded-nodes: Boot integrity

gcloud container clusters create-auto "$CLUSTER_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --network="$NETWORK" \
    --subnetwork="$SUBNET" \
    --enable-private-nodes \
    --master-ipv4-cidr="172.16.0.0/28" \
    --workload-pool="${PROJECT_ID}.svc.id.goog" \
    --release-channel="regular" \
    --enable-master-authorized-networks \
    --master-authorized-networks="10.8.0.0/28" \
    --binauthz-evaluation-mode="PROJECT_SINGLETON_POLICY_ENFORCE" \
    --enable-dataplane-v2 \
    --enable-shielded-nodes \
    --labels="env=production,app=core-banking,compliance=bacen"

echo "[INFO] GKE Autopilot cluster $CLUSTER_NAME provisioned successfully."
echo "[INFO] Fetching credentials..."
gcloud container clusters get-credentials "$CLUSTER_NAME" --region="$REGION" --project="$PROJECT_ID"
