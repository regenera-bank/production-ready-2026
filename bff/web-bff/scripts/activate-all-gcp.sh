#!/usr/bin/env bash
# Ativa todas as APIs GCP usadas pelo Regenera Bank (canal web + core + producao).
#
# Projetos:
#   regenera-bank-501015  -- infra, Vertex, deploy, KYC Vision, eventos
#   project-93b8df04-72ab-4e44-8a6 -- Firebase Auth (canal web)
#
# Uso:
#   gcloud auth login finance@regenerabank.world
#   bash scripts/activate-all-gcp.sh

set -euo pipefail

BILLING_PROD="01ED4C-0F7557-750C39"
PROJECT_PROD="regenera-bank-501015"
PROJECT_FIREBASE="project-93b8df04-72ab-4e44-8a6"

# 40 APIs uteis — cliente, core, deploy, seguranca, operacao
PROD_APIS_CORE=(
  aiplatform.googleapis.com
  generativelanguage.googleapis.com
  vision.googleapis.com
  documentai.googleapis.com
  language.googleapis.com
  speech.googleapis.com
  texttospeech.googleapis.com
  spanner.googleapis.com
  sqladmin.googleapis.com
  redis.googleapis.com
  cloudtasks.googleapis.com
  cloudscheduler.googleapis.com
  cloudfunctions.googleapis.com
  workflows.googleapis.com
  workflowexecutions.googleapis.com
  pubsub.googleapis.com
  run.googleapis.com
  cloudbuild.googleapis.com
  artifactregistry.googleapis.com
  compute.googleapis.com
  vpcaccess.googleapis.com
  servicenetworking.googleapis.com
  dns.googleapis.com
  secretmanager.googleapis.com
  cloudkms.googleapis.com
  iam.googleapis.com
  iamcredentials.googleapis.com
  recaptchaenterprise.googleapis.com
  webrisk.googleapis.com
  binaryauthorization.googleapis.com
  containeranalysis.googleapis.com
  securitycenter.googleapis.com
  logging.googleapis.com
  monitoring.googleapis.com
  cloudtrace.googleapis.com
  cloudprofiler.googleapis.com
  apikeys.googleapis.com
  cloudresourcemanager.googleapis.com
  storage.googleapis.com
  apigateway.googleapis.com
)

# 15 APIs fase 2 — analytics, K8s, compliance avancado
PROD_APIS_PHASE2=(
  privateca.googleapis.com
  accesscontextmanager.googleapis.com
  bigquery.googleapis.com
  bigqueryconnection.googleapis.com
  bigquerystorage.googleapis.com
  dataflow.googleapis.com
  container.googleapis.com
  gkehub.googleapis.com
  dialogflow.googleapis.com
  eventarc.googleapis.com
  networkmanagement.googleapis.com
  networksecurity.googleapis.com
  assuredworkloads.googleapis.com
  websecurityscanner.googleapis.com
  cloudasset.googleapis.com
)

PROD_APIS=("${PROD_APIS_CORE[@]}" "${PROD_APIS_PHASE2[@]}")

FIREBASE_APIS=(
  firebase.googleapis.com
  identitytoolkit.googleapis.com
  securetoken.googleapis.com
  firestore.googleapis.com
  firebaseappcheck.googleapis.com
  firebasehosting.googleapis.com
  firebaseinstallations.googleapis.com
  fcm.googleapis.com
  firebasestorage.googleapis.com
  firebaserules.googleapis.com
)

has_project_access() {
  local project="$1"
  gcloud projects describe "${project}" --format='value(projectId)' >/dev/null 2>&1
}

link_billing() {
  local project="$1"
  local account="$2"
  echo "-> Billing ${project} -> ${account}"
  gcloud billing projects link "${project}" --billing-account="${account}" 2>/dev/null || \
    echo "  (ja vinculado ou sem permissao)"
}

enable_apis() {
  local project="$1"
  shift
  local apis=("$@")
  local batch_size=20
  echo ""
  echo "============================================================"
  echo " Projeto: ${project}"
  echo " APIs: ${#apis[@]}"
  echo "============================================================"

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    printf '  %s\n' "${apis[@]}"
    return 0
  fi

  if ! has_project_access "${project}"; then
    echo "[ERRO] Conta $(gcloud config get-value account 2>/dev/null) sem acesso a ${project}"
    return 1
  fi

  local i=0
  local total="${#apis[@]}"
  while [[ "${i}" -lt "${total}" ]]; do
    local batch=("${apis[@]:i:batch_size}")
    local end=$((i + ${#batch[@]}))
    echo "-> Lote $((i / batch_size + 1)): APIs $((i + 1))-${end} de ${total}"
    gcloud services enable "${batch[@]}" --project="${project}"
    i=$((i + batch_size))
  done

  echo "[OK] ${#apis[@]} APIs solicitadas em ${project}"
}

verify_apis() {
  local project="$1"
  shift
  local apis=("$@")
  local missing=0
  local api

  for api in "${apis[@]}"; do
    if ! gcloud services list --enabled --project="${project}" \
      --filter="config.name:${api}" --format='value(config.name)' 2>/dev/null | grep -q "${api}"; then
      echo "  FALTA: ${api}"
      missing=$((missing + 1))
    fi
  done

  if [[ "${missing}" -eq 0 ]]; then
    echo "[OK] ${project}: ${#apis[@]}/${#apis[@]} APIs Regenera ativas"
  else
    echo "[WARN] ${project}: faltam ${missing} API(s)"
  fi
}

count_enabled() {
  local project="$1"
  gcloud services list --enabled --project="${project}" \
    --format='value(config.name)' 2>/dev/null | wc -l | tr -d ' '
}

echo "Regenera Bank -- ativacao GCP"
echo "Conta: $(gcloud config get-value account 2>/dev/null || echo '?')"
echo "Pacote: ${#PROD_APIS_CORE[@]} uteis + ${#PROD_APIS_PHASE2[@]} fase 2 = ${#PROD_APIS[@]} APIs"
echo ""

if [[ "${GCP_FIREBASE_ONLY:-0}" == "1" ]]; then
  if ! has_project_access "${PROJECT_FIREBASE}"; then
    echo "[ERRO] $(gcloud config get-value account 2>/dev/null) nao acessa ${PROJECT_FIREBASE}"
    echo ""
    echo "Faca login com a conta dona do Firebase ANTES de rodar:"
    echo "  gcloud auth login inovaagora5@gmail.com"
    echo "  GCP_FIREBASE_ONLY=1 bash scripts/activate-all-gcp.sh"
    exit 1
  fi
  enable_apis "${PROJECT_FIREBASE}" "${FIREBASE_APIS[@]}"
  verify_apis "${PROJECT_FIREBASE}" "${FIREBASE_APIS[@]}"
  echo "Concluido (Firebase only)."
  exit 0
fi

link_billing "${PROJECT_PROD}" "${BILLING_PROD}"

if [[ "${GCP_CORE_ONLY:-0}" == "1" ]]; then
  enable_apis "${PROJECT_PROD}" "${PROD_APIS_CORE[@]}"
elif [[ "${GCP_PHASE2_ONLY:-0}" == "1" ]]; then
  enable_apis "${PROJECT_PROD}" "${PROD_APIS_PHASE2[@]}"
else
  enable_apis "${PROJECT_PROD}" "${PROD_APIS[@]}"
fi

if has_project_access "${PROJECT_FIREBASE}"; then
  enable_apis "${PROJECT_FIREBASE}" "${FIREBASE_APIS[@]}"
else
  echo ""
  echo "[SKIP] Sem acesso a ${PROJECT_FIREBASE} com $(gcloud config get-value account 2>/dev/null)"
  echo "       Firebase ja funciona se as APIs foram ativadas pelo dono do projeto."
  echo "       Rode com a conta que criou o Firebase, ex.:"
  echo "         gcloud auth login inovaagora5@gmail.com"
  echo "         GCP_FIREBASE_ONLY=1 bash scripts/activate-all-gcp.sh"
fi

if [[ "${DRY_RUN:-0}" != "1" ]]; then
  echo ""
  echo "Total habilitadas em ${PROJECT_PROD}: $(count_enabled "${PROJECT_PROD}")"
  if has_project_access "${PROJECT_FIREBASE}"; then
    echo "Total habilitadas em ${PROJECT_FIREBASE}: $(count_enabled "${PROJECT_FIREBASE}")"
  fi
  echo ""
  if [[ "${GCP_CORE_ONLY:-0}" == "1" ]]; then
    verify_apis "${PROJECT_PROD}" "${PROD_APIS_CORE[@]}"
  elif [[ "${GCP_PHASE2_ONLY:-0}" == "1" ]]; then
    verify_apis "${PROJECT_PROD}" "${PROD_APIS_PHASE2[@]}"
  else
    verify_apis "${PROJECT_PROD}" "${PROD_APIS[@]}"
  fi
  if has_project_access "${PROJECT_FIREBASE}"; then
    verify_apis "${PROJECT_FIREBASE}" "${FIREBASE_APIS[@]}"
  fi
fi

echo ""
echo "============================================================"
echo " Concluido."
echo ""
echo " Proximos passos:"
echo "   1. ADC local Vertex: gcloud auth application-default login"
echo "   2. Segredos: npm run bootstrap-secrets && npm run pull-secrets"
echo "   3. Health: curl http://localhost:3200/v1/health/integrations"
echo "============================================================"