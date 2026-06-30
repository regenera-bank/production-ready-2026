import { Injectable } from '@nestjs/common';
import {
  CustomersAdapterKind,
  CustomersCommand,
  CustomersHealth,
  CustomersPort,
  CustomersResult,
} from '../../ports/customers.port';

@Injectable()
export class CustomersSimulatorAdapter implements CustomersPort {
  readonly kind: CustomersAdapterKind = 'simulator';
  private readonly ledger = new Map<string, CustomersResult>();

  async health(): Promise<CustomersHealth> {
    return { ok: true, domain: 'customers', adapter: 'simulator' };
  }

  async execute(command: CustomersCommand): Promise<CustomersResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: CustomersResult = {
      referenceId: `sim-customers-${command.idempotencyKey}`,
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
