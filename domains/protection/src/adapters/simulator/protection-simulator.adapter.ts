import { Injectable } from '@nestjs/common';
import {
  ProtectionAdapterKind,
  ProtectionCommand,
  ProtectionHealth,
  ProtectionPort,
  ProtectionResult,
} from '../../ports/protection.port';

@Injectable()
export class ProtectionSimulatorAdapter implements ProtectionPort {
  readonly kind: ProtectionAdapterKind = 'simulator';
  private readonly ledger = new Map<string, ProtectionResult>();

  async health(): Promise<ProtectionHealth> {
    return { ok: true, domain: 'protection', adapter: 'simulator' };
  }

  async execute(command: ProtectionCommand): Promise<ProtectionResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: ProtectionResult = {
      referenceId: `sim-protection-${command.idempotencyKey}`,
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
