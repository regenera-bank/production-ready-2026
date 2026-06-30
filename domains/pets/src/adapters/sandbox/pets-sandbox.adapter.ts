import { Injectable } from '@nestjs/common';
import {
  PetsAdapterKind,
  PetsCommand,
  PetsHealth,
  PetsPort,
  PetsResult,
} from '../../ports/pets.port';

@Injectable()
export class PetsSandboxAdapter implements PetsPort {
  readonly kind: PetsAdapterKind = 'sandbox';
  private readonly store = new Map<string, PetsResult>();

  async health(): Promise<PetsHealth> {
    return { ok: true, domain: 'pets', adapter: 'sandbox' };
  }

  async execute(command: PetsCommand): Promise<PetsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: PetsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
