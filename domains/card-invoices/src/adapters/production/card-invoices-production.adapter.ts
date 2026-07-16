import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CardInvoicesAdapterKind,
  CardInvoicesCommand,
  CardInvoicesHealth,
  CardInvoicesPort,
  CardInvoicesResult,
} from '../../ports/card-invoices.port';

@Injectable()
export class CardInvoicesProductionAdapter implements CardInvoicesPort {
  readonly kind: CardInvoicesAdapterKind = 'production';

  async health(): Promise<CardInvoicesHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('card-invoices', 'production');
  }

  async execute(_command: CardInvoicesCommand): Promise<CardInvoicesResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('card-invoices', 'production');
  }
}
