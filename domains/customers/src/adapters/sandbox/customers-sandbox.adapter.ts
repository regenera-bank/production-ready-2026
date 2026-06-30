import { Injectable } from '@nestjs/common';
import {
  CustomersAdapterKind,
  CustomersCommand,
  CustomersHealth,
  CustomersPort,
  CustomersResult,
} from '../../ports/customers.port';

@Injectable()
export class CustomersSandboxAdapter implements CustomersPort {
  readonly kind: CustomersAdapterKind = 'sandbox';
  private readonly store = new Map<string, CustomersResult>();

  async health(): Promise<CustomersHealth> {
    return { ok: true, domain: 'customers', adapter: 'sandbox' };
  }

  async execute(command: CustomersCommand): Promise<CustomersResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: CustomersResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
