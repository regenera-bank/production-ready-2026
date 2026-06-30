import { Test } from '@nestjs/testing';
import { CustodyModule } from './custody.module';
import { CustodyService } from './custody.service';

describe('CustodyService (simulator)', () => {
  let service: CustodyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CustodyModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(CustodyService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('custody');
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
