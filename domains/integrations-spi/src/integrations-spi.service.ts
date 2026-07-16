import { Inject, Injectable } from '@nestjs/common';
import { DICT_PORT, DictLookupCommand, DictPort } from './ports/dict.port';
import { SPI_PORT, SpiPort, SpiTransferCommand } from './ports/spi.port';

@Injectable()
export class IntegrationsSpiService {
  constructor(
    @Inject(SPI_PORT) private readonly spi: SpiPort,
    @Inject(DICT_PORT) private readonly dict: DictPort,
  ) {}

  spiHealth() {
    return this.spi.health();
  }

  dictHealth() {
    return this.dict.health();
  }

  submitTransfer(command: SpiTransferCommand) {
    return this.spi.submitTransfer(command);
  }

  lookupKey(command: DictLookupCommand) {
    return this.dict.lookupKey(command);
  }
}
