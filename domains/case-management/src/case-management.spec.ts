import { Test } from '@nestjs/testing';
import { CaseManagementModule } from './case-management.module';
import { CaseManagementService } from './case-management.service';

describe('CaseManagementService (simulator)', () => {
  let service: CaseManagementService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CaseManagementModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(CaseManagementService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('case-management');
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
