/**
 * Postgres outbox relay integration — requires DATABASE_URL and Redis.
 * Run: npm run test:postgres
 */
const POSTGRES_IT_ENABLED = Boolean(process.env.DATABASE_URL);

import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { Client, Pool } from 'pg';
import {
  OUTBOX_DLQ_NAME,
  OUTBOX_QUEUE_NAME,
} from './constants';
import { OutboxProducer } from './outbox-producer';
import { PostgresOutboxStore } from './postgres-outbox-store';
import {
  closePostgresPool,
  createPostgresPool,
  resetPostgresPoolForTests,
} from './postgres-pool';
import {
  OutboxRelayWorker,
  RelayPublisher,
} from './outbox-worker';
import { createRedisConnection, getBullMQConnection } from './redis.config';
import { OutboxRelayJobPayload } from './schema';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://localhost:5432/regenera_core_test';

const TEST_QUEUE = `${OUTBOX_QUEUE_NAME}.postgres.${process.pid}`;
const TEST_DLQ = `${OUTBOX_DLQ_NAME}.postgres.${process.pid}`;

async function ensureTestDatabase(): Promise<void> {
  const parsed = new URL(DATABASE_URL);
  const dbName = parsed.pathname.replace(/^\//, '');
  parsed.pathname = '/postgres';
  const admin = new Client({ connectionString: parsed.toString() });
  await admin.connect();
  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
}

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

const describePostgres = POSTGRES_IT_ENABLED ? describe : describe.skip;

describePostgres('Outbox relay (Postgres + BullMQ integration)', () => {
  let redis: Redis;
  let pool: Pool;
  let outboxStore: PostgresOutboxStore;
  let producer: OutboxProducer;
  let worker: OutboxRelayWorker;
  let publisher: TrackingPublisher;
  let cleanupQueue: Queue;

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    resetPostgresPoolForTests();
    await ensureTestDatabase();

    redis = createRedisConnection();
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      throw new Error('Redis indisponível — execute redis-cli ping');
    }

    pool = createPostgresPool();

    const {
      resetCoreBankingSchema,
      runMigrations,
    } = await import(
      '../../../domains/core-bank/src/db/migration-runner'
    );
    await resetCoreBankingSchema(pool);
    await runMigrations(pool);
  }, 60_000);

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE core_banking.outbox_events RESTART IDENTITY CASCADE');

    outboxStore = new PostgresOutboxStore(pool);
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
    await closePostgresPool();
    await redis.quit();
  });

  async function seedOutboxEvent(eventId: string): Promise<void> {
    await pool.query(
      `INSERT INTO core_banking.outbox_events (
         id, aggregate_type, aggregate_id, event_type, payload, published_at, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        eventId,
        'Payment',
        randomUUID(),
        'PaymentCreated',
        JSON.stringify({ amountCents: '1000' }),
        null,
        new Date().toISOString(),
      ],
    );
  }

  it('processa job e marca published_at no Postgres', async () => {
    const eventId = randomUUID();
    const correlationId = randomUUID();

    await seedOutboxEvent(eventId);

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

    await seedOutboxEvent(eventId);

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

  it('integra com PostgresOutboxRepository do core-bank', async () => {
    await worker.close();
    await producer.close();

    const { PostgresOutboxRepository } = require(
      '../../../domains/core-bank/dist/db/postgres/postgres-outbox.repository',
    ) as typeof import('../../../domains/core-bank/dist/db/postgres/postgres-outbox.repository');
    const { OutboxService } = await import(
      '../../../domains/core-bank/src/outbox/outbox.service'
    );

    const repo = new PostgresOutboxRepository(pool);
    const service = new OutboxService(repo);

    const event = await service.append({
      aggregateType: 'Payment',
      aggregateId: randomUUID(),
      eventType: 'PaymentSettled',
      payload: { ok: true },
    });

    const connection = getBullMQConnection();
    const coreWorker = new OutboxRelayWorker({
      outboxStore: new PostgresOutboxStore(pool),
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
      const pending = await service.pending(10);
      return pending.length === 0;
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