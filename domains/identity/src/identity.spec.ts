import { Test } from '@nestjs/testing';
import { IdentityModule } from './identity.module';
import { IdentityService } from './identity.service';

describe('IdentityService (simulator)', () => {
  let service: IdentityService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IdentityModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(IdentityService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('identity');
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
