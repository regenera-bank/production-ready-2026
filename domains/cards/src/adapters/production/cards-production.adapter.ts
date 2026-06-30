import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CardsAdapterKind,
  CardsCommand,
  CardsHealth,
  CardsPort,
  CardsResult,
} from '../../ports/cards.port';

@Injectable()
export class CardsProductionAdapter implements CardsPort {
  readonly kind: CardsAdapterKind = 'production';

  async health(): Promise<CardsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('cards', 'production');
  }

  async execute(_command: CardsCommand): Promise<CardsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('cards', 'production');
  }
}
