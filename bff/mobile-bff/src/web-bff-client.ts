import type { FastifyRequest } from 'fastify';

export interface ProxyResult {
  readonly status: number;
  readonly body: unknown;
}

const forwardHeaders = (request: FastifyRequest): Record<string, string> => {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  const correlationId = request.headers['x-correlation-id'];
  if (typeof correlationId === 'string') {
    headers['x-correlation-id'] = correlationId;
  }
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string') {
    headers.authorization = authorization;
  }
  const idempotencyKey = request.headers['idempotency-key'];
  if (typeof idempotencyKey === 'string') {
    headers['idempotency-key'] = idempotencyKey;
  }
  const channel = request.headers['x-channel'];
  if (typeof channel === 'string') {
    headers['x-channel'] = channel;
  }
  const ifMatch = request.headers['if-match'];
  if (typeof ifMatch === 'string') {
    headers['if-match'] = ifMatch;
  }
  const deviceId = request.headers['x-device-id'];
  if (typeof deviceId === 'string') {
    headers['x-device-id'] = deviceId;
  }
  return headers;
};

const parseBody = (text: string): unknown => {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export async function proxyToWebBff(
  baseUrl: string,
  method: string,
  webPath: string,
  request: FastifyRequest,
  body?: unknown,
): Promise<ProxyResult> {
  const url = `${baseUrl.replace(/\/$/, '')}${webPath.startsWith('/') ? webPath : `/${webPath}`}`;
  const payload =
    body !== undefined
      ? JSON.stringify(body)
      : method !== 'GET' && method !== 'HEAD' && request.body !== undefined
        ? JSON.stringify(request.body)
        : undefined;
  const response = await fetch(url, {
    method,
    headers: forwardHeaders(request),
    body: payload,
  });
  const text = await response.text();
  return { status: response.status, body: parseBody(text) };
}

export async function probeWebBffReady(baseUrl: string): Promise<boolean> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/health`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      return false;
    }
    const body = (await response.json()) as { status?: string };
    return body.status === 'ok';
  } catch {
    return false;
  }
}