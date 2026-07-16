/** Contrato do payload relay — validação antes de efeito colateral */
export interface OutboxRelayJobPayload {
  outboxEventId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  correlationId: string;
  createdAt: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: string): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

export class PayloadValidationError extends Error {
  readonly code = 'OUTBOX_RELAY_INVALID_PAYLOAD';

  constructor(message: string) {
    super(message);
    this.name = 'PayloadValidationError';
  }
}

export function validateOutboxRelayPayload(
  raw: unknown,
): OutboxRelayJobPayload {
  if (!isPlainObject(raw)) {
    throw new PayloadValidationError('payload deve ser objeto');
  }

  const {
    outboxEventId,
    aggregateType,
    aggregateId,
    eventType,
    payload,
    correlationId,
    createdAt,
  } = raw;

  if (typeof outboxEventId !== 'string' || !UUID_RE.test(outboxEventId)) {
    throw new PayloadValidationError('outboxEventId inválido (UUID esperado)');
  }
  if (typeof aggregateType !== 'string' || aggregateType.trim().length === 0) {
    throw new PayloadValidationError('aggregateType obrigatório');
  }
  if (typeof aggregateId !== 'string' || aggregateId.trim().length === 0) {
    throw new PayloadValidationError('aggregateId obrigatório');
  }
  if (typeof eventType !== 'string' || eventType.trim().length === 0) {
    throw new PayloadValidationError('eventType obrigatório');
  }
  if (!isPlainObject(payload)) {
    throw new PayloadValidationError('payload deve ser objeto JSON');
  }
  if (typeof correlationId !== 'string' || !UUID_RE.test(correlationId)) {
    throw new PayloadValidationError('correlationId inválido (UUID esperado)');
  }
  if (typeof createdAt !== 'string' || !isIsoTimestamp(createdAt)) {
    throw new PayloadValidationError('createdAt inválido (ISO-8601 esperado)');
  }

  return {
    outboxEventId,
    aggregateType,
    aggregateId,
    eventType,
    payload,
    correlationId,
    createdAt,
  };
}