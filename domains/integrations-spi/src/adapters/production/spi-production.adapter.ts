import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  SpiTransferCommand,
  SpiHealth,
  SpiAdapterKind,
  SpiPort,
  SpiTransferResult,
} from '../../ports/spi.port';

@Injectable()
export class SpiProductionAdapter implements SpiPort {
  readonly kind: SpiAdapterKind = 'production';

  async health(): Promise<SpiHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('integrations-spi', 'production-spi');
  }

  async submitTransfer(_command: SpiTransferCommand): Promise<SpiTransferResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('integrations-spi', 'production-spi');
  }
}
