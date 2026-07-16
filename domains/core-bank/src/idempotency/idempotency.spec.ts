import { IdempotencyService } from './idempotency.service';
import { InMemoryIdempotencyRepository } from './in-memory-idempotency.repository';
import { IdempotencyState } from './idempotency.entity';
import { ConflictException } from '../errors/core-banking.errors';

describe('IdempotencyService (PR-07)', () => {
  let repo: InMemoryIdempotencyRepository;
  let service: IdempotencyService;

  beforeEach(() => {
    repo = new InMemoryIdempotencyRepository();
    service = new IdempotencyService(repo);
  });

  const payload = { amountCents: '1000', accountId: 'acc-1' };

  it('payloadHash é determinístico com chaves ordenadas', () => {
    const h1 = IdempotencyService.payloadHash({ b: 2, a: 1 });
    const h2 = IdempotencyService.payloadHash({ a: 1, b: 2 });
    expect(h1).toBe(h2);
  });

  it('primeira chamada → ACQUIRED em PROCESSING', async () => {
    const result = await service.begin('key-1', payload);
    expect(result.action).toBe('ACQUIRED');
    if (result.action === 'ACQUIRED') {
      expect(result.record.state).toBe(IdempotencyState.PROCESSING);
    }
  });

  it('COMPLETED → Replay com responseReference', async () => {
    await service.begin('key-2', payload);
    await service.complete('key-2', 'resp-abc');
    const result = await service.begin('key-2', payload);
    expect(result.action).toBe('REPLAY');
    if (result.action === 'REPLAY') {
      expect(result.responseReference).toBe('resp-abc');
    }
  });

  it('UNKNOWN → Blocked (não executa, não tenta)', async () => {
    await service.begin('key-3', payload);
    await service.markUnknown('key-3');
    const result = await service.begin('key-3', payload);
    expect(result.action).toBe('BLOCKED');
    if (result.action === 'BLOCKED') {
      expect(result.reason).toBe('UNKNOWN');
    }
  });

  it('FAILED_RETRYABLE → Acquired (pode retentar)', async () => {
    await service.begin('key-4', payload);
    await service.failRetryable('key-4');
    const result = await service.begin('key-4', payload);
    expect(result.action).toBe('ACQUIRED');
    if (result.action === 'ACQUIRED') {
      expect(result.record.state).toBe(IdempotencyState.PROCESSING);
    }
  });

  it('payload diferente na mesma chave → ConflictException', async () => {
    await service.begin('key-5', payload);
    await expect(
      service.begin('key-5', { amountCents: '2000', accountId: 'acc-1' }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_PAYLOAD_DRIFT' });
    await expect(
      service.begin('key-5', { amountCents: '2000', accountId: 'acc-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('PROCESSING bloqueia segunda begin concorrente', async () => {
    await service.begin('key-6', payload);
    const result = await service.begin('key-6', payload);
    expect(result.action).toBe('BLOCKED');
    if (result.action === 'BLOCKED') {
      expect(result.reason).toBe('PROCESSING');
    }
  });

  it('markUnknown só a partir de PROCESSING', async () => {
    await service.begin('key-7', payload);
    await service.complete('key-7', 'done');
    await expect(service.markUnknown('key-7')).rejects.toMatchObject({
      code: 'IDEMPOTENCY_INVALID_UNKNOWN',
    });
  });

  it('complete persiste responseReference', async () => {
    await service.begin('key-8', payload);
    const done = await service.complete('key-8', 'pay-ref-99');
    expect(done.state).toBe(IdempotencyState.COMPLETED);
    expect(done.responseReference).toBe('pay-ref-99');
  });
});