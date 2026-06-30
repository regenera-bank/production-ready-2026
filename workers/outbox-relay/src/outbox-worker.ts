import type { ConnectionOptions } from 'bullmq';
import { Job, Queue, UnrecoverableError, Worker } from 'bullmq';
import {
  OUTBOX_DLQ_JOB_NAME,
  OUTBOX_DLQ_NAME,
  OUTBOX_JOB_NAME,
  OUTBOX_JOB_TIMEOUT_MS,
  OUTBOX_QUEUE_NAME,
} from './constants';
import { logError, logInfo, logWarn } from './logger';
import { OutboxStore } from './outbox-store';
import { getBullMQConnection } from './redis.config';
import {
  OutboxRelayJobPayload,
  PayloadValidationError,
  validateOutboxRelayPayload,
} from './schema';

export interface RelayPublisher {
  publish(event: OutboxRelayJobPayload): Promise<void>;
}

export interface OutboxWorkerOptions {
  outboxStore: OutboxStore;
  publisher?: RelayPublisher;
  connection?: ConnectionOptions;
  queueName?: string;
  dlqName?: string;
  concurrency?: number;
}

export class LoggingRelayPublisher implements RelayPublisher {
  async publish(event: OutboxRelayJobPayload): Promise<void> {
    logInfo('evento relay publicado', {
      correlationId: event.correlationId,
      outboxEventId: event.outboxEventId,
    });
  }
}

export class OutboxRelayWorker {
  private readonly connection: ConnectionOptions;
  private readonly outboxStore: OutboxStore;
  private readonly publisher: RelayPublisher;
  private readonly dlqQueue: Queue;
  readonly worker: Worker;
  private running = false;

  constructor(options: OutboxWorkerOptions) {
    this.outboxStore = options.outboxStore;
    this.publisher = options.publisher ?? new LoggingRelayPublisher();
    this.connection = options.connection ?? getBullMQConnection();

    this.dlqQueue = new Queue(options.dlqName ?? OUTBOX_DLQ_NAME, {
      connection: this.connection,
    });

    this.worker = new Worker(
      options.queueName ?? OUTBOX_QUEUE_NAME,
      async (job) => this.processJob(job),
      {
        connection: this.connection,
        concurrency: options.concurrency ?? 1,
        lockDuration: OUTBOX_JOB_TIMEOUT_MS,
      },
    );

    this.worker.on('failed', (job, error) => {
      void this.handleFailedJob(job, error);
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    this.running = true;
    logInfo('outbox worker iniciado', {
      correlationId: 'worker-bootstrap',
    });
  }

  async processJob(job: Job): Promise<void> {
    if (job.name !== OUTBOX_JOB_NAME) {
      throw new Error(`job name inesperado: ${job.name}`);
    }

    let payload: OutboxRelayJobPayload;
    try {
      payload = validateOutboxRelayPayload(job.data);
    } catch (error) {
      if (error instanceof PayloadValidationError) {
        throw new UnrecoverableError(error.message);
      }
      throw error;
    }
    const context = {
      correlationId: payload.correlationId,
      outboxEventId: payload.outboxEventId,
      jobId: job.id,
      attempt: job.attemptsMade + 1,
    };

    logInfo('processando outbox job', context);

    const existing = await this.outboxStore.findById(payload.outboxEventId);
    if (!existing) {
      throw new UnrecoverableError(
        `outbox event não encontrado: ${payload.outboxEventId}`,
      );
    }

    // Idempotência: relay já concluído — sem efeito colateral duplicado
    if (existing.publishedAt !== null) {
      logWarn('evento já publicado — skip idempotente', context);
      return;
    }

    await this.withTimeout(
      async () => {
        await this.publisher.publish(payload);
        await this.outboxStore.markPublished(payload.outboxEventId);
      },
      OUTBOX_JOB_TIMEOUT_MS,
      `timeout após ${OUTBOX_JOB_TIMEOUT_MS}ms`,
    );

    logInfo('outbox event marcado como publicado', context);
  }

  private async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    message: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async handleFailedJob(
    job: Job | undefined,
    error: Error,
  ): Promise<void> {
    if (!job) {
      return;
    }

    const attempts = job.opts.attempts ?? 1;
    const isFinalAttempt =
      job.attemptsMade >= attempts || error instanceof UnrecoverableError;
    const correlationId =
      typeof job.data?.correlationId === 'string'
        ? job.data.correlationId
        : 'unknown';

    const context = {
      correlationId,
      outboxEventId:
        typeof job.data?.outboxEventId === 'string'
          ? job.data.outboxEventId
          : undefined,
      jobId: job.id,
      attempt: job.attemptsMade,
    };

    logError('outbox job falhou', context, error);

    if (!isFinalAttempt) {
      return;
    }

    const isPermanent =
      error instanceof UnrecoverableError ||
      error instanceof PayloadValidationError ||
      error.message.includes('não encontrado');

    if (!isPermanent) {
      logWarn('falha transitória esgotou retries', context);
    } else {
      logWarn('falha permanente enviada para DLQ', context);
    }

    await this.dlqQueue.add(
      OUTBOX_DLQ_JOB_NAME,
      {
        originalJobId: job.id,
        originalJobName: job.name,
        payload: job.data,
        failedReason: error.message,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      },
      {
        jobId: `dlq-${job.id}`,
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    logError('job movido para dead-letter queue', context);
  }

  async close(): Promise<void> {
    this.running = false;
    await this.worker.close();
    await this.dlqQueue.close();
    logInfo('outbox worker encerrado', {
      correlationId: 'worker-shutdown',
    });
  }
}