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
\n#!/bin/bash
# |---------------------------------------------------------------------------------------|
# |---------------------------------------------------------------------------------------|
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

set -e

PROJECT_ID="project-93b8df04-72ab-4e44-8a6"
BILLING_ACCOUNT="01B966-242F29-8B2218"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      INICIANDO PROTOCOLO DE ATIVAÇÃO GCP E VERTEX AI         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Autenticação
echo -e "${CYAN}[1/4] Ancorando projeto...${NC}"
gcloud config set project $PROJECT_ID

# 2. Ligação do Faturamento (Obrigatório para Vertex AI)
echo -e "${CYAN}[2/4] Acoplando Billing Account ($BILLING_ACCOUNT)...${NC}"
# Requer componentes beta do gcloud. Se não tiver, o script avisa.
gcloud beta billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT || {
    echo -e "${RED}Erro ao ligar faturamento. Verifique se tem permissões de 'Billing Account Administrator'.${NC}"
    exit 1
}

# 3. Ativação das APIs (Vertex e Secrets)
echo -e "${CYAN}[3/4] Ligando Motores Neurais e Cofres (APIs)...${NC}"
echo "Isto pode demorar até 60 segundos nos servidores da Google. Aguarde..."

gcloud services enable \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  vision.googleapis.com \
  iam.googleapis.com \
  --project $PROJECT_ID

# 4. Verificação de Ativação do Vertex AI
echo -e "${CYAN}[4/4] Verificando integridade da Vertex AI...${NC}"
if gcloud services list --enabled --project $PROJECT_ID | grep -q "aiplatform.googleapis.com"; then
    echo -e "${GREEN}✔ Vertex AI (Raphaela A.I.) ativado e pronto para receber inferências.${NC}"
else
    echo -e "${RED}✖ Falha na ativação da Vertex AI.${NC}"
    exit 1
fi

if gcloud services list --enabled --project $PROJECT_ID | grep -q "secretmanager.googleapis.com"; then
    echo -e "${GREEN}✔ Secret Manager ativado. Cofre pronto.${NC}"
else
    echo -e "${RED}✖ Falha na ativação do Secret Manager.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN} PROTOCOLO CONCLUÍDO. A INFRAESTRUTURA ESTÁ OPERACIONAL.      ${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo "Pode agora executar os comandos de criação de segredos e o DEPLOY.sh principal."

echo ""
echo "MANIFESTE: Secrets devem ser criados no Secret Manager (nomes exatos):"
echo "  gcloud secrets create PROMETEO_API_KEY --data-file=-   # (valor da chave Prometeo)"
echo "  gcloud secrets create DATABASE_URL --data-file=-       # (Neon URL)"
echo "  gcloud secrets create JWT_NEURAL_SECRET --data-file=-"
echo "  gcloud secrets create GEMINI_API_KEY --data-file=-"
echo "  ... e os FIREBASE_* para backend"
echo ""
echo "Depois injete no Cloud Run com:"
echo '  gcloud run services update regenera-core-api \'
echo '    --set-secrets=DATABASE_URL=***REDACTED_DATABASE_URL***
echo '    --region=southamerica-east1 --project=project-93b8df04-72ab-4e44-8a6'
