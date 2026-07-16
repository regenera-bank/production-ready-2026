import { Injectable } from '@nestjs/common';
import {
  SpiAdapterKind,
  SpiHealth,
  SpiPort,
  SpiTransferCommand,
  SpiTransferResult,
} from '../../ports/spi.port';

@Injectable()
export class SpiSimulatorAdapter implements SpiPort {
  readonly kind: SpiAdapterKind = 'simulator';
  private readonly transfers = new Map<string, SpiTransferResult>();

  async health(): Promise<SpiHealth> {
    return { ok: true, domain: 'integrations-spi', rail: 'SPI', adapter: 'simulator' };
  }

  async submitTransfer(command: SpiTransferCommand): Promise<SpiTransferResult> {
    const cached = this.transfers.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: SpiTransferResult = {
      endToEndId: command.endToEndId,
      status: 'ACCEPTED',
    };
    this.transfers.set(command.idempotencyKey, result);
    return result;
  }
}
