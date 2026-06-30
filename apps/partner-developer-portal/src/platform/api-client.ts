const API_BASE = import.meta.env.VITE_PARTNER_API_BASE ?? '/v1';

export type TokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
};

export type SandboxKey = {
  id: string;
  name: string;
  clientId: string;
  scopes: string[];
  createdAt: string;
  clientSecret?: string;
};

export type WebhookSubscription = {
  id: string;
  url: string;
  events: string[];
  status: string;
  createdAt: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new Error(problem.code ?? problem.title ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function issueToken(clientId: string, clientSecret: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  return parseJson<TokenResponse>(response);
}

export async function listSandboxKeys(token: string): Promise<SandboxKey[]> {
  const response = await fetch(`${API_BASE}/sandbox/keys`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return parseJson<SandboxKey[]>(response);
}

export async function createSandboxKey(
  token: string,
  input: { name: string; scopes: string[] },
): Promise<SandboxKey> {
  const response = await fetch(`${API_BASE}/sandbox/keys`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return parseJson<SandboxKey>(response);
}

export async function listWebhookSubscriptions(token: string): Promise<WebhookSubscription[]> {
  const response = await fetch(`${API_BASE}/webhooks/subscriptions`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return parseJson<WebhookSubscription[]>(response);
}

export async function registerWebhook(
  token: string,
  input: { url: string; events: string[] },
): Promise<WebhookSubscription> {
  const response = await fetch(`${API_BASE}/webhooks/subscriptions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return parseJson<WebhookSubscription>(response);
}

export async function testWebhook(
  token: string,
  input: { subscriptionId: string; eventType: string },
): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}/sandbox/webhooks/test`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return parseJson<Record<string, unknown>>(response);
}