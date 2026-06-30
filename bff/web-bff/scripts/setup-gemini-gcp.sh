#!/usr/bin/env bash
# Provisiona Gemini (Raphaela) no projeto GCP isolado — regenera-bank-501015
# Uso: bash scripts/setup-gemini-gcp.sh
# Login: gcloud auth login finance@regenerabank.world  (ou conta com acesso ao projeto)

set -euo pipefail

PROJECT_ID="regenera-bank-501015"
PROJECT_NUMBER="241009885907"
BILLING_ACCOUNT="01ED4C-0F7557-750C39"
SA_ID="raphaela-bff"
SA_EMAIL="${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_DISPLAY="regenera-raphaela-gemini"

echo "→ Projeto: ${PROJECT_ID} (${PROJECT_NUMBER})"
gcloud config set project "${PROJECT_ID}"

echo "→ Vinculando billing ${BILLING_ACCOUNT}..."
gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT}" 2>/dev/null || \
  echo "  (billing já vinculado ou sem permissão — confira no Console)"

echo "→ Ativando APIs..."
gcloud services enable \
  generativelanguage.googleapis.com \
  aiplatform.googleapis.com \
  apikeys.googleapis.com \
  --project="${PROJECT_ID}"

wait_for_sa() {
  local attempt=1
  while [[ "${attempt}" -le 12 ]]; do
    if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
      return 0
    fi
    echo "  aguardando propagação da SA (${attempt}/12)..."
    sleep 5
    attempt=$((attempt + 1))
  done
  echo "ERRO: conta de serviço ${SA_EMAIL} não ficou visível a tempo."
  exit 1
}

bind_sa_role() {
  local attempt=1
  while [[ "${attempt}" -le 6 ]]; do
    if gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/aiplatform.user" \
      --quiet 2>/dev/null; then
      return 0
    fi
    echo "  aguardando IAM da SA (${attempt}/6)..."
    sleep 5
    attempt=$((attempt + 1))
  done
  echo "  aviso: não foi possível vincular roles/aiplatform.user (API key AIza segue funcionando)"
}

echo "→ Conta de serviço ${SA_ID}..."
if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SA_ID}" \
    --display-name="Raphaela BFF — Gemini isolado" \
    --project="${PROJECT_ID}"
fi
wait_for_sa
bind_sa_role

KEY_FILE="${HOME}/raphaela-bff-${PROJECT_ID}.json"
if [[ -f "${KEY_FILE}" ]]; then
  echo "→ JSON da SA já existe: ${KEY_FILE}"
elif gcloud iam service-accounts keys create "${KEY_FILE}" \
  --iam-account="${SA_EMAIL}" \
  --project="${PROJECT_ID}" 2>/dev/null; then
  echo "→ Chave JSON da SA (não commitar): ${KEY_FILE}"
else
  echo "→ JSON da SA bloqueado por política da org (ok — usaremos API key AIza…)"
fi

echo "→ Criando API key Gemini (AIza…)..."
CREATE_LOG=$(mktemp)
if gcloud services api-keys create \
  --display-name="${KEY_DISPLAY}" \
  --api-target=service=generativelanguage.googleapis.com \
  --project="${PROJECT_ID}" 2>&1 | tee "${CREATE_LOG}"; then
  KEY_STRING=$(grep -oE 'keyString":"AIza[^"]+' "${CREATE_LOG}" | head -1 | cut -d'"' -f3 || true)
fi
rm -f "${CREATE_LOG}"

if [[ -z "${KEY_STRING}" ]]; then
  KEY_UID=$(gcloud services api-keys list --project="${PROJECT_ID}" \
    --filter="displayName:${KEY_DISPLAY}" --format='value(uid)' --limit=1 2>/dev/null || true)
  if [[ -n "${KEY_UID}" ]]; then
    KEY_STRING=$(gcloud services api-keys get-key-string "${KEY_UID}" --project="${PROJECT_ID}" --format='value(keyString)' 2>/dev/null || true)
  fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo " Projeto Gemini: ${PROJECT_ID}"
echo " Conta: finance@regenerabank.world"
echo "════════════════════════════════════════════════════════"
echo ""
if [[ -n "${KEY_STRING}" ]]; then
  echo "Cole em bff/web-bff/.env:"
  echo ""
  echo "GEMINI_GCP_PROJECT_ID=${PROJECT_ID}"
  echo "GEMINI_API_KEY=${KEY_STRING}"
  echo "GEMINI_API_KEY_FALLBACK="
  echo ""
  echo "Teste:"
  echo "curl -s \"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY_STRING}\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"contents\":[{\"parts\":[{\"text\":\"oi\"}]}]}'"
else
  echo "Chave criada — recupere com:"
  echo "  gcloud services api-keys list --project=${PROJECT_ID}"
  echo "  gcloud services api-keys get-key-string KEY_UID"
fi
echo ""
echo "AI Studio (créditos do NOVO projeto):"
echo "  https://aistudio.google.com/apikey"
echo ""
echo "Restrinja a chave no Console → Credentials → IP do servidor"
echo "Budget: https://console.cloud.google.com/billing/budgets?project=${PROJECT_ID}"
echo "════════════════════════════════════════════════════════"