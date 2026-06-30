import { OutboxService } from './outbox.service';
import { InMemoryOutboxRepository } from './in-memory-outbox.repository';
import { ValidationException, NotFoundException } from '../errors/core-banking.errors';

describe('OutboxService (PR-06)', () => {
  let repo: InMemoryOutboxRepository;
  let service: OutboxService;

  beforeEach(() => {
    repo = new InMemoryOutboxRepository();
    service = new OutboxService(repo);
  });

  it('append cria evento com publishedAt null', async () => {
    const event = await service.append({
      aggregateType: 'Payment',
      aggregateId: 'pay-1',
      eventType: 'PaymentCreated',
      payload: { amountCents: '1000' },
    });
    expect(event.publishedAt).toBeNull();
    expect(event.aggregateType).toBe('Payment');
  });

  it('pending retorna só eventos não publicados', async () => {
    const e1 = await service.append({
      aggregateType: 'Payment',
      aggregateId: 'a',
      eventType: 'E1',
      payload: {},
    });
    await service.markPublished(e1.id, '2026-06-29T10:00:00.000Z');
    await service.append({
      aggregateType: 'Payment',
      aggregateId: 'b',
      eventType: 'E2',
      payload: {},
    });
    const pending = await service.pending(10);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.eventType).toBe('E2');
  });

  it('pending(0) → ValidationException', async () => {
    await expect(service.pending(0)).rejects.toMatchObject({
      code: 'OUTBOX_PENDING_INVALID_LIMIT',
    });
    await expect(service.pending(0)).rejects.toBeInstanceOf(ValidationException);
  });

  it('pending com limite negativo → ValidationException', async () => {
    await expect(service.pending(-1)).rejects.toBeInstanceOf(ValidationException);
  });

  it('markPublished é idempotente', async () => {
    const event = await service.append({
      aggregateType: 'Payment',
      aggregateId: 'pay-2',
      eventType: 'PaymentSettled',
      payload: { id: 'pay-2' },
    });
    const first = await service.markPublished(
      event.id,
      '2026-06-29T12:00:00.000Z',
    );
    const second = await service.markPublished(event.id);
    expect(second.publishedAt).toBe(first.publishedAt);
    expect(second.publishedAt).toBe('2026-06-29T12:00:00.000Z');
  });

  it('markPublished em id inexistente → NotFoundException', async () => {
    await expect(
      service.markPublished('00000000-0000-0000-0000-000000000099'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('pending respeita ordem FIFO por createdAt', async () => {
    const old = await service.append({
      aggregateType: 'X',
      aggregateId: '1',
      eventType: 'OLD',
      payload: {},
    });
    await new Promise((r) => setTimeout(r, 2));
    await service.append({
      aggregateType: 'X',
      aggregateId: '2',
      eventType: 'NEW',
      payload: {},
    });
    const batch = await service.pending(1);
    expect(batch[0]!.id).toBe(old.id);
  });
});