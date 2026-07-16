import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ChannelAncillaryService,
  type ConsentRecord,
  type ConsentType,
} from '@regenera/channel-persistence';
import {
  AcceptConsentInput,
  CONSENT_VERSION,
  ConsentStatusResponse,
  REQUIRED_CONSENT_TYPES,
} from './consent.types';

@Injectable()
export class ConsentService {
  constructor(private readonly ancillary: ChannelAncillaryService) {}

  status(userId: string): ConsentStatusResponse {
    const accepted = this.activeConsents(userId);
    const acceptedTypes = new Set(accepted.map((item) => item.type));
    const pending = REQUIRED_CONSENT_TYPES.filter(
      (type) => !acceptedTypes.has(type),
    );
    return {
      required: REQUIRED_CONSENT_TYPES,
      accepted,
      pending,
      complete: pending.length === 0,
    };
  }

  async accept(userId: string, input: AcceptConsentInput): Promise<ConsentRecord> {
    if (
      !REQUIRED_CONSENT_TYPES.includes(input.type) &&
      input.type !== 'MARKETING' &&
      input.type !== 'OPEN_FINANCE'
    ) {
      throw new BadRequestException('Tipo de consentimento inválido');
    }
    const record: ConsentRecord = {
      id: randomUUID(),
      userId,
      type: input.type,
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      channel: ChannelAncillaryService.consentChannel(input.channel),
    };
    await this.ancillary.acceptConsent(record);
    return record;
  }

  async revoke(userId: string, type: ConsentType): Promise<void> {
    const now = new Date().toISOString();
    await this.ancillary.revokeConsent(userId, type, now);
  }

  requireMandatory(userId: string): void {
    const pending = this.status(userId).pending;
    if (pending.length > 0) {
      throw new BadRequestException(
        `Consentimentos obrigatórios pendentes: ${pending.join(', ')}`,
      );
    }
  }

  private activeConsents(userId: string): ConsentRecord[] {
    const list = this.ancillary.listConsents(userId);
    const latestByType = new Map<ConsentType, ConsentRecord>();
    for (const item of list) {
      if (item.revokedAt) {
        continue;
      }
      latestByType.set(item.type, item);
    }
    return [...latestByType.values()];
  }
}