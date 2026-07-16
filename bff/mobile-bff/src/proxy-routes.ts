import type { FastifyInstance } from 'fastify';
import { proxyToWebBff } from './web-bff-client.ts';

type Reply = { code: (status: number) => { send: (body: unknown) => unknown } };
type Request = Parameters<typeof proxyToWebBff>[3];

const replyProxy = async (
  webBffBase: string,
  request: Request,
  reply: Reply,
  method: string,
  webPath: string,
): Promise<unknown> => {
  const result = await proxyToWebBff(webBffBase, method, webPath, request);
  return reply.code(result.status).send(result.body);
};

/** Rotas espelhadas web-bff ↔ contratos Android/iOS. */
export const registerWebProxies = (
  app: FastifyInstance,
  webBffBase: string,
): void => {
  const proxy = (method: string, mobilePath: string, webPath: string) => {
    const handler = async (request: Request, reply: Reply) =>
      replyProxy(webBffBase, request, reply, method, webPath);
    if (method === 'GET') {
      app.get(mobilePath, handler);
    } else if (method === 'POST') {
      app.post(mobilePath, handler);
    } else if (method === 'PUT') {
      app.put(mobilePath, handler);
    } else if (method === 'DELETE') {
      app.delete(mobilePath, handler);
    }
  };

  proxy('POST', '/v1/auth/register', '/auth/register');
  proxy('POST', '/v1/auth/firebase/session', '/auth/firebase/session');
  proxy('POST', '/v1/auth/session/refresh', '/auth/session/refresh');
  proxy('POST', '/v1/auth/session/revoke', '/auth/session/revoke');
  proxy('POST', '/v1/auth/session/revoke-all', '/auth/session/revoke-all');

  proxy('GET', '/v1/onboarding/status', '/onboarding/status');
  proxy('POST', '/v1/onboarding/profile', '/onboarding/profile');
  proxy('POST', '/v1/onboarding/kyc/submit', '/onboarding/kyc/submit');
  proxy('POST', '/v1/onboarding/kyc/retry', '/onboarding/kyc/retry');
  proxy('POST', '/v1/onboarding/kyc/retry-biometric', '/onboarding/kyc/retry-biometric');
  proxy('POST', '/v1/onboarding/kyc/document', '/onboarding/kyc/document');
  proxy('POST', '/v1/onboarding/kyc/selfie', '/onboarding/kyc/selfie');
  proxy('POST', '/v1/onboarding/account/open', '/onboarding/account/open');

  proxy('POST', '/v1/banking/pix/keys', '/banking/pix/keys');
  proxy('POST', '/v1/assistant/chat', '/assistant/chat');

  // Rewards server-side (§17/§30 — canal nunca calcula pontos)
  proxy('GET', '/v1/products/rewards', '/products/rewards');

  // KYC Didit (mesma jornada do Web — §14: onboarding completo no mobile)
  proxy('POST', '/v1/onboarding/kyc/didit/session', '/onboarding/kyc/didit/session');
  proxy('POST', '/v1/onboarding/kyc/didit/sync', '/onboarding/kyc/didit/sync');

  // Proxy com parâmetros de rota (paymentId, transactionId, chave Pix).
  // Necessário para: consulta de estado por paymentId enquanto PROCESSING
  // (§22), comprovante (§14) e resolução de chave externa.
  const proxyParam = (
    method: 'GET' | 'POST',
    mobilePath: string,
    buildWebPath: (params: Record<string, string>) => string,
  ) => {
    const handler = async (request: Request, reply: Reply) => {
      const params =
        (request as { params?: Record<string, string> }).params ?? {};
      return replyProxy(webBffBase, request, reply, method, buildWebPath(params));
    };
    if (method === 'GET') {
      app.get(mobilePath, handler);
    } else {
      app.post(mobilePath, handler);
    }
  };

  proxyParam('GET', '/v1/banking/payments/:paymentId', (p) =>
    `/banking/payments/${encodeURIComponent(p.paymentId)}`);
  proxyParam('GET', '/v1/banking/pix/transfers/:paymentId', (p) =>
    `/banking/pix/transfers/${encodeURIComponent(p.paymentId)}`);
  proxyParam('GET', '/v1/banking/transactions/:transactionId/receipt', (p) =>
    `/banking/transactions/${encodeURIComponent(p.transactionId)}/receipt`);
  proxyParam('GET', '/v1/banking/pix/external/lookup/:key', (p) =>
    `/banking/pix/external/lookup/${encodeURIComponent(p.key)}`);

  // Jornada persistente multicanal (retomada Web ↔ Android ↔ iOS)
  proxy('POST', '/v1/onboarding/journeys', '/onboarding/journeys');
  proxy('GET', '/v1/onboarding/journeys/active', '/onboarding/journeys/active');
  proxyParam('GET', '/v1/onboarding/journeys/:journeyId', (p) =>
    `/onboarding/journeys/${encodeURIComponent(p.journeyId)}`);
  proxy('GET', '/v1/channel/bootstrap', '/channel/bootstrap');
};