import { AuditChainService } from './audit-chain.service';
import { InMemoryAuditChainRepository } from './in-memory-audit-chain.repository';
import { AUDIT_GENESIS_HASH } from './audit-chain.entity';
import { ValidationException } from '../errors/core-banking.errors';

describe('AuditChainService (PR-05)', () => {
  let repo: InMemoryAuditChainRepository;
  let service: AuditChainService;

  beforeEach(() => {
    repo = new InMemoryAuditChainRepository();
    service = new AuditChainService(repo);
  });

  it('primeiro evento ancora em genesis hash', async () => {
    const event = await service.append({
      eventType: 'PAYMENT_CREATED',
      payload: { paymentId: 'pay-1', amountCents: '1000' },
      correlationId: 'corr-1',
    });
    expect(event.previousHash).toBe(AUDIT_GENESIS_HASH);
    expect(event.eventHash).toHaveLength(64);
  });

  it('segundo evento encadeia previousHash do anterior', async () => {
    const first = await service.append({
      eventType: 'A',
      payload: { n: 1 },
    });
    const second = await service.append({
      eventType: 'B',
      payload: { n: 2 },
    });
    expect(second.previousHash).toBe(first.eventHash);
  });

  it('verify() passa em cadeia íntegra', async () => {
    await service.append({ eventType: 'A', payload: { x: 1 } });
    await service.append({ eventType: 'B', payload: { y: 2 } });
    const result = await service.verify();
    expect(result.valid).toBe(true);
    expect(result.eventsChecked).toBe(2);
  });

  it('adulteração de payload detectada por verify()', async () => {
    const event = await service.append({
      eventType: 'LEDGER_POSTED',
      payload: { entryId: 'je-1', amountCents: '500' },
    });
    await repo.replaceForTest(event.id, {
      ...event,
      payload: { entryId: 'je-1', amountCents: '999' },
    });
    const result = await service.verify();
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('adulterados');
    expect(result.firstInvalidId).toBe(event.id);
  });

  it('verifyOrThrow lança AUDIT_CHAIN_TAMPERED', async () => {
    const event = await service.append({
      eventType: 'X',
      payload: { ok: true },
    });
    await repo.replaceForTest(event.id, {
      ...event,
      eventHash: 'deadbeef'.repeat(8),
    });
    await expect(service.verifyOrThrow()).rejects.toMatchObject({
      code: 'AUDIT_CHAIN_TAMPERED',
    });
    await expect(service.verifyOrThrow()).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('computeEventHash é determinístico', () => {
    const params = {
      previousHash: AUDIT_GENESIS_HASH,
      eventType: 'TEST',
      payload: { a: 1, b: 2 },
      correlationId: null,
      createdAt: '2026-06-29T12:00:00.000Z',
    };
    const h1 = AuditChainService.computeEventHash(params);
    const h2 = AuditChainService.computeEventHash(params);
    expect(h1).toBe(h2);
  });

  it('previous_hash rompido é detectado', async () => {
    const e1 = await service.append({ eventType: 'A', payload: {} });
    const e2 = await service.append({ eventType: 'B', payload: {} });
    await repo.replaceForTest(e2.id, {
      ...e2,
      previousHash: 'invalid',
    });
    const result = await service.verify();
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('previous_hash');
    expect(result.firstInvalidId).toBe(e2.id);
    expect(e1.eventHash).not.toBe('invalid');
  });
});