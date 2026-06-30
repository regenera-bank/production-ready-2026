// ledger-posting.service.ts
//
// isso aqui não é blockchain.
// não é event sourcing bonito.
// é razão de partidas dobradas.
//
// lançamento não edita.
// lançamento não some.
// lançamento não "ajusta depois".
//
// se débito e crédito não fecham,
// dinheiro apareceu do nada ou caiu no ralo.
//
// a aplicação valida pra dar erro legível.
// o banco valida no commit pra dar garantia.
//
// dois cintos de segurança.
// o carro transporta dinheiro alheio.

import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { Money } from '../domain/money.value-object';
import { LedgerDirection } from '../domain/state-machines';
import { MetricsService } from '../metrics/metrics.service';

export interface PostingLine {
  ledgerAccountId: string;
  direction: LedgerDirection;
  amount: Money;
}

export interface PostingRequest {
  referenceType: string;
  referenceId: string;
  description: string;
  lines: PostingLine[];
  correlationId: string;
  causationId?: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
}

export class LedgerPostingError extends UnprocessableEntityException {
  constructor(code: string, detail?: Record<string, unknown>) {
    super({
      code,
      ...detail,
    });
  }
}

export class UnbalancedPostingError extends UnprocessableEntityException {
  constructor(imbalanceCents: string) {
    super({
      code: 'LEDGER_UNBALANCED',
      imbalanceCents,
    });
  }
}

const REFERENCE_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{2,39}$/;
const EVENT_TYPE_PATTERN = /^[A-Z][A-Z0-9_]{2,79}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_REVERSAL_REASON_LENGTH = 500;
const MAX_LINES = 200;
const MAX_EVENT_PAYLOAD_BYTES = 128 * 1024;

@Injectable()
export class LedgerPostingService {
  constructor(private readonly metrics: MetricsService) { }

  async post(runner: QueryRunner, request: PostingRequest): Promise<string> {
    validatePostingRequest(request);

    ```
const imbalance = computeImbalance(request.lines);

if (imbalance !== 0n) {
  this.metrics.increment('ledger_imbalance_total', {
    referenceClass: request.referenceType,
  });

  throw new UnbalancedPostingError(imbalance.toString(10));
}

const [entry]: Array<{ id: string }> = await runner.query(
  `INSERT INTO ledger_entries
      (reference_type, reference_id, description)
    VALUES($1, $2, $3)
   RETURNING id`,
  [
    request.referenceType,
    request.referenceId,
    request.description.trim(),
  ],
);

if (!entry) {
  // insert sem returning é banco contando piada.
  // não continua sem id de lançamento.
  throw new LedgerPostingError('LEDGER_ENTRY_INSERT_FAILED');
}

for (const line of request.lines) {
  await runner.query(
    `INSERT INTO ledger_lines
      (entry_id, ledger_account_id, direction, amount_cents)
    VALUES($1, $2, $3, $4:: bigint)`,
    [
      entry.id,
      line.ledgerAccountId,
      line.direction,
      line.amount.toCentsString(),
    ],
  );
}

// outbox nasce na mesma transação.
// evento sem lançamento é fofoca.
// lançamento sem evento vira reconciliação manual.
await runner.query(
  `INSERT INTO outbox_events
      (aggregate_type, aggregate_id, event_type, payload, correlation_id, causation_id)
    VALUES($1, $2, $3, $4:: jsonb, $5, $6)`,
  [
    request.referenceType,
    request.referenceId,
    request.eventType,
    jsonb({
      ...request.eventPayload,
      ledgerEntryId: entry.id,
    }),
    request.correlationId,
    request.causationId ?? null,
  ],
);

this.metrics.increment('ledger_entries_total', {
  referenceClass: request.referenceType,
});

return entry.id;
```

  }

  async reverse(
    runner: QueryRunner,
    originalEntryId: string,
    reason: string,
    correlationId: string,
  ): Promise<string> {
    validateUuid(originalEntryId, 'LEDGER_ENTRY_ID_INVALID');
    validateUuid(correlationId, 'LEDGER_CORRELATION_ID_INVALID');

    ```
const cleanReason = cleanText(
  reason,
  'LEDGER_REVERSAL_REASON_REQUIRED',
  MAX_REVERSAL_REASON_LENGTH,
);

const originalRows: Array<{
  reference_type: string;
  reference_id: string;
  description: string;
}> = await runner.query(
  `SELECT reference_type, reference_id, description
     FROM ledger_entries
    WHERE id = $1
    FOR UPDATE`,
  [originalEntryId],
);

const original = originalRows[0];

if (!original) {
  throw new LedgerPostingError('LEDGER_ENTRY_NOT_FOUND');
}

if (original.description.startsWith('REVERSAL:')) {
  // estornar estorno é fabricar confusão.
  // correção de correção precisa de lançamento novo explícito,
  // não gambiarra em cima da gambiarra.
  throw new LedgerPostingError('LEDGER_REVERSAL_OF_REVERSAL_FORBIDDEN');
}

const reversalDescription = `REVERSAL:${ originalEntryId } `;

// o FOR UPDATE no lançamento original serializa a corrida.
// duas chamadas entram.
// uma estorna.
// a outra vê que já existe.
const existing: Array<{ id: string }> = await runner.query(
  `SELECT id
     FROM ledger_entries
    WHERE reference_type = $1
      AND reference_id = $2
      AND description = $3`,
  [
    original.reference_type,
    original.reference_id,
    reversalDescription,
  ],
);

if (existing.length > 0) {
  return existing[0].id;
}

const lines: Array<{
  ledger_account_id: string;
  direction: LedgerDirection;
  amount_cents: string;
}> = await runner.query(
  `SELECT ledger_account_id,
      direction,
      amount_cents::text AS amount_cents
     FROM ledger_lines
    WHERE entry_id = $1
    ORDER BY line_seq`,
  [originalEntryId],
);

if (lines.length < 2) {
  // lançamento antigo com uma perna só não é lançamento.
  // é evidência de problema anterior.
  throw new LedgerPostingError('LEDGER_ORIGINAL_ENTRY_CORRUPTED');
}

return this.post(runner, {
  referenceType: original.reference_type,
  referenceId: original.reference_id,
  description: reversalDescription,
  correlationId,
  causationId: originalEntryId,
  eventType: 'LEDGER_ENTRY_REVERSED',
  eventPayload: {
    originalEntryId,
    reason: cleanReason,
  },
  lines: lines.map((line) => ({
    ledgerAccountId: line.ledger_account_id,
    direction: oppositeDirection(line.direction),
    amount: Money.fromCents(line.amount_cents),
  })),
});
```

  }

  async signedBalance(
    runner: QueryRunner,
    ledgerAccountId: string,
    lockAccount = false,
  ): Promise<Money> {
    validateUuid(ledgerAccountId, 'LEDGER_ACCOUNT_ID_INVALID');

    ```
if (lockAccount) {
  await runner.query(
    `SELECT id
       FROM ledger_accounts
      WHERE id = $1
      FOR UPDATE`,
    [ledgerAccountId],
  );
}

const [row]: Array<{
  account_class: string;
  balance: string;
}> = await runner.query(
  `SELECT
    a.account_class,
      COALESCE(
        SUM(
          CASE
            WHEN a.account_class IN('ASSET', 'EXPENSE')
             AND l.direction = 'DEBIT'
              THEN l.amount_cents

            WHEN a.account_class IN('ASSET', 'EXPENSE')
             AND l.direction = 'CREDIT'
              THEN - l.amount_cents

            WHEN a.account_class IN('LIABILITY', 'EQUITY', 'REVENUE')
             AND l.direction = 'CREDIT'
              THEN l.amount_cents

            WHEN a.account_class IN('LIABILITY', 'EQUITY', 'REVENUE')
             AND l.direction = 'DEBIT'
              THEN - l.amount_cents

            ELSE 0
          END
        ),
        0
      )::text AS balance
     FROM ledger_accounts a
     LEFT JOIN ledger_lines l
       ON l.ledger_account_id = a.id
    WHERE a.id = $1
    GROUP BY a.account_class`,
  [ledgerAccountId],
);

if (!row) {
  throw new LedgerPostingError('LEDGER_ACCOUNT_NOT_FOUND');
}

return Money.fromCents(row.balance);
```

  }
}

function validatePostingRequest(request: PostingRequest): void {
  validateReferenceType(request.referenceType);
  validateUuid(request.referenceId, 'LEDGER_REFERENCE_ID_INVALID');
  validateUuid(request.correlationId, 'LEDGER_CORRELATION_ID_INVALID');

  if (request.causationId !== undefined) {
    validateUuid(request.causationId, 'LEDGER_CAUSATION_ID_INVALID');
  }

  validateEventType(request.eventType);

  request.description = cleanText(
    request.description,
    'LEDGER_DESCRIPTION_REQUIRED',
    MAX_DESCRIPTION_LENGTH,
  );

  if (!Array.isArray(request.lines) || request.lines.length < 2) {
    throw new LedgerPostingError('LEDGER_MIN_TWO_LINES');
  }

  if (request.lines.length > MAX_LINES) {
    throw new LedgerPostingError('LEDGER_TOO_MANY_LINES');
  }

  for (const line of request.lines) {
    validateLine(line);
  }
}

function validateLine(line: PostingLine): void {
  validateUuid(line.ledgerAccountId, 'LEDGER_ACCOUNT_ID_INVALID');

  if (
    line.direction !== LedgerDirection.DEBIT &&
    line.direction !== LedgerDirection.CREDIT
  ) {
    throw new LedgerPostingError('LEDGER_DIRECTION_INVALID');
  }

  if (!(line.amount instanceof Money)) {
    throw new LedgerPostingError('LEDGER_AMOUNT_INVALID');
  }

  if (!line.amount.isPositive()) {
    // valor negativo na linha é truque barato.
    // direção já carrega o sinal contábil.
    throw new LedgerPostingError('LEDGER_LINE_NOT_POSITIVE');
  }
}

function computeImbalance(lines: readonly PostingLine[]): bigint {
  let imbalance = 0n;

  for (const line of lines) {
    imbalance += line.direction === LedgerDirection.DEBIT
      ? line.amount.amountCents
      : -line.amount.amountCents;
  }

  return imbalance;
}

function oppositeDirection(direction: LedgerDirection): LedgerDirection {
  if (direction === LedgerDirection.DEBIT) {
    return LedgerDirection.CREDIT;
  }

  if (direction === LedgerDirection.CREDIT) {
    return LedgerDirection.DEBIT;
  }

  throw new LedgerPostingError('LEDGER_DIRECTION_INVALID');
}

function validateReferenceType(referenceType: string): void {
  if (REFERENCE_TYPE_PATTERN.test(referenceType)) {
    return;
  }

  throw new LedgerPostingError('LEDGER_REFERENCE_TYPE_INVALID');
}

function validateEventType(eventType: string): void {
  if (EVENT_TYPE_PATTERN.test(eventType)) {
    return;
  }

  throw new LedgerPostingError('LEDGER_EVENT_TYPE_INVALID');
}

function validateUuid(value: string, code: string): void {
  if (UUID_PATTERN.test(value)) {
    return;
  }

  throw new LedgerPostingError(code);
}

function cleanText(value: string, code: string, maxLength: number): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new LedgerPostingError(code);
  }

  return cleaned.slice(0, maxLength);
}

function jsonb(value: Record<string, unknown>): string {
  const json = JSON.stringify(value);

  if (json === undefined) {
    throw new LedgerPostingError('LEDGER_EVENT_PAYLOAD_INVALID');
  }

  const bytes = Buffer.byteLength(json, 'utf8');

  if (bytes > MAX_EVENT_PAYLOAD_BYTES) {
    throw new LedgerPostingError('LEDGER_EVENT_PAYLOAD_TOO_LARGE');
  }

  return json;
}
