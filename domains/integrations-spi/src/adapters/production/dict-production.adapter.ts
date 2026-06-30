import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  DictLookupCommand,
  DictHealth,
  DictAdapterKind,
  DictPort,
  DictLookupResult,
} from '../../ports/dict.port';

@Injectable()
export class DictProductionAdapter implements DictPort {
  readonly kind: DictAdapterKind = 'production';

  async health(): Promise<DictHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('integrations-spi', 'production-dict');
  }

  async lookupKey(_command: DictLookupCommand): Promise<DictLookupResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('integrations-spi', 'production-dict');
  }
}
