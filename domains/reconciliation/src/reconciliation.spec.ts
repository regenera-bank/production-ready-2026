import { Test } from '@nestjs/testing';
import { ReconciliationModule } from './reconciliation.module';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationService (simulator)', () => {
  let service: ReconciliationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ReconciliationModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(ReconciliationService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('reconciliation');
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
