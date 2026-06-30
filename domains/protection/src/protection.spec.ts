import { Test } from '@nestjs/testing';
import { ProtectionModule } from './protection.module';
import { ProtectionService } from './protection.service';

describe('ProtectionService (simulator)', () => {
  let service: ProtectionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProtectionModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(ProtectionService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('protection');
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
