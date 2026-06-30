import { Injectable } from '@nestjs/common';
import {
  AmlAdapterKind,
  AmlCommand,
  AmlHealth,
  AmlPort,
  AmlResult,
} from '../../ports/aml.port';

@Injectable()
export class AmlSimulatorAdapter implements AmlPort {
  readonly kind: AmlAdapterKind = 'simulator';
  private readonly ledger = new Map<string, AmlResult>();

  async health(): Promise<AmlHealth> {
    return { ok: true, domain: 'aml', adapter: 'simulator' };
  }

  async execute(command: AmlCommand): Promise<AmlResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: AmlResult = {
      referenceId: `sim-aml-${command.idempotencyKey}`,
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
