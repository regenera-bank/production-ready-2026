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
# =============================================================================
# Regenera Bank — EAS Build Script (Mobile)
# =============================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║        REGENERA BANK — EAS BUILD MOBILE          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------------------
# 0. Verificar dependências
# ---------------------------------------------------------------------------
echo "▶ Verificando dependências..."

if ! command -v node &> /dev/null; then
  echo "✗ Node.js não encontrado. Instale: https://nodejs.org"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "✗ npm não encontrado."
  exit 1
fi

# Instalar EAS CLI se necessário
if ! command -v eas &> /dev/null; then
  echo "→ Instalando EAS CLI..."
  npm install -g eas-cli
fi

echo "✓ EAS CLI: $(eas --version)"

# ---------------------------------------------------------------------------
# 1. Login no Expo
# ---------------------------------------------------------------------------
echo ""
echo "▶ Verificando autenticação Expo..."
if ! eas whoami &> /dev/null; then
  echo "→ Faça login no Expo:"
  eas login
fi
echo "✓ Logado como: $(eas whoami)"

# ---------------------------------------------------------------------------
# 2. Instalar dependências do projeto
# ---------------------------------------------------------------------------
echo ""
echo "▶ Instalando dependências npm..."
npm install
echo "✓ Dependências instaladas"

# ---------------------------------------------------------------------------
# 3. Configurar variáveis de ambiente para produção
# ---------------------------------------------------------------------------
echo ""
echo "▶ Configurando ambiente de produção..."

if [ -z "$EXPO_PUBLIC_API_URL" ]; then
  read -p "  → URL da API backend (ex: https://seu-backend.run.app): " API_URL
  export EXPO_PUBLIC_API_URL="$API_URL"
fi

echo "✓ EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"

# Criar .env.production local
cat > .env.production << EOF
EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
EOF

echo "✓ .env.production criado"

# ---------------------------------------------------------------------------
# 4. Configurar eas.json se não existir
# ---------------------------------------------------------------------------
if [ ! -f "eas.json" ]; then
  echo ""
  echo "▶ Criando eas.json..."
  cat > eas.json << 'EASJSON'
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {}
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "seu@email.com",
        "ascAppId": "SEU_APP_STORE_CONNECT_ID",
        "appleTeamId": "SEU_APPLE_TEAM_ID"
      }
    }
  }
}
EASJSON
  echo "✓ eas.json criado"
fi

# ---------------------------------------------------------------------------
# 5. Menu de build
# ---------------------------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              ESCOLHA O TIPO DE BUILD             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  1) Preview APK Android (distribuição interna)"
echo "  2) Production Android (Google Play)"
echo "  3) Production iOS (App Store)"
echo "  4) Production ambas (Android + iOS)"
echo "  5) Development build (debug)"
echo ""
read -p "Opção [1-5]: " BUILD_TYPE

case $BUILD_TYPE in
  1)
    echo ""
    echo "▶ Build Preview APK Android..."
    eas build --platform android --profile preview
    ;;
  2)
    echo ""
    echo "▶ Build Production Android..."
    eas build --platform android --profile production
    ;;
  3)
    echo ""
    echo "▶ Build Production iOS..."
    eas build --platform ios --profile production
    ;;
  4)
    echo ""
    echo "▶ Build Production Android + iOS..."
    eas build --platform all --profile production
    ;;
  5)
    echo ""
    echo "▶ Development Build..."
    eas build --platform android --profile development
    ;;
  *)
    echo "✗ Opção inválida"
    exit 1
    ;;
esac

# ---------------------------------------------------------------------------
# 6. Submit (opcional)
# ---------------------------------------------------------------------------
echo ""
read -p "Deseja fazer submit para as lojas agora? (s/N): " DO_SUBMIT
if [[ "$DO_SUBMIT" =~ ^[Ss]$ ]]; then
  echo ""
  echo "▶ Submetendo para as lojas..."
  case $BUILD_TYPE in
    2|4) eas submit --platform android --latest ;;
    3|4) eas submit --platform ios --latest ;;
  esac
  echo "✓ Submit concluído"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║              BUILD CONCLUÍDO!                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Acompanhe o build em: https://expo.dev/accounts/[seu-usuario]/projects/regenera-bank"
echo ""
