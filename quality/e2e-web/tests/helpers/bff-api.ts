import type { APIRequestContext } from '@playwright/test';

const sampleAddress = {
  street: 'Rua das Flores',
  number: '100',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '0130',
};

const homologImage = (fillByte = 0xab): string => {
  const payload = Buffer.alloc(12_000, fillByte);
  return `data:image/png;base64,${payload.toString('base64')}`;
};

export interface SessionDto {
  accessToken: string;
  userId: string;
  displayName: string;
  expiresAt: string;
  kycStatus: string;
  accountStatus: string;
}

export const authHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

export async function registerUser(
  request: APIRequestContext,
  document: string,
  displayName: string,
): Promise<SessionDto> {
  const response = await request.post('auth/register', {
    data: {
      document,
      password: 'secret-e2e',
      displayName,
      email: `${document}@e2e.regenera.test`,
      phone: '11999990000',
      birthDate: '1990-05-15',
      address: sampleAddress,
    },
  });
  if (response.status() === 409) {
    return loginUser(request, document);
  }
  if (!response.ok()) {
    throw new Error(`register ${document} failed: ${response.status()} ${await response.text()}`);
  }
  return response.json() as Promise<SessionDto>;
}

export async function loginUser(
  request: APIRequestContext,
  document: string,
  password = 'secret-e2e',
): Promise<SessionDto> {
  const response = await request.post('auth/session', {
    data: { document, password },
  });
  if (!response.ok()) {
    throw new Error(`login ${document} failed: ${response.status()} ${await response.text()}`);
  }
  return response.json() as Promise<SessionDto>;
}

export async function completeKycToApproved(
  request: APIRequestContext,
  token: string,
): Promise<void> {
  const headers = authHeaders(token);
  for (let attempt = 0; attempt < 6; attempt++) {
    const statusRes = await request.get('onboarding/status', { headers });
    const body = (await statusRes.json()) as {
      kycStep?: string;
      kycStatus?: string;
      accountStatus?: string;
    };
    if (body.kycStatus === 'APPROVED' && body.kycStep === 'done') {
      return;
    }
    if (body.kycStep === 'cadastral') {
      await request.post('onboarding/kyc/submit', { headers });
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }
    if (body.kycStep === 'document') {
      await request.post('onboarding/kyc/document', {
        headers,
        data: { fileBase64: homologImage(0xab), type: 'RG' },
      });
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }
    if (body.kycStep === 'selfie') {
      await request.post('onboarding/kyc/selfie', {
        headers,
        data: { selfieBase64: homologImage(0xcd) },
      });
      break;
    }
  }
  const finalStatus = await request.get('onboarding/status', { headers });
  const finalBody = (await finalStatus.json()) as { kycStatus?: string; kycStep?: string };
  if (finalBody.kycStatus !== 'APPROVED' || finalBody.kycStep !== 'done') {
    throw new Error(
      `KYC não aprovado: status=${finalBody.kycStatus} step=${finalBody.kycStep}`,
    );
  }
}

export async function completeKycAndOpenAccount(
  request: APIRequestContext,
  token: string,
): Promise<void> {
  const headers = authHeaders(token);
  const initial = await request.get('onboarding/status', { headers });
  if (initial.ok()) {
    const body = (await initial.json()) as { accountStatus?: string; kycStep?: string };
    if (body.accountStatus === 'ACTIVE') {
      return;
    }
    if (body.kycStep === 'done' && body.accountStatus !== 'ACTIVE') {
      const openOnly = await request.post('onboarding/account/open', { headers });
      if (!openOnly.ok()) {
        throw new Error(`account/open failed: ${openOnly.status()} ${await openOnly.text()}`);
      }
      return;
    }
  }
  let step = 'cadastral';
  for (let attempt = 0; attempt < 6; attempt++) {
    const statusRes = await request.get('onboarding/status', { headers });
    const body = (await statusRes.json()) as { kycStep?: string; accountStatus?: string };
    step = body.kycStep ?? 'cadastral';
    if (body.accountStatus === 'ACTIVE' || step === 'done') {
      break;
    }
    if (step === 'cadastral') {
      const submit = await request.post('onboarding/kyc/submit', { headers });
      if (!submit.ok()) {
        throw new Error(`kyc/submit failed: ${submit.status()} ${await submit.text()}`);
      }
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }
    if (step === 'document') {
      const doc = await request.post('onboarding/kyc/document', {
        headers,
        data: { fileBase64: homologImage(0xab), type: 'RG' },
      });
      if (!doc.ok()) {
        throw new Error(`kyc/document failed: ${doc.status()} ${await doc.text()}`);
      }
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }
    if (step === 'selfie') {
      const selfie = await request.post('onboarding/kyc/selfie', {
        headers,
        data: { selfieBase64: homologImage(0xcd) },
      });
      if (!selfie.ok()) {
        throw new Error(`kyc/selfie failed: ${selfie.status()} ${await selfie.text()}`);
      }
      break;
    }
  }
  const finalStatus = await request.get('onboarding/status', { headers });
  const finalBody = (await finalStatus.json()) as { kycStep?: string; accountStatus?: string };
  if (finalBody.accountStatus === 'ACTIVE') {
    return;
  }
  if (finalBody.kycStep !== 'done' && finalBody.kycStep !== 'selfie') {
    throw new Error(`kyc pipeline incompleto: step=${finalBody.kycStep ?? step}`);
  }

  const open = await request.post('onboarding/account/open', { headers });
  if (!open.ok()) {
    throw new Error(`account/open failed: ${open.status()} ${await open.text()}`);
  }
}

/** Avança cadastral até didit_verification — exige BFF com KYC_PROVIDER=didit. */
export async function advanceToDiditCadastral(
  request: APIRequestContext,
  token: string,
): Promise<{ kycStep: string; kycProvider?: string }> {
  const headers = authHeaders(token);
  const statusRes = await request.get('onboarding/status', { headers });
  if (!statusRes.ok()) {
    throw new Error(`onboarding/status failed: ${statusRes.status()} ${await statusRes.text()}`);
  }
  const initial = (await statusRes.json()) as { kycStep?: string; kycProvider?: string };
  if (initial.kycStep === 'didit_verification') {
    return { kycStep: initial.kycStep, kycProvider: initial.kycProvider };
  }
  if (initial.kycStep !== 'cadastral') {
    throw new Error(`pipeline inesperado: step=${initial.kycStep ?? 'unknown'}`);
  }
  const submit = await request.post('onboarding/kyc/submit', { headers });
  if (!submit.ok()) {
    throw new Error(`kyc/submit failed: ${submit.status()} ${await submit.text()}`);
  }
  const body = (await submit.json()) as { kycStep?: string; kycProvider?: string };
  if (body.kycStep !== 'didit_verification') {
    throw new Error(
      `Didit não ativo no BFF — step=${body.kycStep ?? 'unknown'} (defina KYC_PROVIDER=didit)`,
    );
  }
  return { kycStep: body.kycStep, kycProvider: body.kycProvider };
}

export async function getDashboard(
  request: APIRequestContext,
  token: string,
): Promise<{ balanceCents: string; availableCents: string }> {
  const response = await request.get('banking/dashboard', {
    headers: authHeaders(token),
  });
  if (!response.ok()) {
    throw new Error(`dashboard failed: ${response.status()} ${await response.text()}`);
  }
  return response.json() as Promise<{ balanceCents: string; availableCents: string }>;
}