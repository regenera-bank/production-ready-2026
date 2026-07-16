import { TransactionProjectionService } from './transaction-projection.service';

describe('TransactionProjectionService', () => {
  let service: TransactionProjectionService;

  beforeEach(() => {
    service = new TransactionProjectionService();
    service.reset();
  });

  it('projeta payment.settled idempotente por paymentId', async () => {
    const event = {
      eventType: 'payment.settled' as const,
      customerId: 'user-1',
      paymentId: 'pay-1',
      transactionId: 'pay-1',
      correlationId: 'corr-1',
      idempotencyKey: 'idem-1',
      direction: 'outflow' as const,
      amountCents: '50',
      title: 'Pix enviado',
      party: 'Destino',
      channel: 'pix',
      icon: 'send',
      category: 'essential',
      occurredAt: new Date().toISOString(),
    };
    const first = await service.applyOutboxEvent(event);
    const second = await service.applyOutboxEvent(event);
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(service.listByCustomer('user-1')).toHaveLength(1);
  });

  it('lista extrato com sinal negativo em outflow', async () => {
    await service.applyOutboxEvent({
      eventType: 'payment.settled',
      customerId: 'user-2',
      paymentId: 'pay-2',
      transactionId: 'pay-2',
      correlationId: 'corr-2',
      idempotencyKey: 'idem-2',
      direction: 'outflow',
      amountCents: '100',
      title: 'Transferência',
      party: 'Credor',
      channel: 'transfer',
      icon: 'send',
      category: 'essential',
      occurredAt: new Date().toISOString(),
    });
    const [row] = service.listByCustomer('user-2');
    expect(row.amountCents).toBe('-100');
    expect(row.type).toBe('outflow');
  });
});