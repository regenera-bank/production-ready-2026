import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { readFileSync } from 'node:fs';
import type { TLSSocket } from 'node:tls';
import { config } from './config.js';
import { idempotencyHealth } from './idempotency.js';
import { routes } from './routes.js';

const app = Fastify({
  trustProxy: true,
  requestIdHeader: 'x-correlation-id',
  logger: {
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.document',
      'req.body.destination.key'
    ]
  },
  https: {
    cert: readFileSync(config.TLS_CERT_PATH),
    key: readFileSync(config.TLS_KEY_PATH),
    ca: readFileSync(config.TLS_CA_PATH),
    requestCert: true,
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
});

await app.register(rateLimit, {
  max: 300,
  timeWindow: '1 minute',
  keyGenerator: request =>
    (request.socket as TLSSocket).getPeerCertificate()?.fingerprint256 ?? request.ip
});

if (config.DOCS_ENABLED) {
  await app.register(swagger, {
    openapi: { info: { title: 'Regenera Partner API', version: '1.0.0' } }
  });
  await app.register(swaggerUi, { routePrefix: '/documentation' });
}

app.setErrorHandler((error, request, reply) => {
  const failure = error as Error & { statusCode?: number };
  const status = failure.statusCode ?? 500;
  request.log.warn({ err: failure, status }, 'request rejected');
  reply
    .code(status)
    .type('application/problem+json')
    .send({
      type: 'https://api.regenerabank.example/problems/request-rejected',
      title: status >= 500 ? 'Dependência indisponível' : 'Requisição recusada',
      status,
      code: failure.message,
      correlationId: request.id
    });
});

app.get('/health/live', async () => ({ status: 'UP' }));
app.get('/health/ready', async (_request, reply) => {
  const redis = await idempotencyHealth();
  return reply.code(redis === 'PONG' ? 200 : 503).send({ status: redis === 'PONG' ? 'UP' : 'DOWN' });
});

await app.register(routes);
await app.listen({ host: config.HOST, port: config.PORT });
