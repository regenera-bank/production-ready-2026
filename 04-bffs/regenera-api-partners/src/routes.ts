import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate, requireScope } from './auth.js';
import { core } from './core-client.js';
import { executeIdempotent } from './idempotency.js';
import { AccountId, CreatePixPayment, PaymentId, UUID } from './schemas.js';

function sendCore(reply: FastifyReply, response: Awaited<ReturnType<typeof core>>) {
  return reply
    .code(response.status)
    .header('content-type', response.contentType)
    .header('x-correlation-id', response.correlationId)
    .send(response.body);
}

export async function routes(app: FastifyInstance) {
  app.get('/v1/accounts', async (request, reply) => {
    const principal = await authenticate(request);
    requireScope(principal, 'accounts:read');
    return sendCore(reply, await core('/accounts', request.headers.authorization!.slice(7)));
  });

  app.get('/v1/accounts/:accountId/balance', async (request, reply) => {
    const principal = await authenticate(request);
    requireScope(principal, 'balances:read');
    const accountId = AccountId.parse((request.params as { accountId: string }).accountId);
    return sendCore(
      reply,
      await core(`/accounts/${encodeURIComponent(accountId)}/balance`, request.headers.authorization!.slice(7))
    );
  });

  app.get('/v1/accounts/:accountId/transactions', async (request, reply) => {
    const principal = await authenticate(request);
    requireScope(principal, 'transactions:read');
    const accountId = AccountId.parse((request.params as { accountId: string }).accountId);
    const query = new URLSearchParams(request.query as Record<string, string>);
    return sendCore(
      reply,
      await core(
        `/accounts/${encodeURIComponent(accountId)}/transactions?${query}`,
        request.headers.authorization!.slice(7)
      )
    );
  });

  app.post('/v1/pix/payments', async (request, reply) => {
    const principal = await authenticate(request);
    requireScope(principal, 'pix:write');

    const idempotencyKey = UUID.parse(request.headers['idempotency-key']);
    const correlationId = request.headers['x-correlation-id']
      ? UUID.parse(request.headers['x-correlation-id'])
      : randomUUID();
    const input = CreatePixPayment.parse(request.body);

    const response = await executeIdempotent(
      principal.clientId,
      idempotencyKey,
      input,
      async () => {
        const result = await core('/pix/payments', request.headers.authorization!.slice(7), {
          method: 'POST',
          body: JSON.stringify(input),
          headers: {
            'idempotency-key': idempotencyKey,
            'x-correlation-id': correlationId
          }
        });
        return { status: result.status, body: result.body, contentType: result.contentType };
      }
    );

    return reply
      .code(response.status)
      .header('content-type', response.contentType)
      .header('x-correlation-id', correlationId)
      .send(response.body);
  });

  app.get('/v1/pix/payments/:paymentId', async (request, reply) => {
    const principal = await authenticate(request);
    requireScope(principal, 'pix:read');
    const paymentId = PaymentId.parse((request.params as { paymentId: string }).paymentId);
    return sendCore(
      reply,
      await core(`/pix/payments/${encodeURIComponent(paymentId)}`, request.headers.authorization!.slice(7))
    );
  });
}
