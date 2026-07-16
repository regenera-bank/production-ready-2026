import { Inject, Injectable } from '@nestjs/common';
import { KYC_PORT, KycCommand, KycPort, KycResult } from './ports/kyc.port';

@Injectable()
export class KycService {
  constructor(@Inject(KYC_PORT) private readonly port: KycPort) {}

  health() {
    return this.port.health();
  }

  execute(command: KycCommand): Promise<KycResult> {
    return this.port.execute(command);
  }
}
