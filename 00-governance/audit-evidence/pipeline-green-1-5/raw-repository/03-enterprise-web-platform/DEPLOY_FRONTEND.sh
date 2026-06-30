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

echo "=== DEPLOY REGENERA BANK FRONTEND → VERCEL ==="

# 1. Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
  echo "Instalando Vercel CLI..."
  npm install -g vercel
fi

# 2. Criar/atualizar .env.production
cat > .env.production << 'ENV'
VITE_API_URL=https://regenera-bank-backend-<HASH>-uc.a.run.app
ENV

echo "⚠️  Atualize VITE_API_URL em .env.production com a URL real do Cloud Run antes de continuar."
echo "   A URL do backend está em: DEPLOY_BACKEND.sh (variável SERVICE_URL após o deploy)"
read -p "Pressione ENTER quando atualizar o .env.production..."

# 3. Instalar dependências
echo "Instalando dependências..."
npm install

# 4. Build
echo "Buildando..."
npm run build

# 5. Deploy para Vercel
echo "Fazendo deploy no Vercel..."
vercel --prod --name regenera-bank-enterprise

echo ""
echo "=== DEPLOY CONCLUÍDO ==="
echo "Acesse o dashboard do Vercel para a URL final."
echo ""
echo "Lembre-se de adicionar no Vercel Dashboard → Settings → Environment Variables:"
echo "  VITE_API_URL = <URL do Cloud Run Backend>"
