import { Injectable } from '@nestjs/common';
import {
  DictAdapterKind,
  DictHealth,
  DictLookupCommand,
  DictLookupResult,
  DictPort,
} from '../../ports/dict.port';

@Injectable()
export class DictSandboxAdapter implements DictPort {
  readonly kind: DictAdapterKind = 'sandbox';
  private readonly keys = new Map<string, DictLookupResult>([
    ['sandbox@regenera.bank', { pixKey: 'sandbox@regenera.bank', found: true, ownerMasked: 'S*** R***', ispb: '12345678' }],
  ]);

  async health(): Promise<DictHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'DICT', adapter: 'sandbox' };
  }

  async lookupKey(command: DictLookupCommand): Promise<DictLookupResult> {
    return (
      this.keys.get(command.pixKey) ?? {
        pixKey: command.pixKey,
        found: false,
      }
    );
  }
}
