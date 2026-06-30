import { Agent, request } from 'undici';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

const dispatcher = new Agent({
  connect: {
    cert: readFileSync(config.CORE_CLIENT_CERT_PATH),
    key: readFileSync(config.CORE_CLIENT_KEY_PATH),
    ca: readFileSync(config.CORE_CA_PATH),
    rejectUnauthorized: true
  }
});

export async function core(
  path: string,
  accessToken: string,
  init: { method?: string; body?: string; headers?: Record<string, string> } = {}
) {
  const correlationId = init.headers?.['x-correlation-id'] || randomUUID();
  const endpoint = new URL(
    path.replace(/^\//, ''),
    config.CORE_API_BASE_URL.endsWith('/')
      ? config.CORE_API_BASE_URL
      : `${config.CORE_API_BASE_URL}/`
  );

  const response = await request(endpoint, {
    dispatcher,
    method: init.method ?? 'GET',
    body: init.body,
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
      'content-type': 'application/json',
      'x-correlation-id': correlationId,
      ...init.headers
    },
    headersTimeout: 10_000,
    bodyTimeout: 15_000
  });

  const body = await response.body.text();
  return {
    status: response.statusCode,
    body,
    contentType: String(response.headers['content-type'] ?? 'application/json'),
    correlationId
  };
}
