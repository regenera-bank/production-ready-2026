import { Injectable } from '@nestjs/common';
import {
  AcademyAdapterKind,
  AcademyCommand,
  AcademyHealth,
  AcademyPort,
  AcademyResult,
} from '../../ports/academy.port';

@Injectable()
export class AcademySimulatorAdapter implements AcademyPort {
  readonly kind: AcademyAdapterKind = 'simulator';
  private readonly ledger = new Map<string, AcademyResult>();

  async health(): Promise<AcademyHealth> {
    return { ok: true, domain: 'academy', adapter: 'simulator' };
  }

  async execute(command: AcademyCommand): Promise<AcademyResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: AcademyResult = {
      referenceId: `sim-academy-${command.idempotencyKey}`,
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
