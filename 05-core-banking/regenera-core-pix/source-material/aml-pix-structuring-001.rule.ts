// aml-pix-structuring-001.rule.ts
//
// pld não adivinha crime.
// pld levanta sinal.
//
// fracionamento é velho.
// quebra valor, espalha chave, passa raspando no limite
// e espera que o sistema olhe só transação isolada.
//
// esta regra olha janela.
// se disparar, abre alerta.
// quem decide é compliance.
// o código só não deixa o padrão passar limpo.

import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { Money } from '../../domain/money.value-object';

export interface StructuringRuleParams {
    windowHours: number;
    minTxCount: number;
    singleTxCeilingCents: string;
    aggregateFloorCents: string;
    nearLimitBps: bigint;
    nearLimitCount: number;
    minDistinctKeys: number;
}

export const AML_PIX_STRUCTURING_001_DEFAULTS: StructuringRuleParams = {
    windowHours: 24,
    minTxCount: 5,
    singleTxCeilingCents: '1000000',
    aggregateFloorCents: '3000000',
    nearLimitBps: 9000n,
    nearLimitCount: 3,
    minDistinctKeys: 3,
};

export interface StructuringEvaluation {
    ruleCode: typeof AmlPixStructuring001Rule.RULE_CODE;
    triggered: boolean;
    severity: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    criteria: {
        volumeAndFrequency: boolean;
        nearLimitPattern: boolean;
        receiverSpread: boolean;
    };
    txCount: number;
    nearLimitHits: number;
    aggregate: Money;
    distinctReceiverKeys: number;
    windowStart: Date;
    windowEnd: Date;
    dedupKey: string;
}

interface PixRow {
    amount_cents: string;
    receiver_key_hash: string;
}

@Injectable()
export class AmlPixStructuring001Rule {
    static readonly RULE_CODE = 'AML_PIX_STRUCTURING_001';

    private readonly logger = new Logger(AmlPixStructuring001Rule.RULE_CODE);

    constructor(private readonly dataSource: DataSource) { }

    async evaluate(
        senderAccountId: string,
        asOf: Date,
        params: StructuringRuleParams = AML_PIX_STRUCTURING_001_DEFAULTS,
    ): Promise<StructuringEvaluation> {
        assertParams(params);

        ```
const windowEnd = new Date(asOf);
const windowStart = new Date(windowEnd.getTime() - params.windowHours * 3_600_000);

// falhou, reverteu ou ficou no meio não entra.
// alerta AML nasce do que liquidou.
// tentativa ruim pode virar outra regra. não esta.
const rows = await this.settledPixRows(
  senderAccountId,
  windowStart,
  windowEnd,
  params.singleTxCeilingCents,
);

const aggregate = sumAmounts(rows);
const nearLimitFloor = Money
  .fromCents(params.singleTxCeilingCents)
  .percentageBps(params.nearLimitBps);

const nearLimitHits = countNearLimit(rows, nearLimitFloor);
const distinctReceiverKeys = distinctKeys(rows);

const volumeAndFrequency =
  rows.length >= params.minTxCount &&
  aggregate.compare(Money.fromCents(params.aggregateFloorCents)) >= 0;

const nearLimitPattern = nearLimitHits >= params.nearLimitCount;

const receiverSpread =
  rows.length >= params.minTxCount &&
  distinctReceiverKeys >= params.minDistinctKeys;

const triggered = volumeAndFrequency && (nearLimitPattern || receiverSpread);

const severity = severityFor({
  triggered,
  volumeAndFrequency,
  nearLimitPattern,
  receiverSpread,
});

return {
  ruleCode: AmlPixStructuring001Rule.RULE_CODE,
  triggered,
  severity,
  criteria: {
    volumeAndFrequency,
    nearLimitPattern,
    receiverSpread,
  },
  txCount: rows.length,
  nearLimitHits,
  aggregate,
  distinctReceiverKeys,
  windowStart,
  windowEnd,
  dedupKey: dedupKeyFor(senderAccountId, windowStart),
};
```

    }

    async emitAlert(
        senderAccountId: string,
        evaluation: StructuringEvaluation,
        runner?: QueryRunner,
    ): Promise<string | null> {
        if (!evaluation.triggered) {
            return null;
        }

        ```
const db = runner ?? this.dataSource;

// alerta é append-only no sentido operacional:
// se já existe pra mesma regra, conta e janela, não duplica.
// spam de alerta faz analista parar de enxergar.
const result: Array<{ id: string }> = await db.query(
  `INSERT INTO aml_alerts
            (rule_code, account_id, severity, dedup_key, details, status)
        VALUES($1, $2, $3, $4, $5:: jsonb, 'OPEN')
   ON CONFLICT(dedup_key) DO NOTHING
   RETURNING id`,
  [
    evaluation.ruleCode,
    senderAccountId,
    evaluation.severity,
    evaluation.dedupKey,
    JSON.stringify({
      criteria: evaluation.criteria,
      txCount: evaluation.txCount,
      nearLimitHits: evaluation.nearLimitHits,
      aggregateCents: evaluation.aggregate.toCentsString(),
      distinctReceiverKeys: evaluation.distinctReceiverKeys,
      windowStart: evaluation.windowStart.toISOString(),
      windowEnd: evaluation.windowEnd.toISOString(),
    }),
  ],
);

if (result.length === 0) {
  return null;
}

// não joga account id em log.
// log vaza mais do que a gente gosta de admitir.
this.logger.warn(
  `alerta ${ evaluation.severity } emitido por ${ evaluation.ruleCode } `,
);

return result[0].id;
```

    }

    private async settledPixRows(
        senderAccountId: string,
        windowStart: Date,
        windowEnd: Date,
        singleTxCeilingCents: string,
    ): Promise<PixRow[]> {
        return this.dataSource.query(
            `SELECT amount_cents::text, receiver_key_hash
         FROM pix_payments
        WHERE sender_account_id = $1
          AND status = 'SETTLED'
          AND updated_at >= $2
          AND updated_at <= $3
          AND amount_cents < $4::bigint`,
            [senderAccountId, windowStart, windowEnd, singleTxCeilingCents],
        );
    }
}

function sumAmounts(rows: readonly PixRow[]): Money {
    let total = Money.zero();

    for (const row of rows) {
        total = total.add(Money.fromCents(row.amount_cents));
    }

    return total;
}

function countNearLimit(rows: readonly PixRow[], floor: Money): number {
    let count = 0;

    for (const row of rows) {
        if (Money.fromCents(row.amount_cents).compare(floor) >= 0) {
            count += 1;
        }
    }

    return count;
}

function distinctKeys(rows: readonly PixRow[]): number {
    const keys = new Set<string>();

    for (const row of rows) {
        keys.add(row.receiver_key_hash);
    }

    return keys.size;
}

function severityFor(input: {
    triggered: boolean;
    volumeAndFrequency: boolean;
    nearLimitPattern: boolean;
    receiverSpread: boolean;
}): StructuringEvaluation['severity'] {
    if (!input.triggered) {
        return 'NONE';
    }

    if (input.volumeAndFrequency && input.nearLimitPattern && input.receiverSpread) {
        return 'CRITICAL';
    }

    if (input.volumeAndFrequency && (input.nearLimitPattern || input.receiverSpread)) {
        return 'HIGH';
    }

    return 'MEDIUM';
}

function dedupKeyFor(senderAccountId: string, windowStart: Date): string {
    // janela fixa por hora.
    // mesma regra, mesma conta, mesma hora, um alerta.
    // se quiser granularidade menor, muda aqui e testa a fila de compliance.
    const source = [
        AmlPixStructuring001Rule.RULE_CODE,
        senderAccountId,
        windowStart.toISOString().slice(0, 13),
    ].join('|');

    return createHash('sha256')
        .update(source, 'utf8')
        .digest('hex');
}

function assertParams(params: StructuringRuleParams): void {
    if (!Number.isInteger(params.windowHours) || params.windowHours <= 0) {
        throw new Error('AML_PIX_STRUCTURING_001.windowHours inválido');
    }

    if (!Number.isInteger(params.minTxCount) || params.minTxCount <= 0) {
        throw new Error('AML_PIX_STRUCTURING_001.minTxCount inválido');
    }

    if (!Number.isInteger(params.nearLimitCount) || params.nearLimitCount <= 0) {
        throw new Error('AML_PIX_STRUCTURING_001.nearLimitCount inválido');
    }

    if (!Number.isInteger(params.minDistinctKeys) || params.minDistinctKeys <= 0) {
        throw new Error('AML_PIX_STRUCTURING_001.minDistinctKeys inválido');
    }

    Money.fromCents(params.singleTxCeilingCents);
    Money.fromCents(params.aggregateFloorCents);

    if (params.nearLimitBps <= 0n || params.nearLimitBps > 10_000n) {
        throw new Error('AML_PIX_STRUCTURING_001.nearLimitBps inválido');
    }
}
