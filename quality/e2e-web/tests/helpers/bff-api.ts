import type { APIRequestContext } from '@playwright/test';

const sampleAddress = {
  street: 'Rua das Flores',
  number: '100',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01310-100',
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

export async function completeKycAndOpenAccount(
  request: APIRequestContext,
  token: string,
): Promise<void> {
  const headers = authHeaders(token);
  const submit = await request.post('onboarding/kyc/submit', { headers });
  if (!submit.ok()) {
    throw new Error(`kyc/submit failed: ${submit.status()} ${await submit.text()}`);
  }

  const document = await request.post('onboarding/kyc/document', {
    headers,
    data: { fileBase64: homologImage(0xab), type: 'RG' },
  });
  if (!document.ok()) {
    throw new Error(`kyc/document failed: ${document.status()} ${await document.text()}`);
  }

  const selfie = await request.post('onboarding/kyc/selfie', {
    headers,
    data: { selfieBase64: homologImage(0xcd) },
  });
  if (!selfie.ok()) {
    throw new Error(`kyc/selfie failed: ${selfie.status()} ${await selfie.text()}`);
  }

  const open = await request.post('onboarding/account/open', { headers });
  if (!open.ok()) {
    throw new Error(`account/open failed: ${open.status()} ${await open.text()}`);
  }
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