/** Fila versionada — mudança de contrato exige novo sufixo .vN */
export const OUTBOX_QUEUE_NAME = 'core-bank.outbox.v1';

/** Nome versionado do job — consumidor valida antes de processar */
export const OUTBOX_JOB_NAME = 'outbox.relay.v1';

/** Fila de dead-letter para falhas permanentes após esgotar retries */
export const OUTBOX_DLQ_NAME = 'core-bank.outbox.v1.dlq';

export const OUTBOX_DLQ_JOB_NAME = 'outbox.relay.v1.dlq';

/** Retries + backoff exponencial; timeout evita job preso indefinidamente */
export const OUTBOX_MAX_ATTEMPTS = 3;
export const OUTBOX_BACKOFF_DELAY_MS = 1_000;
export const OUTBOX_JOB_TIMEOUT_MS = 30_000;

export const DEFAULT_REDIS_URL = 'redis://localhost:6379';
export const DEFAULT_HEALTH_PORT = 3109;