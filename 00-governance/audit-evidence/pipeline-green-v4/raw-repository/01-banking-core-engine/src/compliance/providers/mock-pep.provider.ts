import { Injectable } from '@nestjs/common';
import { PepProvider, PepCheckResult } from './pep.provider';

@Injectable()
export class MockPepProvider implements PepProvider {
  async check(document: string): Promise<PepCheckResult> {
    // CPFs com final 13 simbolizam lista restritiva PEP em ambiente de staging isolado
    const isPep = document.endsWith('13');
    return {
      isPep,
      score: isPep ? 60 : 10,
    };
  }
}
