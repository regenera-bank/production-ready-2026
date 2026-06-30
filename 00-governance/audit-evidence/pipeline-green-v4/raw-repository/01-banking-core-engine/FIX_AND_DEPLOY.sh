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

#!/bin/bash
set -e

PROJECT_ID="project-93b8df04-72ab-4e44-8a6"
SA_EMAIL="regenera-runner@${PROJECT_ID}.iam.gserviceaccount.com"
cd "$(dirname "${BASH_SOURCE[0]}")"

# 1. Configurar Permissão Firebase Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/firebase.admin" >/dev/null 2>&1 || true

# 2. Deploy com as chaves injetadas do cofre
gcloud run deploy regenera-core-api \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --service-account "${SA_EMAIL}" \
  --set-env-vars NODE_ENV=production \
  --set-secrets="PROMETEO_API_KEY=PROMETEO_API_KEY:latest,JWT_NEURAL_SECRET=JWT_NEURAL_SECRET:latest,GEMINI_API_KEY=***REDACTED_GEMINI_API_KEY***" \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --quiet

echo "✔ DEPLOY CONCLUÍDO. FIREBASE INTEGRADO."
