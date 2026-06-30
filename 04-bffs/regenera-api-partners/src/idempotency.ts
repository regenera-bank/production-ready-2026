import { Redis } from 'ioredis';
import { payloadHash } from './canonical-json.js';
import { config } from './config.js';

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  tls: config.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: true } : undefined
});

export type StoredResponse = {
  status: number;
  body: string;
  contentType: string;
};

type RecordState = {
  hash: string;
  state: 'PROCESSING' | 'DONE' | 'UNKNOWN';
  updatedAt: number;
  response?: StoredResponse;
};

export class AmbiguousExecution extends Error {
  constructor() {
    super('EXECUTION_STATE_UNKNOWN');
  }
}

export async function idempotencyHealth() {
  return redis.ping();
}

export async function executeIdempotent(
  clientId: string,
  key: string,
  payload: unknown,
  execute: () => Promise<StoredResponse>
): Promise<StoredResponse> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw Object.assign(new Error('INVALID_IDEMPOTENCY_KEY'), { statusCode: 400 });
  }

  const hash = payloadHash(payload);
  const redisKey = `idem:${clientId}:${key}`;
  const now = Date.now();
  const initial: RecordState = { hash, state: 'PROCESSING', updatedAt: now };
  const lock = await redis.set(redisKey, JSON.stringify(initial), 'EX', 86_400, 'NX');

  if (lock !== 'OK') {
    const existing = JSON.parse((await redis.get(redisKey)) ?? '{}') as Partial<RecordState>;
    if (existing.hash !== hash) {
      throw Object.assign(new Error('IDEMPOTENCY_CONFLICT'), { statusCode: 409 });
    }
    if (existing.state === 'DONE' && existing.response) return existing.response;
    if (existing.state === 'UNKNOWN') {
      throw Object.assign(new Error('EXECUTION_STATE_UNKNOWN'), { statusCode: 409 });
    }
    if (existing.state === 'PROCESSING' && now - Number(existing.updatedAt ?? 0) > 30_000) {
      const unknown: RecordState = { hash, state: 'UNKNOWN', updatedAt: now };
      await redis.set(redisKey, JSON.stringify(unknown), 'EX', 86_400);
      throw Object.assign(new Error('EXECUTION_STATE_UNKNOWN'), { statusCode: 409 });
    }
    throw Object.assign(new Error('REQUEST_IN_PROGRESS'), { statusCode: 409 });
  }

  try {
    const response = await execute();
    if (response.status >= 500) throw new AmbiguousExecution();

    const done: RecordState = { hash, state: 'DONE', updatedAt: Date.now(), response };
    await redis.set(redisKey, JSON.stringify(done), 'EX', 86_400);
    return response;
  } catch (error) {
    const unknown: RecordState = { hash, state: 'UNKNOWN', updatedAt: Date.now() };
    await redis.set(redisKey, JSON.stringify(unknown), 'EX', 86_400);
    throw error;
  }
}
