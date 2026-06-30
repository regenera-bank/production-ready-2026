import { Test } from '@nestjs/testing';
import { CardAuthorizationModule } from './card-authorization.module';
import { CardAuthorizationService } from './card-authorization.service';

describe('CardAuthorizationService (simulator)', () => {
  let service: CardAuthorizationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CardAuthorizationModule.register({ adapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(CardAuthorizationService);
  });

  it('reports healthy simulator adapter', async () => {
    const health = await service.health();
    expect(health.ok).toBe(true);
    expect(health.adapter).toBe('simulator');
    expect(health.domain).toBe('card-authorization');
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
