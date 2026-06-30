import { Test, TestingModule } from '@nestjs/testing';
import { OpenFinanceService } from './open-finance.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('OpenFinanceService (Consent Management)', () => {
  let service: OpenFinanceService;
  let configServiceMock: Partial<ConfigService>;

  beforeEach(async () => {
    configServiceMock = {
      getOrThrow: jest.fn().mockReturnValue('mocked-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenFinanceService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<OpenFinanceService>(OpenFinanceService);
  });

  describe('Gestão de Consentimento (BACEN)', () => {
    it('deve criar um consentimento ativo com validade correta', async () => {
      const neuralId = 'user_123';
      const provider = 'BANCO_BRASIL';

      const consent = await service.createConsent(neuralId, provider, 24);

      expect(consent).toBeDefined();
      expect(consent.status).toBe('ACTIVE');
      expect(consent.neuralId).toBe(neuralId);
      expect(consent.permissions).toContain('ACCOUNTS_READ');
    });

    it('deve revogar um consentimento existente', async () => {
      const neuralId = 'user_123';
      const consent = await service.createConsent(neuralId, 'NUBANK', 24);

      const result = await service.revokeConsent(consent.id, neuralId);
      expect(result.status).toBe('REVOKED');

      // Tentar usar o consentimento revogado deve lançar erro
      await expect(
        service.getAccounts('session-key', consent.id, neuralId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve impedir a revogação de consentimento por um usuário dono diferente', async () => {
      const consent = await service.createConsent('dono_legitimo', 'ITAU', 24);

      await expect(
        service.revokeConsent(consent.id, 'hacker_user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve barrar acesso a dados bancários (ex: getAccounts) com consentimento inválido', async () => {
      await expect(
        service.getAccounts('session-key', 'consentimento_falso', 'user_123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
