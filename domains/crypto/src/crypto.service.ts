import { Inject, Injectable } from '@nestjs/common';
import { CRYPTO_PORT, CryptoCommand, CryptoPort, CryptoResult } from './ports/crypto.port';

@Injectable()
export class CryptoService {
  constructor(@Inject(CRYPTO_PORT) private readonly port: CryptoPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CryptoCommand): Promise<CryptoResult> {
    return this.port.execute(command);
  }
}
