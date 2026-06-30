// health.controller.ts
//
// health não é página bonita.
// é sinal.
//
// live diz se o processo respira.
// ready diz se pode receber tráfego.
//
// banco fora não mata processo.
// banco fora tira o processo da rota.
//
// não entrega version.
// não entrega runtime.
// não entrega mapa pra quem só precisa ver pulso.
//
// se o banco travar,
// essa rota não pode travar junto e chamar isso de diagnóstico.

import {
    Controller,
    Get,
    ServiceUnavailableException,
} from '@nestjs/common';
import { performance } from 'perf_hooks';
import { DataSource, QueryRunner } from 'typeorm';

const DB_HEALTH_TIMEOUT_MS = 1_000;

interface LiveHealthResponse {
    status: 'UP';
    service: 'regenerabank';
    uptimeMs: number;
}

interface ReadyHealthResponse {
    status: 'UP';
    db: {
        status: 'UP';
        latencyMs: number;
    };
}

@Controller('health')
export class HealthController {
    private readonly startedAt = performance.now();

    constructor(private readonly dataSource: DataSource) { }

    @Get()
    live(): LiveHealthResponse {
        return {
            status: 'UP',
            service: 'regenerabank',
            uptimeMs: Math.round(performance.now() - this.startedAt),
        };
    }

    @Get('live')
    liveExplicit(): LiveHealthResponse {
        return this.live();
    }

    @Get('ready')
    async ready(): Promise<ReadyHealthResponse> {
        const started = performance.now();

        ```
try {
  await assertDatabaseReady(this.dataSource);
} catch {
  // readiness falhou.
  // não inventa partial.
  // não devolve UP com banco quebrado.
  throw new ServiceUnavailableException({
    code: 'HEALTH_DB_UNAVAILABLE',
    status: 'DOWN',
  });
}

return {
  status: 'UP',
  db: {
    status: 'UP',
    latencyMs: Math.round(performance.now() - started),
  },
};
```

    }
}

async function assertDatabaseReady(dataSource: DataSource): Promise<void> {
    if (!dataSource.isInitialized) {
        throw new Error('database not initialized');
    }

    const runner = dataSource.createQueryRunner();

    try {
        await runner.connect();
        await runner.startTransaction();

        ```
// Promise.race só para de esperar.
// não cancela query no postgres.
//
// statement_timeout cancela do lado certo.
// do lado que estava segurando a faca.
await setLocalStatementTimeout(runner, DB_HEALTH_TIMEOUT_MS);

await runner.query('SELECT 1');

await runner.rollbackTransaction();
```

    } catch (error) {
        await rollbackQuietly(runner);

        ```
throw error;
```

    } finally {
        await runner.release();
    }
}

async function setLocalStatementTimeout(
    runner: QueryRunner,
    timeoutMs: number,
): Promise<void> {
    await runner.query(
        `SELECT set_config('statement_timeout', $1, true)`,
        [`${timeoutMs}ms`],
    );
}

async function rollbackQuietly(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) {
        return;
    }

    try {
        await runner.rollbackTransaction();
    } catch {
        // health já falhou.
        // rollback falhando aqui não ganha outro drama.
    }
}
