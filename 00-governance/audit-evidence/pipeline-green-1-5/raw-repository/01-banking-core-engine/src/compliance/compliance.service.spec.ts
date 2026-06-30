import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { CoreService } from '../core/core.service';

describe('ComplianceService (AML/PLD)', () => {
  let complianceService: ComplianceService;
  let coreServiceMock: jest.Mocked<CoreService>;

  beforeEach(async () => {
    coreServiceMock = {
      freezeAccount: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: CoreService, useValue: coreServiceMock },
        {
          provide: 'PEP_PROVIDER',
          useValue: {
            check: jest.fn().mockImplementation(async (cpf) => {
              if (cpf.endsWith('13')) return { isPep: true, score: 70 };
              return { isPep: false, score: 10 };
            }),
          },
        },
      ],
    }).compile();

    complianceService = module.get<ComplianceService>(ComplianceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeTransactionRisk', () => {
    it('deve liberar (CLEARED) transação normal de baixo valor sem apontamento em listas restritivas', async () => {
      const result = await complianceService.analyzeTransactionRisk(
        'usr_123',
        50000,
        '12345678909',
      ); // R$ 500

      expect(result.isPep).toBe(false);
      expect(result.action).toBe('CLEARED');
      expect(result.riskScore).toBeLessThan(60);
      expect(coreServiceMock.freezeAccount).not.toHaveBeenCalled();
    });

    it('deve enviar para MANUAL_REVIEW transação normal de CPF em lista PEP', async () => {
      // Regra de Mock: CPF terminado em 13 simboliza lista restritiva/PEP
      const result = await complianceService.analyzeTransactionRisk(
        'usr_123',
        10000,
        '12345678913',
      );

      expect(result.isPep).toBe(true);
      expect(result.action).toBe('MANUAL_REVIEW');
      expect(result.reason).toBe('PEP_OR_HIGH_VALUE');
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(coreServiceMock.freezeAccount).not.toHaveBeenCalled();
    });

    it('deve CONGELAR a conta e acionar o BACEN para transação de Pessoa PEP e valor suspeito/atípico', async () => {
      // Transação de R$ 150.000,00 feita por CPF em lista restritiva PEP (terminado em 13)
      const result = await complianceService.analyzeTransactionRisk(
        'usr_123',
        15000000,
        '12345678913',
      );

      expect(result.isPep).toBe(true);
      expect(result.action).toBe('FROZEN');
      expect(result.reason).toBe('COAF_LIMIT_EXCEEDED');
      expect(result.riskScore).toBeGreaterThanOrEqual(90);

      // Verifica se o motor de transações foi acionado para efetuar o bloqueio
      expect(coreServiceMock.freezeAccount).toHaveBeenCalledTimes(1);
      expect(coreServiceMock.freezeAccount).toHaveBeenCalledWith(
        'usr_123',
        'SUSPEITA_LAVAGEM_DINHEIRO',
      );
    });
  });
});
