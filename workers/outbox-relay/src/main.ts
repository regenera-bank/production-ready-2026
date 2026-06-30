import { randomUUID } from 'crypto';
import { DEFAULT_HEALTH_PORT } from './constants';
import { startHealthServer } from './health';
import { InMemoryOutboxStore } from './in-memory-outbox-store';
import { logError, logInfo } from './logger';
import { OutboxProducer } from './outbox-producer';
import { OutboxRelayWorker } from './outbox-worker';
import { createRedisConnection, getBullMQConnection } from './redis.config';

/** Bootstrap do relay — produção deve injetar OutboxStore com Postgres */
async function bootstrap(): Promise<void> {
  const correlationId = randomUUID();
  const healthPort = Number.parseInt(
    process.env.OUTBOX_RELAY_HEALTH_PORT ?? String(DEFAULT_HEALTH_PORT),
    10,
  );

  const connection = getBullMQConnection();
  const redis = createRedisConnection();
  const outboxStore = new InMemoryOutboxStore();
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
  });

  const shutdown = async (signal: string): Promise<void> => {
    logInfo(`recebido ${signal} — encerramento gracioso`, { correlationId });

    try {
      await healthServer.close();
      await worker.close();
      await producer.close();
      await redis.quit();
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