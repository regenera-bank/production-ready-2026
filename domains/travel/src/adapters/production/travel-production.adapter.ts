import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  TravelAdapterKind,
  TravelCommand,
  TravelHealth,
  TravelPort,
  TravelResult,
} from '../../ports/travel.port';

@Injectable()
export class TravelProductionAdapter implements TravelPort {
  readonly kind: TravelAdapterKind = 'production';

  async health(): Promise<TravelHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('travel', 'production');
  }

  async execute(_command: TravelCommand): Promise<TravelResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('travel', 'production');
  }
}
