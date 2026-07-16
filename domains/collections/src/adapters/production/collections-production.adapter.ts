import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CollectionsAdapterKind,
  CollectionsCommand,
  CollectionsHealth,
  CollectionsPort,
  CollectionsResult,
} from '../../ports/collections.port';

@Injectable()
export class CollectionsProductionAdapter implements CollectionsPort {
  readonly kind: CollectionsAdapterKind = 'production';

  async health(): Promise<CollectionsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('collections', 'production');
  }

  async execute(_command: CollectionsCommand): Promise<CollectionsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('collections', 'production');
  }
}
