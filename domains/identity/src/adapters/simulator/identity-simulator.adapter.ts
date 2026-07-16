import { Injectable } from '@nestjs/common';
import {
  IdentityAdapterKind,
  IdentityCommand,
  IdentityHealth,
  IdentityPort,
  IdentityResult,
} from '../../ports/identity.port';

@Injectable()
export class IdentitySimulatorAdapter implements IdentityPort {
  readonly kind: IdentityAdapterKind = 'simulator';
  private readonly ledger = new Map<string, IdentityResult>();

  async health(): Promise<IdentityHealth> {
    return { ok: true, domain: 'identity', adapter: 'simulator' };
  }

  async execute(command: IdentityCommand): Promise<IdentityResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: IdentityResult = {
      referenceId: `sim-identity-${command.idempotencyKey}`,
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
