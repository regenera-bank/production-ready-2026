import { Injectable } from '@nestjs/common';
import {
  DictAdapterKind,
  DictHealth,
  DictLookupCommand,
  DictLookupResult,
  DictPort,
} from '../../ports/dict.port';

@Injectable()
export class DictSimulatorAdapter implements DictPort {
  readonly kind: DictAdapterKind = 'simulator';
  private readonly directory = new Map<string, DictLookupResult>();

  async health(): Promise<DictHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'DICT', adapter: 'simulator' };
  }

  async lookupKey(command: DictLookupCommand): Promise<DictLookupResult> {
    const cached = this.directory.get(command.pixKey);
    if (cached) {
      return cached;
    }
    const synthetic: DictLookupResult = {
      pixKey: command.pixKey,
      found: command.pixKey.includes('@'),
      ownerMasked: '***',
      ispb: command.requesterIspb,
    };
    this.directory.set(command.pixKey, synthetic);
    return synthetic;
  }
}
