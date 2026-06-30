import { Queue } from 'bullmq';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import Redis from 'ioredis';
import { OUTBOX_QUEUE_NAME } from './constants';
import { OutboxRelayWorker } from './outbox-worker';
import { createRedisConnection, getBullMQConnection } from './redis.config';

export interface HealthSnapshot {
  status: 'ok' | 'degraded' | 'unhealthy';
  redis: boolean;
  worker: boolean;
  queueReachable: boolean;
  timestamp: string;
}

export interface HealthCheckDeps {
  redis?: Redis;
  worker?: OutboxRelayWorker | null;
  queueName?: string;
}

export async function checkHealth(
  deps: HealthCheckDeps = {},
): Promise<HealthSnapshot> {
  const redis = deps.redis ?? createRedisConnection();
  const ownsRedis = deps.redis === undefined;
  const queueName = deps.queueName ?? OUTBOX_QUEUE_NAME;
  const connection = getBullMQConnection();

  let redisOk = false;
  let queueReachable = false;

  try {
    const pong = await redis.ping();
    redisOk = pong === 'PONG';
  } catch {
    redisOk = false;
  }

  try {
    const probeQueue = new Queue(queueName, { connection });
    await probeQueue.getJobCounts();
    queueReachable = true;
    await probeQueue.close();
  } catch {
    queueReachable = false;
  }

  const workerOk = deps.worker ? deps.worker.isRunning() : true;

  let status: HealthSnapshot['status'] = 'ok';
  if (!redisOk || !queueReachable) {
    status = 'unhealthy';
  } else if (!workerOk) {
    status = 'degraded';
  }

  if (ownsRedis) {
    await redis.quit();
  }

  return {
    status,
    redis: redisOk,
    worker: workerOk,
    queueReachable,
    timestamp: new Date().toISOString(),
  };
}

export function startHealthServer(
  port: number,
  deps: HealthCheckDeps,
): { close: () => Promise<void> } {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url !== '/health' && req.url !== '/healthz') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    const snapshot = await checkHealth(deps);
    const httpStatus = snapshot.status === 'unhealthy' ? 503 : 200;

    res.writeHead(httpStatus, { 'content-type': 'application/json' });
    res.end(JSON.stringify(snapshot));
  });

  server.listen(port);

  return {
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}