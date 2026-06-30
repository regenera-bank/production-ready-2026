import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { HealthLiveResponseSchema, MobileApiPaths } from './contracts/mobile-api.ts';

const app = Fastify({ logger: true, trustProxy: true });
const port = Number(process.env.PORT ?? 8082);
const core = process.env.CORE_API_BASE_URL ?? 'http://localhost:3000';

app.addHook('onRequest', async (request, reply) => {
  const correlationId = String(request.headers['x-correlation-id'] ?? randomUUID());
  request.headers['x-correlation-id'] = correlationId;
  reply.header('x-correlation-id', correlationId);
  reply.header('cache-control', 'no-store');
});

app.get(MobileApiPaths.healthLive, async () => {
  const payload = { status: 'UP' as const, service: 'mobile-bff' as const };
  HealthLiveResponseSchema.parse(payload);
  return payload;
});

app.get(MobileApiPaths.healthReady, async () => ({
  status: 'UP',
  dependency: core,
}));

app.get(MobileApiPaths.home, async (_request, reply) =>
  reply.code(501).send({
    code: 'ADAPTER_NOT_CONFIGURED',
    message: 'contrato existe; endpoint real entra por ambiente.',
  }),
);

await app.listen({ port, host: '0.0.0.0' });