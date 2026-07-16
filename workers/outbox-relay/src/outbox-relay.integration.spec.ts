import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { getBullMQConnection } from './redis.config';
import {
  OUTBOX_DLQ_NAME,
  OUTBOX_JOB_NAME,
  OUTBOX_QUEUE_NAME,
} from './constants';
import { checkHealth } from './health';
import { InMemoryOutboxStore } from './in-memory-outbox-store';
import { OutboxProducer } from './outbox-producer';
import {
  OutboxRelayWorker,
  RelayPublisher,
} from './outbox-worker';
import { createRedisConnection } from './redis.config';
import { OutboxRelayJobPayload } from './schema';

const TEST_QUEUE = `${OUTBOX_QUEUE_NAME}.test.${process.pid}`;
const TEST_DLQ = `${OUTBOX_DLQ_NAME}.test.${process.pid}`;

function buildPayload(
  outboxEventId: string,
  correlationId = randomUUID(),
): OutboxRelayJobPayload {
  return {
    outboxEventId,
    aggregateType: 'Payment',
    aggregateId: randomUUID(),
    eventType: 'PaymentCreated',
    payload: { amountCents: '1000' },
    correlationId,
    createdAt: new Date().toISOString(),
  };
}

class TrackingPublisher implements RelayPublisher {
  readonly published: OutboxRelayJobPayload[] = [];

  async publish(event: OutboxRelayJobPayload): Promise<void> {
    this.published.push(event);
  }
}

describe('Outbox relay (BullMQ + Redis integration)', () => {
  let redis: Redis;
  let producer: OutboxProducer;
  let worker: OutboxRelayWorker;
  let outboxStore: InMemoryOutboxStore;
  let publisher: TrackingPublisher;
  let cleanupQueue: Queue;

  beforeAll(async () => {
    redis = createRedisConnection();
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis indisponível — execute redis-cli ping');
    }
  });

  beforeEach(async () => {
    outboxStore = new InMemoryOutboxStore();
    publisher = new TrackingPublisher();
    const connection = getBullMQConnection();

    producer = new OutboxProducer({
      connection,
      queueName: TEST_QUEUE,
    });

    worker = new OutboxRelayWorker({
      outboxStore,
      publisher,
      connection,
      queueName: TEST_QUEUE,
      dlqName: TEST_DLQ,
    });

    await worker.start();
    cleanupQueue = new Queue(TEST_QUEUE, { connection });
  });

  afterEach(async () => {
    await worker.close();
    await producer.close();

    await cleanupQueue.obliterate({ force: true });
    await cleanupQueue.close();

    const dlq = new Queue(TEST_DLQ, { connection: getBullMQConnection() });
    await dlq.obliterate({ force: true });
    await dlq.close();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('processa job e marca published_at no outbox', async () => {
    const eventId = randomUUID();
    const correlationId = randomUUID();

    outboxStore.seed({
      id: eventId,
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'PaymentCreated',
      payload: { amountCents: '1000' },
      publishedAt: null,
      createdAt: new Date().toISOString(),
    });

    const payload = buildPayload(eventId, correlationId);
    await producer.enqueue(payload);

    await waitFor(() => publisher.published.length === 1, 15_000);

    const stored = await outboxStore.findById(eventId);
    expect(stored?.publishedAt).not.toBeNull();
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]?.correlationId).toBe(correlationId);
  });

  it('job idempotente — mesmo outboxEventId não duplica efeito', async () => {
    const eventId = randomUUID();

    outboxStore.seed({
      id: eventId,
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'PaymentCreated',
      payload: {},
      publishedAt: null,
      createdAt: new Date().toISOString(),
    });

    const payload = buildPayload(eventId);
    await producer.enqueue(payload);
    await waitFor(() => publisher.published.length === 1, 15_000);

    publisher.published.length = 0;
    await producer.enqueueIdempotent(payload);

    await sleep(2_000);

    expect(publisher.published).toHaveLength(0);
    const stored = await outboxStore.findById(eventId);
    expect(stored?.publishedAt).not.toBeNull();
  });

  it('rejeita payload inválido sem marcar published_at', async () => {
    const eventId = randomUUID();
    outboxStore.seed({
      id: eventId,
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'PaymentCreated',
      payload: {},
      publishedAt: null,
      createdAt: new Date().toISOString(),
    });

    const queue = new Queue(TEST_QUEUE, { connection: getBullMQConnection() });
    await queue.add(
      OUTBOX_JOB_NAME,
      {
        outboxEventId: 'not-a-uuid',
        aggregateType: 'Payment',
        aggregateId: randomUUID(),
        eventType: 'Bad',
        payload: {},
        correlationId: randomUUID(),
        createdAt: new Date().toISOString(),
      },
      { jobId: `invalid-${randomUUID()}` },
    );
    await queue.close();

    await sleep(3_000);

    const stored = await outboxStore.findById(eventId);
    expect(stored?.publishedAt).toBeNull();
  });

  it('health check reporta redis e worker ok', async () => {
    const snapshot = await checkHealth({
      redis,
      worker,
      queueName: TEST_QUEUE,
    });

    expect(snapshot.redis).toBe(true);
    expect(snapshot.worker).toBe(true);
    expect(snapshot.queueReachable).toBe(true);
    expect(snapshot.status).toBe('ok');
  });

  it('integra com OutboxService do core-bank', async () => {
    await worker.close();
    await producer.close();

    const { InMemoryOutboxRepository } = await import(
      '../../../domains/core-bank/src/outbox/in-memory-outbox.repository'
    );
    const { OutboxService } = await import(
      '../../../domains/core-bank/src/outbox/outbox.service'
    );

    const repo = new InMemoryOutboxRepository();
    const service = new OutboxService(repo);

    const event = await service.append({
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'PaymentSettled',
      payload: { ok: true },
    });

    const coreBankStore = {
      findById: async (id: string) => {
        const found = await repo.findById(id);
        if (!found) return null;
        return {
          id: found.id,
          aggregateType: found.aggregateType,
          aggregateId: found.aggregateId,
          eventType: found.eventType,
          payload: found.payload,
          publishedAt: found.publishedAt,
          createdAt: found.createdAt,
        };
      },
      markPublished: async (id: string, publishedAt?: string) => {
        const updated = await service.markPublished(id, publishedAt);
        return {
          id: updated.id,
          aggregateType: updated.aggregateType,
          aggregateId: updated.aggregateId,
          eventType: updated.eventType,
          payload: updated.payload,
          publishedAt: updated.publishedAt,
          createdAt: updated.createdAt,
        };
      },
    };

    const connection = getBullMQConnection();
    const coreWorker = new OutboxRelayWorker({
      outboxStore: coreBankStore,
      publisher,
      connection,
      queueName: TEST_QUEUE,
      dlqName: TEST_DLQ,
    });
    await coreWorker.start();

    const coreProducer = new OutboxProducer({
      connection,
      queueName: TEST_QUEUE,
    });

    await coreProducer.enqueue(buildPayload(event.id));
    await waitFor(async () => {
      const row = await service.pending(10);
      return row.length === 0;
    }, 15_000);

    const published = await repo.findById(event.id);
    expect(published?.publishedAt).not.toBeNull();

    await coreWorker.close();
    await coreProducer.close();
  });
});

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  timeoutMs: number,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) {
      return;
    }
    await sleep(200);
  }
  throw new Error(`timeout após ${timeoutMs}ms`);
}