export type JourneyType = 'ACCOUNT_OPENING' | 'PIX_TRANSFER' | 'AUTH';

export type JourneyChannel = 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | 'PWA';

export type AccountOpeningState =
  | 'DRAFT'
  | 'PERSONAL_DATA_PENDING'
  | 'DOCUMENTS_PENDING'
  | 'SELFIE_PENDING'
  | 'LIVENESS_PENDING'
  | 'KYC_PROCESSING'
  | 'MANUAL_REVIEW'
  | 'APPROVED'
  | 'ACCOUNT_CREATING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface JourneyRecord {
  readonly journeyId: string;
  readonly journeyType: JourneyType;
  readonly userId?: string;
  readonly channel: JourneyChannel;
  readonly deviceId: string;
  readonly locale: string;
  readonly appVersion?: string;
  readonly platformVersion?: string;
  currentState: AccountOpeningState;
  version: number;
  readonly createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface CreateJourneyInput {
  readonly channel: JourneyChannel;
  readonly deviceId: string;
  readonly locale?: string;
  readonly appVersion?: string;
  readonly platformVersion?: string;
}

export interface JourneyResponse {
  readonly journeyId: string;
  readonly journeyType: JourneyType;
  readonly customerId?: string;
  readonly channel: JourneyChannel;
  readonly deviceId: string;
  readonly currentState: AccountOpeningState;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string;
  readonly allowedActions: readonly string[];
}

export interface ChannelBootstrapResponse {
  readonly status: 'ok';
  readonly maintenance: boolean;
  readonly minAppVersion: string;
  readonly channelContractVersion: string;
  readonly journeyRequired: boolean;
  readonly supportedChannels: readonly JourneyChannel[];
}