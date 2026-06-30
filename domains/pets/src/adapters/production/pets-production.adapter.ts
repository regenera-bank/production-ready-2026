import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  PetsAdapterKind,
  PetsCommand,
  PetsHealth,
  PetsPort,
  PetsResult,
} from '../../ports/pets.port';

@Injectable()
export class PetsProductionAdapter implements PetsPort {
  readonly kind: PetsAdapterKind = 'production';

  async health(): Promise<PetsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('pets', 'production');
  }

  async execute(_command: PetsCommand): Promise<PetsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('pets', 'production');
  }
}
