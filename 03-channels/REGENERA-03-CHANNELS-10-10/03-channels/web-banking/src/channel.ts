export type CommandState = 'READY' | 'SUBMITTED' | 'COMPLETED' | 'FAILED' | 'UNKNOWN';

export interface FinancialIntent {
  correlationId: string;
  idempotencyKey: string;
  amountCents: string;
  currency: 'BRL';
  state: CommandState;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CENTS = /^\d{1,19}$/;
const MAX_CENTS = 9_223_372_036_854_775_807n;
const TELEMETRY_FIELDS = new Set(['correlationId', 'route', 'result', 'durationMs']);

export function validateIntent(intent: FinancialIntent): Readonly<FinancialIntent> {
  if (!UUID.test(intent.correlationId)) throw new Error('CORRELATION_ID_INVALID');
  if (!UUID.test(intent.idempotencyKey)) throw new Error('IDEMPOTENCY_KEY_INVALID');
  if (intent.currency !== 'BRL') throw new Error('CURRENCY_UNSUPPORTED');
  if (!CENTS.test(intent.amountCents)) throw new Error('AMOUNT_INVALID');

  const amount = BigInt(intent.amountCents);
  if (amount <= 0n || amount > MAX_CENTS) throw new Error('AMOUNT_INVALID');
  if (intent.state === 'UNKNOWN') throw new Error('UNKNOWN_REQUIRES_RECONCILIATION');

  return Object.freeze({ ...intent });
}

export function canRetry(state: CommandState): boolean {
  return state === 'FAILED';
}

export function sessionCookie(maxAgeSeconds: number) {
  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) throw new Error('SESSION_TTL_INVALID');

  return Object.freeze({
    name: '__Host-rb_session',
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function presentBalance(amountCents: string, observedAt: string): Readonly<{ amountCents: string; observedAt: string; authoritative: false }> {
  if (!CENTS.test(amountCents) || BigInt(amountCents) > MAX_CENTS) throw new Error('BALANCE_INVALID');
  if (Number.isNaN(Date.parse(observedAt))) throw new Error('OBSERVED_AT_INVALID');

  return Object.freeze({ amountCents, observedAt, authoritative: false as const });
}

export function sanitizeTelemetry(input: Record<string, unknown>): Readonly<Record<string, unknown>> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (TELEMETRY_FIELDS.has(key)) clean[key] = value;
  }
  return Object.freeze(clean);
}
