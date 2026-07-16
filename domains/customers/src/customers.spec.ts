import { Test } from '@nestjs/testing';
import { CustomersModule } from './customers.module';
import { CustomersService } from './customers.service';

describe('CustomersService (simulator)', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CustomersModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(CustomersService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('customers');
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
