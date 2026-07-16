import { Injectable } from '@nestjs/common';
import {
  REGULATORY_ACTIVATION_REQUIRED,
  CryptoAdapterKind,
  CryptoCommand,
  CryptoHealth,
  CryptoPort,
  CryptoResult,
} from '../../ports/crypto.port';

@Injectable()
export class CryptoProductionAdapter implements CryptoPort {
  readonly kind: CryptoAdapterKind = 'production';

  async health(): Promise<CryptoHealth> {
    throw REGULATORY_ACTIVATION_REQUIRED('crypto', 'production');
  }

  async execute(_command: CryptoCommand): Promise<CryptoResult> {
    throw REGULATORY_ACTIVATION_REQUIRED('crypto', 'production');
  }
}
