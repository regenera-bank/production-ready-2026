import { BadRequestException, Injectable } from '@nestjs/common';
import { AddressService } from '../../address/address.service';
import type { AddressRecord } from '../../onboarding/onboarding.types';
import { PrometeoIdentityClient } from './prometeo-identity.client';
import { KycEngineService } from './kyc-engine.service';

export interface CadastralKycInput {
  readonly document: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly address: AddressRecord;
  readonly birthDate: string;
}

export type KycPipelineStep =
  | 'cadastral'
  | 'document'
  | 'selfie'
  | 'manual_review'
  | 'done';

export interface CadastralKycResult {
  readonly kycId: string;
  readonly kycStep: KycPipelineStep;
  readonly kycStatus: 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  readonly reason?: string;
  readonly identitySource?: string;
  readonly pepScore?: number;
}

export interface DocumentKycResult {
  readonly kycStep: KycPipelineStep;
  readonly kycStatus: 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  readonly reason?: string;
  readonly confidenceScore?: number;
}

export interface SelfieKycResult {
  readonly kycStep: KycPipelineStep;
  readonly kycStatus: 'APPROVED' | 'REJECTED';
  readonly reason?: string;
  readonly confidence?: number;
}

const normalizeDocument = (document: string): string =>
  document.replace(/\D/g, '').slice(-11);

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
};

const isValidPostalCode = (postalCode: string): boolean =>
  /^\d{5}-?\d{3}$/.test(postalCode.trim());

const isValidBirthDate = (birthDate: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim());

const homologKyc = (): boolean => {
  const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
  return provider === 'firebase' || provider === 'homolog';
};

@Injectable()
export class RiskKycOrchestrator {
  constructor(
    private readonly engine: KycEngineService,
    private readonly prometeo: PrometeoIdentityClient,
    private readonly address: AddressService,
  ) {}

  async runCadastralStep(input: CadastralKycInput): Promise<CadastralKycResult> {
    const cpf = normalizeDocument(input.document);
    if (cpf.length !== 11) {
      throw new BadRequestException('CPF inválido para qualificação cadastral');
    }
    if (!input.displayName.trim()) {
      throw new BadRequestException('Nome completo obrigatório');
    }
    if (!isValidEmail(input.email)) {
      throw new BadRequestException('E-mail inválido');
    }
    if (!isValidPhone(input.phone)) {
      throw new BadRequestException('Telefone inválido');
    }
    if (!input.birthDate?.trim() || !isValidBirthDate(input.birthDate)) {
      throw new BadRequestException(
        'Data de nascimento obrigatória (formato AAAA-MM-DD)',
      );
    }
    const addr = input.address;
    if (
      !addr.street.trim() ||
      !addr.number.trim() ||
      !addr.neighborhood.trim() ||
      !addr.city.trim() ||
      !addr.state.trim() ||
      !isValidPostalCode(addr.postalCode)
    ) {
      throw new BadRequestException('Endereço incompleto ou CEP inválido');
    }

    let cepLookup;
    try {
      cepLookup = await this.address.lookupCep(addr.postalCode);
    } catch {
      return {
        kycId: '',
        kycStep: 'cadastral',
        kycStatus: 'REJECTED',
        reason: 'INVALID_CEP',
      };
    }
    const stateMatches =
      cepLookup.state.toUpperCase() === addr.state.trim().toUpperCase();
    const cityMatches =
      cepLookup.city.toLowerCase() === addr.city.trim().toLowerCase();
    if (!stateMatches || !cityMatches) {
      return {
        kycId: '',
        kycStep: 'cadastral',
        kycStatus: 'REJECTED',
        reason: 'ADDRESS_CEP_MISMATCH',
      };
    }

    let identitySource = homologKyc() ? 'firebase-homolog' : undefined;
    if (!homologKyc()) {
      const identity = await this.prometeo.validateCpf(cpf);
      if (!identity.found || !identity.basicData) {
        return {
          kycId: '',
          kycStep: 'cadastral',
          kycStatus: 'REJECTED',
          reason: 'IDENTITY_NOT_FOUND',
        };
      }

      const registryName = String(identity.basicData.Name ?? '').toUpperCase();
      const providedName = input.displayName.trim().toUpperCase();
      const nameMatches =
        registryName.includes(providedName.split(' ')[0] ?? '') ||
        providedName.includes(registryName.split(' ')[0] ?? '');

      if (!nameMatches) {
        return {
          kycId: '',
          kycStep: 'cadastral',
          kycStatus: 'REJECTED',
          reason: 'NAME_MISMATCH',
          identitySource: identity.source,
        };
      }
      identitySource = identity.source;
    }

    const step1 = await this.engine.processStep1({
      cpf,
      fullName: input.displayName,
      birthDate: input.birthDate.trim(),
    });

    if (step1.status === 'REJECTED') {
      return {
        kycId: step1.kycId,
        kycStep: 'cadastral',
        kycStatus: 'REJECTED',
        reason: step1.reason,
        identitySource,
        pepScore: step1.pepScore,
      };
    }

    if (step1.status === 'MANUAL_REVIEW') {
      return {
        kycId: step1.kycId,
        kycStep: 'manual_review',
        kycStatus: 'IN_REVIEW',
        reason: step1.reason,
        identitySource,
        pepScore: step1.pepScore,
      };
    }

    return {
      kycId: step1.kycId,
      kycStep: 'document',
      kycStatus: 'IN_REVIEW',
      identitySource,
      pepScore: step1.pepScore,
    };
  }

  async runDocumentStep(
    fileBase64: string,
    type: 'RG' | 'CNH',
  ): Promise<DocumentKycResult> {
    const doc = await this.engine.processDocument(fileBase64, type);
    if (doc.status === 'REJECTED') {
      return {
        kycStep: 'document',
        kycStatus: 'REJECTED',
        reason: 'DOCUMENT_REJECTED',
        confidenceScore: doc.confidenceScore,
      };
    }
    if (doc.status === 'MANUAL_REVIEW') {
      return {
        kycStep: 'manual_review',
        kycStatus: 'IN_REVIEW',
        reason: 'DOCUMENT_MANUAL_REVIEW',
        confidenceScore: doc.confidenceScore,
      };
    }
    return {
      kycStep: 'selfie',
      kycStatus: 'IN_REVIEW',
      confidenceScore: doc.confidenceScore,
    };
  }

  async runSelfieStep(
    selfieBase64: string,
    documentPhotoBase64: string,
  ): Promise<SelfieKycResult> {
    const selfie = await this.engine.processSelfie(
      selfieBase64,
      documentPhotoBase64,
    );
    if (selfie.status === 'REJECTED') {
      return {
        kycStep: 'selfie',
        kycStatus: 'REJECTED',
        reason: selfie.reason,
        confidence: selfie.confidence,
      };
    }
    return {
      kycStep: 'done',
      kycStatus: 'APPROVED',
      confidence: selfie.confidence,
    };
  }
}