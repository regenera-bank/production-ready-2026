import { randomUUID } from 'crypto';
import { DEFAULT_HEALTH_PORT } from './constants';
import { startHealthServer } from './health';
import { logError, logInfo } from './logger';
import { OutboxProducer } from './outbox-producer';
import { OutboxRelayWorker } from './outbox-worker';
import { closePostgresPool } from './postgres-pool';
import { createRedisConnection, getBullMQConnection } from './redis.config';
import { outboxStoreKind, resolveOutboxStore } from './resolve-outbox-store';

/** Bootstrap do relay — Postgres por padrão; memory só com CORE_BANK_STORAGE=memory */
async function bootstrap(): Promise<void> {
  const correlationId = randomUUID();
  const healthPort = Number.parseInt(
    process.env.OUTBOX_RELAY_HEALTH_PORT ?? String(DEFAULT_HEALTH_PORT),
    10,
  );

  const connection = getBullMQConnection();
  const redis = createRedisConnection();
  const { store: outboxStore, pool } = resolveOutboxStore();
  const worker = new OutboxRelayWorker({ outboxStore, connection });
  const producer = new OutboxProducer({ connection });

  await worker.start();

  const healthServer = startHealthServer(healthPort, {
    worker,
    redis,
  });

  logInfo('outbox relay pronto', {
    correlationId,
    jobId: `health:${healthPort}`,
    outboxStore: outboxStoreKind(outboxStore),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  });

  const shutdown = async (signal: string): Promise<void> => {
    logInfo(`recebido ${signal} — encerramento gracioso`, { correlationId });

    try {
      await healthServer.close();
      await worker.close();
      await producer.close();
      await redis.quit();
      if (pool) {
        await closePostgresPool();
      }
      process.exit(0);
    } catch (error) {
      logError('falha no shutdown', { correlationId }, error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

bootstrap().catch((error) => {
  logError('bootstrap falhou', { correlationId: 'bootstrap-fatal' }, error);
  process.exit(1);
});