import { Test } from '@nestjs/testing';
import { AccountingModule } from './accounting.module';
import { AccountingService } from './accounting.service';

describe('AccountingService (simulator)', () => {
  let service: AccountingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AccountingModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(AccountingService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('accounting');
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
