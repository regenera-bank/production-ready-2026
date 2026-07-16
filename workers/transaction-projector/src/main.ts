#!/usr/bin/env node
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { processPendingOutbox } from './projection-engine';

const POLL_MS = Number.parseInt(
  process.env.TRANSACTION_PROJECTOR_POLL_MS ?? '2000',
  10,
);

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://regenera:regenera_local_only@localhost:5433/regenera';

async function bootstrap(): Promise<void> {
  const correlationId = randomUUID();
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log(
    JSON.stringify({
      level: 'info',
      msg: 'transaction-projector iniciado',
      correlationId,
      target: 'channel_experience.transaction_projections',
      pollMs: POLL_MS,
    }),
  );

  const shutdown = async (signal: string): Promise<void> => {
    console.log(
      JSON.stringify({
        level: 'info',
        msg: `transaction-projector encerrando (${signal})`,
        correlationId,
      }),
    );
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  setInterval(() => {
    void pollOutbox(pool, correlationId);
  }, POLL_MS);
}

async function pollOutbox(pool: Pool, correlationId: string): Promise<void> {
  try {
    const applied = await processPendingOutbox(pool);
    if (applied > 0) {
      console.log(
        JSON.stringify({
          level: 'info',
          msg: 'projector_outbox processado',
          correlationId,
          applied,
        }),
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'pollOutbox falhou',
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

bootstrap().catch((error) => {
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'transaction-projector bootstrap falhou',
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});