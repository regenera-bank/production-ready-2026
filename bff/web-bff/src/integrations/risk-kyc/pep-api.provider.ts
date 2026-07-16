import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { PepCheckResult, PepProvider } from './pep.provider';

interface PepApiResponse {
  isPep?: boolean;
  score?: number;
}

@Injectable()
export class PepApiProvider implements PepProvider {
  async check(document: string): Promise<PepCheckResult> {
    const baseUrl = process.env.PEP_API_URL?.trim();
    const apiKey = process.env.PEP_API_KEY?.trim();
    if (!baseUrl || !apiKey) {
      throw new ServiceUnavailableException(
        'PEP_API_URL e PEP_API_KEY obrigatórios para consulta PEP',
      );
    }

    const digits = document.replace(/\D/g, '');
    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/pep/check/${digits}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `API PEP indisponível (${response.status})`,
      );
    }

    const body = (await response.json()) as PepApiResponse;
    const score = typeof body.score === 'number' ? body.score : 0;
    return {
      isPep: body.isPep === true,
      score,
    };
  }
}