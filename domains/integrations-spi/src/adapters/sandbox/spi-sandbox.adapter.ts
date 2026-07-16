import { Injectable } from '@nestjs/common';
import {
  SpiAdapterKind,
  SpiHealth,
  SpiPort,
  SpiTransferCommand,
  SpiTransferResult,
} from '../../ports/spi.port';

@Injectable()
export class SpiSandboxAdapter implements SpiPort {
  readonly kind: SpiAdapterKind = 'sandbox';

  async health(): Promise<SpiHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'SPI', adapter: 'sandbox' };
  }

  async submitTransfer(command: SpiTransferCommand): Promise<SpiTransferResult> {
    return { endToEndId: command.endToEndId, status: 'ACCEPTED' };
  }
}
