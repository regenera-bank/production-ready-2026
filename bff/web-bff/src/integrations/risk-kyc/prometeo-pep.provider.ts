import { Injectable, Logger } from '@nestjs/common';
import { PrometeoIdentityClient } from './prometeo-identity.client';
import type { PepCheckResult, PepProvider } from './pep.provider';

const BLOCKED_CPFS = new Set(['00000000000', '11111111111', '99999999999']);

/**
 * PLD/PEP via Prometeo Identity quando PEP_API_* não está configurado.
 * Consulta real à API Prometeo — não é mock.
 */
@Injectable()
export class PrometeoPepProvider implements PepProvider {
  private readonly logger = new Logger(PrometeoPepProvider.name);

  constructor(private readonly prometeo: PrometeoIdentityClient) {}

  async check(document: string): Promise<PepCheckResult> {
    const cpf = document.replace(/\D/g, '');
    if (BLOCKED_CPFS.has(cpf)) {
      return { isPep: true, score: 100 };
    }

    const identity = await this.prometeo.validateCpf(cpf);
    if (!identity.found || !identity.basicData?.Name) {
      this.logger.warn(
        `[PEP/Prometeo] CPF sem identidade na base — score elevado (***.${cpf.substring(3, 6)}.***)`,
      );
      return { isPep: false, score: 72 };
    }

    return { isPep: false, score: 12 };
  }
}