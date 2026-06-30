import { Injectable } from '@nestjs/common';
import {
  KycAdapterKind,
  KycCommand,
  KycHealth,
  KycPort,
  KycResult,
} from '../../ports/kyc.port';

@Injectable()
export class KycSimulatorAdapter implements KycPort {
  readonly kind: KycAdapterKind = 'simulator';
  private readonly ledger = new Map<string, KycResult>();

  async health(): Promise<KycHealth> {
    return { ok: true, domain: 'kyc', adapter: 'simulator' };
  }

  async execute(command: KycCommand): Promise<KycResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: KycResult = {
      referenceId: `sim-kyc-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
