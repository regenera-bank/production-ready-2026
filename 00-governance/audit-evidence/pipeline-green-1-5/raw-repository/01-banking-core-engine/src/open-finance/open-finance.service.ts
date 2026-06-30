/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface OpenFinanceConsent {
  id: string;
  neuralId: string;
  provider: string;
  permissions: string[];
  expiresAt: Date;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

@Injectable()
export class OpenFinanceService {
  private readonly logger = new Logger('OpenFinance_ITP');
  private readonly apiKey: string;
  private readonly TIMEOUT_MS = 12000;
  private readonly BASE_URL = 'https://banking.sandbox.prometeoapi.com';

  // Simulação de Banco de Dados para Gestão de Consentimentos (BACEN Requirement)
  private readonly consentVault = new Map<string, OpenFinanceConsent>();

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('PROMETEO_API_KEY');
  }

  /**
   * Camada MTLS Mock: Em produção, todas as chamadas Open Finance exigem certificado x509 cliente.
   */
  private async secureFetch(url: string, init?: RequestInit): Promise<any> {
    // Validação de Mutual TLS (MTLS) seria injetada no agent HTTP aqui
    this.logger.debug(
      `[MTLS Handshake] Conectando via túnel seguro para: ${url}`,
    );

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
          ...init?.headers,
        },
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });
    } catch (err: any) {
      throw new HttpException(
        'Falha na comunicação segura com o ecossistema Open Finance.',
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new HttpException(body, res.status);
    }
    return body;
  }

  /**
   * Criação de Consentimento Formal (Fase 2 BACEN)
   */
  async createConsent(
    neuralId: string,
    provider: string,
    ttlHours: number = 24,
  ): Promise<OpenFinanceConsent> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    const consent: OpenFinanceConsent = {
      id: `urn:regenera:consent:${randomUUID()}`,
      neuralId,
      provider,
      permissions: ['ACCOUNTS_READ', 'TRANSACTIONS_READ'],
      expiresAt,
      status: 'ACTIVE',
    };

    this.consentVault.set(consent.id, consent);
    this.logger.log(
      `[OPEN FINANCE] Consentimento criado: ${consent.id} (Validade: ${ttlHours}h)`,
    );
    return consent;
  }

  /**
   * Revogação Explícita de Consentimento
   */
  async revokeConsent(consentId: string, neuralId: string) {
    const consent = this.consentVault.get(consentId);
    if (!consent || consent.neuralId !== neuralId) {
      throw new BadRequestException(
        'Consentimento não localizado ou acesso negado.',
      );
    }
    consent.status = 'REVOKED';
    this.logger.log(
      `[OPEN FINANCE] Consentimento revogado pelo usuário: ${consentId}`,
    );
    return { status: 'REVOKED', consentId };
  }

  /**
   * Validação Ativa de Consentimento antes de operações de extração de dados
   */
  private validateConsent(consentId: string, neuralId: string) {
    const consent = this.consentVault.get(consentId);
    if (!consent || consent.neuralId !== neuralId) {
      throw new ForbiddenException(
        'Acesso negado: Consentimento Open Finance inválido.',
      );
    }
    if (consent.status !== 'ACTIVE' || new Date() > consent.expiresAt) {
      consent.status = 'EXPIRED';
      throw new ForbiddenException(
        'Consentimento Open Finance expirado ou revogado.',
      );
    }
    return consent;
  }

  // --- Operações de Dados (Prometeo API) ---

  async getProviders() {
    return this.secureFetch(`${this.BASE_URL}/provider/`);
  }

  async login(
    provider: string,
    username: string,
    password: string,
    consentId?: string,
    neuralId?: string,
  ) {
    return { token: 'mock-token' };
  }

  async getAccounts(key: string, consentId?: string, neuralId?: string) {
    if (consentId && neuralId) {
      this.validateConsent(consentId, neuralId);
    }
    return [];
  }

  async getTransactions(
    key: string,
    accountId: string,
    currency: string,
    dateStart: string,
    dateEnd?: string,
  ) {
    return [];
  }

  async logout(key: string) {
    return { success: true };
  }

  async createPaymentLink(
    amount: number,
    description: string,
    currency: string,
  ) {
    return { link: 'https://pay.regenerabank.app/mock' };
  }

  async getPaymentLinks() {
    return [];
  }

  async validateIdentity(documentNumber: string) {
    return { valid: true };
  }
}
