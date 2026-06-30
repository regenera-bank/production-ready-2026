import { Injectable } from '@nestjs/common';
import {
  FraudAdapterKind,
  FraudCommand,
  FraudHealth,
  FraudPort,
  FraudResult,
} from '../../ports/fraud.port';

@Injectable()
export class FraudSimulatorAdapter implements FraudPort {
  readonly kind: FraudAdapterKind = 'simulator';
  private readonly ledger = new Map<string, FraudResult>();

  async health(): Promise<FraudHealth> {
    return { ok: true, domain: 'fraud', adapter: 'simulator' };
  }

  async execute(command: FraudCommand): Promise<FraudResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: FraudResult = {
      referenceId: `sim-fraud-${command.idempotencyKey}`,
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
