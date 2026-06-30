import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';

const app = Fastify({ logger: true, trustProxy: true });
const port = Number(process.env.PORT ?? 8082);
const core = process.env.CORE_API_BASE_URL;
if (!core) throw new Error('CORE_API_BASE_URL ausente');

app.addHook('onRequest', async (request, reply) => {
  const correlationId = String(request.headers['x-correlation-id'] ?? randomUUID());
  request.headers['x-correlation-id'] = correlationId;
  reply.header('x-correlation-id', correlationId);
  reply.header('cache-control', 'no-store');
});

app.get('/health/live', async () => ({ status: 'UP', service: 'mobile-bff' }));
app.get('/health/ready', async () => ({ status: 'UP', dependency: core }));
app.get('/v1/home', async (_request, reply) => reply.code(501).send({
  code: 'ADAPTER_NOT_CONFIGURED',
  message: 'o contrato existe. o endpoint real entra por ambiente.'
}));

await app.listen({ port, host: '0.0.0.0' });
