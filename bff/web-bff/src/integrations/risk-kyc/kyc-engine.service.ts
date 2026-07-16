import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { redactSensitiveLogPayload } from '../../common/pii-redaction';
import { DataValidClient } from './datavalid.client';
import type { PepProvider } from './pep.provider';
import { HomologKycValidator } from './homolog-kyc.validator';
import type { VisionAdapter } from './vision.adapter';

export type KycEngineStatus =
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'PENDING_DOCUMENTS';

export interface KycStep1Result {
  readonly status: KycEngineStatus | 'REJECTED';
  readonly kycId: string;
  readonly reason?: string;
  readonly pepScore?: number;
}

export interface KycDocumentResult {
  readonly status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  readonly documentType: string;
  readonly confidenceScore: number;
}

export interface KycSelfieResult {
  readonly status: 'APPROVED' | 'REJECTED';
  readonly confidence: number;
  readonly reason?: string;
}

/**
 * Motor KYC Auditado (domínio risco/KYC).
 */
@Injectable()
export class KycEngineService {
  private readonly logger = new Logger('KYC_ComplianceEngine');

  constructor(
    private readonly dataValid: DataValidClient,
    private readonly homologKyc: HomologKycValidator,
    @Inject('VISION_ADAPTER') private readonly vision: VisionAdapter,
    @Inject('PEP_PROVIDER') private readonly pepProvider: PepProvider,
  ) {}

  async processStep1(data: {
    cpf: string;
    fullName: string;
    birthDate: string;
  }): Promise<KycStep1Result> {
    const cpf = data.cpf.replace(/\D/g, '');
    if (cpf.length !== 11) {
      throw new BadRequestException(
        'Formato de CPF inválido para qualificação cadastral.',
      );
    }

    this.logger.log(
      `[KYC] PLD/PEP para CPF ***.${cpf.substring(3, 6)}.***`,
    );

    const isRestricted = await this.checkWatchlists(cpf);
    if (isRestricted) {
      return {
        status: 'REJECTED',
        reason: 'RESTRICTIVE_LIST_MATCH',
        kycId: randomUUID(),
      };
    }

    const pep = await this.pepProvider.check(cpf);
    if (pep.score >= 90) {
      return {
        status: 'REJECTED',
        reason: 'PEP_HIGH_RISK',
        kycId: randomUUID(),
        pepScore: pep.score,
      };
    }
    if (pep.isPep || pep.score >= 60) {
      return {
        status: 'MANUAL_REVIEW',
        reason: 'PEP_OR_HIGH_VALUE',
        kycId: `KYC_${randomUUID().substring(0, 8).toUpperCase()}`,
        pepScore: pep.score,
      };
    }

    const valid = await this.dataValid.validate(cpf);
    if (!valid.valid) {
      return {
        status: 'REJECTED',
        reason: 'DATAVALID_REJECTED',
        kycId: randomUUID(),
      };
    }

    return {
      status: 'PENDING_DOCUMENTS',
      kycId: `KYC_${randomUUID().substring(0, 8).toUpperCase()}`,
      pepScore: pep.score,
    };
  }

  async processDocument(
    fileBase64: string,
    type: 'RG' | 'CNH',
  ): Promise<KycDocumentResult> {
    if (!fileBase64?.trim()) {
      throw new BadRequestException(
        'Nenhum arquivo enviado para processamento de OCR.',
      );
    }

    const buffer = Buffer.from(
      fileBase64.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );

    try {
      if (this.homologKyc.isHomologMode()) {
        const homologDoc = await this.homologKyc.verifyDocument(buffer);
        if (!homologDoc.ok) {
          this.logger.warn(
            `[KYC OCR homolog] rejeitado: ${homologDoc.reason ?? 'DOCUMENT_REJECTED'}`,
          );
          return {
            status: 'REJECTED',
            documentType: type,
            confidenceScore: 0,
          };
        }
        return {
          status: 'APPROVED',
          documentType: type,
          confidenceScore: 0.92,
        };
      }

      const { fullText, confidence } = await this.vision.extractText(buffer);
      if (!fullText.trim()) {
        throw new BadRequestException(
          'Não foi possível extrair texto legível do documento.',
        );
      }

      const status =
        confidence > 0.85
          ? 'APPROVED'
          : this.homologKyc.isHomologMode()
            ? 'REJECTED'
            : 'MANUAL_REVIEW';
      this.logger.log(
        `[KYC OCR] ${type} score=${confidence} status=${status}`,
      );

      return {
        status,
        documentType: type,
        confidenceScore: confidence,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        redactSensitiveLogPayload(
          `[KYC] Falha OCR: ${error instanceof Error ? error.message : error}`,
        ),
      );
      throw new InternalServerErrorException(
        'Motor de OCR inoperante. Esteira pausada preventivamente.',
      );
    }
  }

  async processSelfie(
    fileBase64: string,
    documentReferenceBase64: string,
  ): Promise<KycSelfieResult> {
    if (!fileBase64?.trim() || !documentReferenceBase64?.trim()) {
      throw new BadRequestException(
        'Biometria facial requer selfie e foto do documento (1:1).',
      );
    }

    try {
      const result = await this.dataValid.matchFacialBiometrics({
        selfie: fileBase64,
        document: documentReferenceBase64,
      });

      const isApproved = result.score >= 0.85;
      if (!isApproved) {
        return {
          status: 'REJECTED',
          confidence: result.score,
          reason: 'LOW_SIMILARITY_SCORE',
        };
      }

      return { status: 'APPROVED', confidence: result.score };
    } catch (error) {
      this.logger.error(
        redactSensitiveLogPayload(
          `[KYC] Falha biométrica: ${error instanceof Error ? error.message : error}`,
        ),
      );
      throw new InternalServerErrorException(
        'Validação biométrica indisponível no momento.',
      );
    }
  }

  private async checkWatchlists(cpf: string): Promise<boolean> {
    const blocked = new Set(['00000000000', '11111111111', '99999999999']);
    return blocked.has(cpf);
  }
}