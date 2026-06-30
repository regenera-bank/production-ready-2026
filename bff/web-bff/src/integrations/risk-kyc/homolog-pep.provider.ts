import type { PepCheckResult, PepProvider } from './pep.provider';

/** Homolog — sem Prometeo; PEP neutro para destravar o pipeline local. */
export class HomologPepProvider implements PepProvider {
  async check(_document: string): Promise<PepCheckResult> {
    return { isPep: false, score: 0 };
  }
}