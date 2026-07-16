import { Test } from '@nestjs/testing';
import { CardInvoicesModule } from './card-invoices.module';
import { CardInvoicesService } from './card-invoices.service';

describe('CardInvoicesService (simulator)', () => {
  let service: CardInvoicesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CardInvoicesModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(CardInvoicesService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('card-invoices');
  });

  it('executes idempotent commands', async () => {
    const command = {
      idempotencyKey: 'key-1',
      principalId: 'principal-1',
      payload: { action: 'probe' },
    };
    const first = await service.execute(command);
    const second = await service.execute(command);
    expect(first.referenceId).toBe(second.referenceId);
    expect(first.status).toBe('ACCEPTED');
  });
});
