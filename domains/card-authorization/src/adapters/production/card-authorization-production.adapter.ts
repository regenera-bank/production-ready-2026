import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CardAuthorizationAdapterKind,
  CardAuthorizationCommand,
  CardAuthorizationHealth,
  CardAuthorizationPort,
  CardAuthorizationResult,
} from '../../ports/card-authorization.port';

@Injectable()
export class CardAuthorizationProductionAdapter implements CardAuthorizationPort {
  readonly kind: CardAuthorizationAdapterKind = 'production';

  async health(): Promise<CardAuthorizationHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('card-authorization', 'production');
  }

  async execute(_command: CardAuthorizationCommand): Promise<CardAuthorizationResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('card-authorization', 'production');
  }
}
