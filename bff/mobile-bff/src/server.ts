import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  DashboardResponseSchema,
  HealthLiveResponseSchema,
  HomeResponseSchema,
  MobileApiPaths,
  SessionResponseSchema,
} from './contracts/mobile-api.ts';
import { CANONICAL_HOME_MODULES } from './home-modules.ts';
import { registerWebProxies } from './proxy-routes.ts';
import { probeWebBffReady, proxyToWebBff } from './web-bff-client.ts';

const app = Fastify({ logger: true, trustProxy: true });
/** Android/iOS BuildConfig: 10.0.2.2:3201/v1/ — não alterar default sem ADR */
const port = Number(process.env.PORT ?? 3201);
const webBffBase = (process.env.WEB_BFF_BASE_URL ?? 'http://localhost:3200/v1').replace(
  /\/$/,
  '',
);

const correlationId = (request: { headers: Record<string, unknown> }): string =>
  String(request.headers['x-correlation-id'] ?? randomUUID());

const replyProxy = async (
  request: Parameters<typeof proxyToWebBff>[3],
  reply: { code: (status: number) => { send: (body: unknown) => unknown } },
  method: string,
  webPath: string,
): Promise<unknown> => {
  const result = await proxyToWebBff(webBffBase, method, webPath, request);
  return reply.code(result.status).send(result.body);
};

app.addHook('onRequest', async (request, reply) => {
  const id = correlationId(request);
  request.headers['x-correlation-id'] = id;
  if (!request.headers['x-channel']) {
    const ua = String(request.headers['user-agent'] ?? '');
    if (/android/i.test(ua)) {
      request.headers['x-channel'] = 'ANDROID';
    } else if (/iphone|ipad|ios/i.test(ua)) {
      request.headers['x-channel'] = 'IOS';
    } else {
      request.headers['x-channel'] = 'MOBILE';
    }
  }
  reply.header('x-correlation-id', id);
  reply.header('cache-control', 'no-store');
});

app.get(MobileApiPaths.health, async () => ({
  status: 'ok',
  layer: 'mobile-bff',
  channel: 'mobile',
}));

app.get(MobileApiPaths.healthLive, async () => {
  const payload = { status: 'UP' as const, service: 'mobile-bff' as const };
  HealthLiveResponseSchema.parse(payload);
  return payload;
});

app.get(MobileApiPaths.healthReady, async () => {
  const webReady = await probeWebBffReady(webBffBase);
  return {
    status: webReady ? 'UP' : 'DEGRADED',
    dependency: webBffBase,
    webBffReady: webReady,
  };
});

app.get(MobileApiPaths.home, async (request, reply) => {
  const id = correlationId(request);
  const webReady = await probeWebBffReady(webBffBase);
  let channelContractVersion = '2026-07-02-wave1';
  let supportedChannels = ['WEB', 'ANDROID', 'IOS', 'DESKTOP', 'PWA'];
  if (webReady) {
    try {
      const bootstrap = await proxyToWebBff(webBffBase, 'GET', '/channel/bootstrap', request);
      if (bootstrap.status === 200 && bootstrap.body && typeof bootstrap.body === 'object') {
        const body = bootstrap.body as {
          channelContractVersion?: string;
          supportedChannels?: string[];
        };
        if (body.channelContractVersion) {
          channelContractVersion = body.channelContractVersion;
        }
        if (Array.isArray(body.supportedChannels)) {
          supportedChannels = body.supportedChannels;
        }
      }
    } catch {
      /* bootstrap opcional — home ainda responde */
    }
  }

  let dashboard: unknown;
  if (typeof request.headers.authorization === 'string') {
    const dash = await proxyToWebBff(webBffBase, 'GET', '/banking/dashboard', request);
    if (dash.status === 200) {
      const parsed = DashboardResponseSchema.safeParse(dash.body);
      if (parsed.success) {
        dashboard = parsed.data;
      }
    }
  }

  const payload = {
    service: 'mobile-bff' as const,
    ready: webReady,
    correlationId: id,
    channelContractVersion,
    supportedChannels,
    modules: CANONICAL_HOME_MODULES.map((module) => ({ ...module })),
    ...(dashboard ? { dashboard } : {}),
  };
  HomeResponseSchema.parse(payload);
  return reply.code(200).send(payload);
});

app.post(MobileApiPaths.session, async (request, reply) => {
  const result = await proxyToWebBff(webBffBase, 'POST', '/auth/session', request);
  if (result.status === 200 || result.status === 201) {
    SessionResponseSchema.parse(result.body);
  }
  return reply.code(result.status).send(result.body);
});

app.get(MobileApiPaths.dashboard, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/banking/dashboard'),
);

app.get(MobileApiPaths.transactions, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/banking/transactions'),
);

app.get(MobileApiPaths.pixKeys, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/banking/pix/keys'),
);

app.post(MobileApiPaths.pixLookup, async (request, reply) =>
  replyProxy(request, reply, 'POST', '/banking/pix/lookup'),
);

app.post(MobileApiPaths.pixTransfers, async (request, reply) =>
  replyProxy(request, reply, 'POST', '/banking/pix/transfers'),
);

app.post(MobileApiPaths.transfers, async (request, reply) =>
  replyProxy(request, reply, 'POST', '/banking/transfers'),
);

app.get(MobileApiPaths.cards, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/products/cards'),
);

app.get(MobileApiPaths.credit, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/products/credit/offers'),
);

app.get(MobileApiPaths.investments, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/products/investments/positions'),
);

app.get(MobileApiPaths.profile, async (request, reply) =>
  replyProxy(request, reply, 'GET', '/onboarding/status'),
);

app.get(MobileApiPaths.support, async (request, reply) =>
  reply.code(200).send({ items: [], correlationId: correlationId(request) }),
);

registerWebProxies(app, webBffBase);

await app.listen({ port, host: '0.0.0.0' });