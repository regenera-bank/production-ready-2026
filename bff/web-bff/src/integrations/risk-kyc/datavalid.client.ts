import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  isDiditKycProvider,
  isHomologKycProvider,
} from '../../config/kyc-provider';
import { HomologKycValidator } from './homolog-kyc.validator';
import { PrometeoIdentityClient } from './prometeo-identity.client';

export interface DataValidValidateResult {
  readonly valid: boolean;
}

export interface DataValidBiometricResult {
  readonly score: number;
  readonly match: boolean;
}

@Injectable()
export class DataValidClient {
  constructor(
    private readonly prometeo: PrometeoIdentityClient,
    private readonly homologKyc: HomologKycValidator,
  ) {}

  private serproConfigured(): boolean {
    return Boolean(
      process.env.DATAVALID_API_URL?.trim() &&
        process.env.DATAVALID_API_KEY?.trim(),
    );
  }

  private requireConfig(): { baseUrl: string; apiKey: string } {
    const baseUrl = process.env.DATAVALID_API_URL?.trim();
    const apiKey = process.env.DATAVALID_API_KEY?.trim();
    if (!baseUrl || !apiKey) {
      throw new ServiceUnavailableException(
        'DATAVALID_API_URL e DATAVALID_API_KEY obrigatórios para biometria',
      );
    }
    return { baseUrl, apiKey };
  }

  async validate(document: string): Promise<DataValidValidateResult> {
    if (isHomologKycProvider() || isDiditKycProvider()) {
      const digits = document.replace(/\D/g, '');
      return { valid: digits.length === 11 };
    }
    if (!this.serproConfigured()) {
      if (!process.env.PROMETEO_API_KEY?.trim()) {
        throw new ServiceUnavailableException(
          'DATAVALID ou PROMETEO_API_KEY obrigatórios para validação cadastral',
        );
      }
      const identity = await this.prometeo.validateCpf(document);
      return {
        valid: identity.found && Boolean(identity.basicData?.Name),
      };
    }

    const { baseUrl, apiKey } = this.requireConfig();
    const digits = document.replace(/\D/g, '');
    const response = await fetch(`${baseUrl}/v1/cpf/${digits}/validate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `DataValid CPF validate falhou (${response.status})`,
      );
    }
    const body = (await response.json()) as { valid?: boolean };
    return { valid: body.valid === true };
  }

  async matchFacialBiometrics(data: {
    selfie: string;
    document: string;
  }): Promise<DataValidBiometricResult> {
    if (!data.selfie?.trim() || !data.document?.trim()) {
      return { score: 0, match: false };
    }

    const homologKyc =
      process.env.KYC_PROVIDER?.trim().toLowerCase() === 'firebase' ||
      process.env.KYC_PROVIDER?.trim().toLowerCase() === 'homolog';
    if (homologKyc) {
      const verdict = await this.homologKyc.matchFacialBiometrics(data);
      return {
        score: verdict.score,
        match: verdict.match,
      };
    }

    const { baseUrl, apiKey } = this.requireConfig();
    const response = await fetch(`${baseUrl}/v1/biometrics/match`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selfieBase64: data.selfie,
        documentPhotoBase64: data.document,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `DataValid biometria falhou (${response.status})`,
      );
    }

    const body = (await response.json()) as { score?: number; match?: boolean };
    const score = typeof body.score === 'number' ? body.score : 0;
    return {
      score,
      match: body.match === true && score >= 0.85,
    };
  }
}