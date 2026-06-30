import type { ConnectionOptions } from 'bullmq';
import { Queue } from 'bullmq';
import {
  OUTBOX_BACKOFF_DELAY_MS,
  OUTBOX_JOB_NAME,
  OUTBOX_JOB_TIMEOUT_MS,
  OUTBOX_MAX_ATTEMPTS,
  OUTBOX_QUEUE_NAME,
} from './constants';
import { logInfo, logWarn } from './logger';
import { getBullMQConnection } from './redis.config';
import {
  OutboxRelayJobPayload,
  validateOutboxRelayPayload,
} from './schema';

export interface OutboxProducerOptions {
  connection?: ConnectionOptions;
  queueName?: string;
}

export class OutboxProducer {
  private readonly connection: ConnectionOptions;
  readonly queue: Queue;

  constructor(options: OutboxProducerOptions = {}) {
    this.connection = options.connection ?? getBullMQConnection();
    this.queue = new Queue(options.queueName ?? OUTBOX_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: OUTBOX_MAX_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: OUTBOX_BACKOFF_DELAY_MS,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  /** jobId = outboxEventId evita duplicata na fila */
  async enqueue(rawPayload: OutboxRelayJobPayload): Promise<string> {
    const payload = validateOutboxRelayPayload(rawPayload);

    const job = await this.queue.add(OUTBOX_JOB_NAME, payload, {
      jobId: payload.outboxEventId,
    });

    logInfo('outbox job enfileirado', {
      correlationId: payload.correlationId,
      outboxEventId: payload.outboxEventId,
      jobId: job.id ?? payload.outboxEventId,
    });

    return job.id ?? payload.outboxEventId;
  }

  /** Re-enfileira com mesmo jobId — ignora se já pendente na fila */
  async enqueueIdempotent(rawPayload: OutboxRelayJobPayload): Promise<string | null> {
    const payload = validateOutboxRelayPayload(rawPayload);
    const existing = await this.queue.getJob(payload.outboxEventId);

    if (existing) {
      const state = await existing.getState();
      if (state === 'waiting' || state === 'active' || state === 'delayed') {
        logWarn('job duplicado ignorado na fila', {
          correlationId: payload.correlationId,
          outboxEventId: payload.outboxEventId,
        });
        return null;
      }
    }

    return this.enqueue(payload);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

export { OUTBOX_JOB_TIMEOUT_MS };