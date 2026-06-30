import { Test } from '@nestjs/testing';
import { SuitabilityModule } from './suitability.module';
import { SuitabilityService } from './suitability.service';

describe('SuitabilityService (simulator)', () => {
  let service: SuitabilityService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SuitabilityModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(SuitabilityService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('suitability');
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
