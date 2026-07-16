#!/usr/bin/env node
/**
 * Garante workflow Didit: RG+CNH, câmera+upload, selfie ACTIVE_3D, face match, desktop.
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const configPath = path.join(
  __dirname,
  '..',
  'src',
  'integrations',
  'didit',
  'didit-workflow.config.ts',
);

const parseEnv = (file) => {
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
};

const readWorkflowId = () => {
  const src = readFileSync(configPath, 'utf8');
  const match = src.match(/DIDIT_KYC_WORKFLOW_ID\s*=\s*'([^']+)'/);
  if (!match?.[1]) {
    throw new Error('DIDIT_KYC_WORKFLOW_ID ausente em didit-workflow.config.ts');
  }
  return match[1];
};

const env = parseEnv(envPath);
const apiKey = env.DIDIT_API_KEY;
const workflowId = readWorkflowId();
const livenessMethod = env.DIDIT_LIVENESS_METHOD || 'ACTIVE_3D';

if (!apiKey) {
  console.error(JSON.stringify({ verdict: 'FAIL', reason: 'DIDIT_API_KEY ausente em .env.local' }));
  process.exit(1);
}

const base = 'https://verification.didit.me';

const desiredPatchBody = () => ({
  workflow_label: 'Regenera Web KYC',
  is_white_label_enabled: true,
  is_desktop_allowed: true,
  face_liveness_max_attempts: 3,
  max_retry_attempts: 3,
  features: [
    {
      feature: 'OCR',
      config: {
        documents_allowed: {
          BRA: {
            ID: { enabled: 1, sides: 2 },
            DL: { enabled: 1, sides: 1 },
          },
        },
        image_capture_methods_allowed: ['CAMERA_SCAN', 'UPLOAD'],
      },
    },
    {
      feature: 'LIVENESS',
      config: {
        face_liveness_method: livenessMethod,
        face_liveness_max_attempts: 3,
      },
    },
    { feature: 'FACE_MATCH' },
    { feature: 'IP_ANALYSIS' },
  ],
});

const getWorkflow = async () => {
  const res = await fetch(`${base}/v3/workflows/${workflowId}/`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`GET workflow HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
};

const patchWorkflow = async () => {
  const res = await fetch(`${base}/v3/workflows/${workflowId}/`, {
    method: 'PATCH',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(desiredPatchBody()),
  });
  if (!res.ok) throw new Error(`PATCH workflow HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return res.json();
};

const main = async () => {
  const before = await getWorkflow();
  const raw = JSON.stringify(before);
  const featureStr = String(before.features ?? '');
  const braDlSides = before.workflow_graph?.nodes?.ocr?.config?.documents_allowed?.BRA?.DL?.sides;
  const needsPatch =
    before.is_white_label_enabled !== true ||
    before.is_desktop_allowed !== true ||
    !featureStr.includes('LIVENESS') ||
    !featureStr.includes('FACE_MATCH') ||
    !raw.includes('UPLOAD') ||
    !raw.includes('"BRA"') ||
    braDlSides !== 1;

  const after = needsPatch ? await patchWorkflow() : before;

  const bra = after.workflow_graph?.nodes?.ocr?.config?.documents_allowed?.BRA ?? {};
  console.log(
    JSON.stringify({
      verdict: 'PASS',
      workflow_id: workflowId,
      patched: needsPatch,
      status: after.status,
      is_white_label_enabled: after.is_white_label_enabled,
      is_desktop_allowed: after.is_desktop_allowed,
      liveness_method: livenessMethod,
      label: after.workflow_label,
      features: after.features,
      capture_methods: ['CAMERA_SCAN', 'UPLOAD'],
      documents_bra: {
        ID: { label: 'RG', sides: bra.ID?.sides, enabled: bra.ID?.enabled },
        DL: {
          label: 'CNH',
          sides: bra.DL?.sides,
          enabled: bra.DL?.enabled,
          note: 'Didit fixa sides=1 para BRA DL — PDF CNH-e único ou foto frente física',
        },
      },
      forensic_script: 'node scripts/didit-forensic-study.mjs',
    }),
  );
};

main().catch((err) => {
  console.error(JSON.stringify({ verdict: 'FAIL', error: String(err.message ?? err) }));
  process.exit(1);
});