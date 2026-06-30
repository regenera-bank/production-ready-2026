import { DomainEvent } from '../domain-event.interface';

export interface KycApprovedPayload {
  neuralId: string;
  riskLevel: string;
  approvedAt: string;
}

export type KycApprovedEvent = DomainEvent<KycApprovedPayload>;
