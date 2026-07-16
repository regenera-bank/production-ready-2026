#!/usr/bin/env bash
# Bootstrap homolog VPS — Ubuntu 24.04
# Rode na VPS como root (ou sudo):
#   curl -fsSL https://raw.githubusercontent.com/...  OU copie este script via scp
#   bash bootstrap-ubuntu.sh
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/regenera-bank}"
COMPOSE_FILE="platform/docker/docker-compose.homolog.yml"
ENV_FILE="platform/docker/.env.homolog"

echo "== Regenera homolog VPS =="

if ! command -v docker >/dev/null 2>&1; then
  echo "Instalando Docker..."
  apt-get update -qq
  apt-get install -y ca-certificates curl git
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Clone o monorepo em $REPO_DIR antes de continuar."
  echo "  git clone <seu-repo> $REPO_DIR"
  exit 1
fi

cd "$REPO_DIR"

if [ ! -f "$ENV_FILE" ]; then
  cp platform/docker/.env.homolog.example "$ENV_FILE"
  echo "Crie $ENV_FILE com Didit + Firebase + JWT e rode de novo."
  exit 1
fi

echo "Build e subida do stack homolog..."
docker compose -f "$COMPOSE_FILE" up -d --build

PUBLIC_IP="$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')"
echo ""
echo "VPS IP público: $PUBLIC_IP"
echo "GoDaddy → Registros DNS:"
echo "  A  api  →  $PUBLIC_IP"
echo "  A  app  →  $PUBLIC_IP"
echo ""
echo "Após DNS propagar (5–30 min):"
echo "  https://api.regenerabank.com/v1/health"
echo "  https://app.regenerabank.com"
echo ""
echo "Registrar webhook Didit:"
echo "  DIDIT_WEBHOOK_PUBLIC_URL=https://api.regenerabank.com/v1/webhooks/didit \\"
echo "    node scripts/integrations/register-didit-webhook.mjs"