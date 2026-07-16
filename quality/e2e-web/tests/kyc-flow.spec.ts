import { expect, test } from '@playwright/test';
import { authHeaders, registerUser } from './helpers/bff-api';

const homologImage = (fillByte = 0xab): string => {
  const payload = Buffer.alloc(12_000, fillByte);
  return `data:image/png;base64,${payload.toString('base64')}`;
};

test.describe('BFF KYC — homolog', () => {
  test('documento inválido não conclui KYC sozinho', async ({ request }) => {
    const document = '25537755005';
    const session = await registerUser(request, document, 'E2E KYC Bad Doc');
    const headers = authHeaders(session.accessToken);
    await request.post('onboarding/kyc/submit', { headers });
    await request.post('onboarding/kyc/document', {
      headers,
      data: { fileBase64: 'not-an-image', type: 'RG' },
    });
    const status = await request.get('onboarding/status', { headers });
    const body = (await status.json()) as { kycStatus: string };
    expect(body.kycStatus).not.toBe('APPROVED');
  });

  test('pipeline homolog aprova com imagens válidas', async ({ request }) => {
    const document = '43667749090';
    const session = await registerUser(request, document, 'E2E KYC OK');
    const headers = authHeaders(session.accessToken);
    await request.post('onboarding/kyc/submit', { headers });
    const doc = await request.post('onboarding/kyc/document', {
      headers,
      data: { fileBase64: homologImage(0xab), type: 'RG' },
    });
    expect(doc.ok()).toBeTruthy();
    const selfie = await request.post('onboarding/kyc/selfie', {
      headers,
      data: { selfieBase64: homologImage(0xcd) },
    });
    expect(selfie.ok()).toBeTruthy();
    const status = await request.get('onboarding/status', { headers });
    const body = (await status.json()) as { kycStatus: string };
    expect(['APPROVED', 'IN_REVIEW']).toContain(body.kycStatus);
  });

  test('homolog KYC ativo em integrations health', async ({ request }) => {
    const health = await request.get('health/integrations');
    expect(health.ok()).toBeTruthy();
    const body = (await health.json()) as { integrations: { kycHomolog: boolean } };
    expect(body.integrations.kycHomolog).toBe(true);
  });
});