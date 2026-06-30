import { Test, TestingModule } from '@nestjs/testing';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

describe('CasesController', () => {
  let controller: CasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [CasesService],
    }).compile();

    controller = module.get<CasesController>(CasesController);
  });

  it('lists stub cases', () => {
    const cases = controller.list();
    expect(cases.length).toBeGreaterThanOrEqual(2);
  });

  it('creates a new case stub', () => {
    const created = controller.create({ title: 'Fraud review', priority: 'HIGH' });
    expect(created.caseId).toMatch(/^CASE-/);
    expect(created.status).toBe('OPEN');
  });

  it('escalates an existing case', () => {
    const escalated = controller.escalate('CASE-1001');
    expect(escalated.status).toBe('ESCALATED');
    expect(escalated.priority).toBe('HIGH');
  });
});