import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok status for windows channel', () => {
    expect(controller.check()).toEqual({
      status: 'ok',
      layer: 'operations-bff',
      channel: 'windows-operations',
    });
  });

  it('reports ready probe with stub dependencies', () => {
    const ready = controller.ready();
    expect(ready.status).toBe('degraded');
    expect(ready.dependencies.ledger).toBe('read-only-stub');
  });
});