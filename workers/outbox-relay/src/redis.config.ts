import type { ConnectionOptions } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { DEFAULT_REDIS_URL } from './constants';

export interface RedisConnectionConfig {
  url: string;
  options: RedisOptions;
}

/** REDIS_URL centralizado; rediss:// habilita TLS sem config extra */
export function resolveRedisUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.REDIS_URL?.trim() || DEFAULT_REDIS_URL;
}

export function buildRedisConnectionConfig(
  url = resolveRedisUrl(),
): RedisConnectionConfig {
  const parsed = new URL(url);
  const useTls = parsed.protocol === 'rediss:';

  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    ...(useTls ? { tls: {} } : {}),
  };

  if (parsed.password) {
    options.password = decodeURIComponent(parsed.password);
  }

  if (parsed.username) {
    options.username = decodeURIComponent(parsed.username);
  }

  const dbPath = parsed.pathname.replace(/^\//, '');
  if (dbPath.length > 0) {
    const db = Number.parseInt(dbPath, 10);
    if (!Number.isNaN(db)) {
      options.db = db;
    }
  }

  return { url, options };
}

/** Conexão BullMQ — opções derivadas da URL centralizada */
export function getBullMQConnection(url = resolveRedisUrl()): ConnectionOptions {
  const parsed = new URL(url);
  const useTls = parsed.protocol === 'rediss:';
  const dbPath = parsed.pathname.replace(/^\//, '');
  const db =
    dbPath.length > 0 ? Number.parseInt(dbPath, 10) : undefined;

  return {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
    username: parsed.username
      ? decodeURIComponent(parsed.username)
      : undefined,
    password: parsed.password
      ? decodeURIComponent(parsed.password)
      : undefined,
    db: db !== undefined && !Number.isNaN(db) ? db : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    ...(useTls ? { tls: {} } : {}),
  };
}

export function createRedisConnection(
  url = resolveRedisUrl(),
): Redis {
  const { url: resolvedUrl, options } = buildRedisConnectionConfig(url);
  return new Redis(resolvedUrl, options);
}