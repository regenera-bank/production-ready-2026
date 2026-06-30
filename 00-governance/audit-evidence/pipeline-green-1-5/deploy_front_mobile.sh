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

echo " [REGENERA BANK] Iniciando Deploy do Frontend Web e Mobile..."

# A URL do backend é vital para os apps saberem com quem falar em produção
export BACKEND_URL=${BACKEND_URL:-"https://regenera-core-api-520859662036.southamerica-east1.run.app"}

# 1. DEPLOY FRONTEND WEB (Vercel)
echo -e "\n🌐 [1/2] Iniciando Deploy da Interface Web Enterprise (Vite + FSD)..."
cd frontend
# O Vercel usará o .env.production configurado no painel
npx vercel --prod --yes
cd ..
echo "✅ Frontend Web distribuído com sucesso."

# 2. DEPLOY MOBILE (EAS / Expo)
echo -e "\n📱 [2/2] Iniciando Build em Nuvem dos binários Nativos (iOS e Android)..."
cd mobile
# Forçamos a URL de API de produção para o build do app
export EXPO_PUBLIC_API_URL="${BACKEND_URL}"
npx eas-cli build --platform all --profile production --non-interactive
cd ..
echo "✅ Mobile Builds submetidos à nuvem com sucesso."

echo -e "\n [REGENERA BANK] Processo de Deploy Front/Mobile Concluída."
