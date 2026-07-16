#!/usr/bin/env bash
# Envia código + .env.homolog para VPS e sobe o stack.
# Uso:
#   VPS_IP=203.0.113.10 VPS_USER=root ./scripts/deploy/homolog-vps/deploy-from-mac.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
VPS_IP="${VPS_IP:?defina VPS_IP}"
VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/opt/regenera-bank}"
ENV_LOCAL="$ROOT/platform/docker/.env.homolog"

if [ ! -f "$ENV_LOCAL" ]; then
  echo "Crie platform/docker/.env.homolog a partir de .env.homolog.example"
  exit 1
fi

echo "Sync → ${VPS_USER}@${VPS_IP}:${REMOTE_DIR}"
ssh "${VPS_USER}@${VPS_IP}" "mkdir -p ${REMOTE_DIR}"
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude dist \
  --exclude artifacts \
  "$ROOT/" "${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/"

ssh "${VPS_USER}@${VPS_IP}" "bash ${REMOTE_DIR}/scripts/deploy/homolog-vps/bootstrap-ubuntu.sh"

echo "Deploy enviado. Confira https://api.regenerabank.com/v1/health após DNS."