#!/usr/bin/env node
/**
 * Habilita white-label Didit no workflow Regenera + aplica paleta de marca via API.
 * Requer DIDIT_API_KEY em .env.local. Logos opcionais via DIDIT_LOGO_SQUARE / DIDIT_LOGO_RECT.
 */
import { readFileSync, existsSync } from 'fs';
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

const BASE = 'https://verification.didit.me';

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
  if (!match?.[1]) throw new Error('DIDIT_KYC_WORKFLOW_ID ausente em didit-workflow.config.ts');
  return match[1];
};

/** Paleta Regenera — tokens do canal web (cyan/navy, Manrope). */
const REGENERA_BRANDING = {
  app_public_name: 'Regenera Bank',
  privacy_policy_url: 'https://regenerabank.world/privacy',
  color_primary: '#22d3ee',
  color_secondary: '#94a3b8',
  color_background: '#020713',
  color_panel: '#0b1a33',
  color_panel_10: '#050b17',
  color_on_panel_1: '#94a3b8',
  color_on_panel_2: '#e2e8f0',
  color_on_background: '#e2e8f0',
  color_button_1: '#1498de',
  color_button_2: '#213dea',
  color_button_text_1: '#ffffff',
  color_button_text_2: '#e2e8f0',
  color_pill_text: '#cbd5e1',
  border_radius_panel: 16,
  border_radius_buttons: 12,
  font_family: 'Manrope',
  font_weight: '600',
  skip_welcome_screen: true,
  disable_login_with_didit: true,
  hide_progress_bar: false,
};

const apiFetch = async (apiKey, url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': apiKey,
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { res, json };
};

const getBranding = async (apiKey) => {
  const { res, json } = await apiFetch(apiKey, `${BASE}/v3/customization/`);
  if (!res.ok) throw new Error(`GET customization HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
};

const patchBrandingJson = async (apiKey, body) => {
  const { res, json } = await apiFetch(apiKey, `${BASE}/v3/customization/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH customization HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
};

const uploadLogos = async (apiKey, logoSquare, logoRect) => {
  const form = new FormData();
  if (logoSquare && existsSync(logoSquare)) {
    const buf = readFileSync(logoSquare);
    form.append('image_square', new Blob([buf]), path.basename(logoSquare));
  }
  if (logoRect && existsSync(logoRect)) {
    const buf = readFileSync(logoRect);
    form.append('image_rectangular', new Blob([buf]), path.basename(logoRect));
  }
  if (![...form.keys()].length) return null;

  const { res, json } = await apiFetch(apiKey, `${BASE}/v3/customization/`, {
    method: 'PATCH',
    body: form,
  });
  if (!res.ok) throw new Error(`PATCH logos HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
};

const getWorkflow = async (apiKey, workflowId) => {
  const { res, json } = await apiFetch(apiKey, `${BASE}/v3/workflows/${workflowId}/`);
  if (!res.ok) throw new Error(`GET workflow HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
};

const enableWhiteLabelOnWorkflow = async (apiKey, workflowId) => {
  const { res, json } = await apiFetch(apiKey, `${BASE}/v3/workflows/${workflowId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_white_label_enabled: true }),
  });
  if (!res.ok) throw new Error(`PATCH workflow white-label HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
};

const brandingNeedsPatch = (current) => {
  const keys = Object.keys(REGENERA_BRANDING);
  return keys.some((k) => String(current?.[k] ?? '') !== String(REGENERA_BRANDING[k]));
};

const main = async () => {
  const env = parseEnv(envPath);
  const apiKey = env.DIDIT_API_KEY;
  const workflowId = readWorkflowId();
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const defaultSquare = path.join(
    repoRoot,
    '01-design-system/web/reference-assets/corporate-we-bank/icon-512.png',
  );
  const logoSquare = env.DIDIT_LOGO_SQUARE || (existsSync(defaultSquare) ? defaultSquare : '');
  const logoRect = env.DIDIT_LOGO_RECT || '';

  if (!apiKey) {
    console.error(JSON.stringify({ verdict: 'FAIL', reason: 'DIDIT_API_KEY ausente em .env.local' }));
    process.exit(1);
  }

  const brandingBefore = await getBranding(apiKey);
  const workflowBefore = await getWorkflow(apiKey, workflowId);

  const brandingPatched = brandingNeedsPatch(brandingBefore)
    ? await patchBrandingJson(apiKey, REGENERA_BRANDING)
    : brandingBefore;

  let logosPatched = null;
  if (logoSquare || logoRect) {
    logosPatched = await uploadLogos(apiKey, logoSquare, logoRect);
  }

  const workflowAfter =
    workflowBefore.is_white_label_enabled === true
      ? workflowBefore
      : await enableWhiteLabelOnWorkflow(apiKey, workflowId);

  const brandingFinal = logosPatched ?? brandingPatched;

  console.log(
    JSON.stringify(
      {
        verdict: workflowAfter.is_white_label_enabled ? 'PASS' : 'FAIL',
        workflow_id: workflowId,
        workflow_uuid: workflowAfter.uuid ?? workflowId,
        is_white_label_enabled: workflowAfter.is_white_label_enabled,
        workflow_patched: workflowBefore.is_white_label_enabled !== true,
        branding_patched: brandingNeedsPatch(brandingBefore),
        logos_uploaded: Boolean(logosPatched),
        branding: {
          app_public_name: brandingFinal.app_public_name,
          color_background: brandingFinal.color_background,
          color_primary: brandingFinal.color_primary,
          color_button_1: brandingFinal.color_button_1,
          font_family: brandingFinal.font_family,
          logo_square: brandingFinal.logo_square ?? null,
          logo_rectangular: brandingFinal.logo_rectangular ?? null,
        },
        next: logosPatched
          ? null
          : 'Opcional: DIDIT_LOGO_SQUARE e DIDIT_LOGO_RECT (2:1) no .env.local e reexecutar',
        console_only: ['custom domain', 'white-label email'],
      },
      null,
      2,
    ),
  );

  if (!workflowAfter.is_white_label_enabled) process.exit(1);
};

main().catch((err) => {
  console.error(JSON.stringify({ verdict: 'FAIL', error: String(err.message ?? err) }));
  process.exit(1);
});