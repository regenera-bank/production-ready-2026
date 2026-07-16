export interface PrometeoPaymentResult {
  readonly operationNumber?: string;
  readonly requestId?: string;
}

export interface PrometeoWidgetUsageParameters {
  readonly allowedFeatureLevel: 1 | 2;
  readonly paymentIntentId?: string;
  readonly dynamicAmount?: boolean;
  readonly dynamicTimer?: number;
}

export interface PrometeoWidgetSession {
  getOwnerInfo(): void;
  getAccounts(): void;
  getSessionKey(): string;
}

export interface PrometeoWidgetInstance {
  open(params: PrometeoWidgetUsageParameters): void;
  close(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

export interface PrometeoGlobal {
  init(widgetId: string, intentId?: string): PrometeoWidgetInstance;
  Messaging: {
    readonly CLOSE: string;
    readonly LOGIN: string;
    readonly GET_OWNER_INFO: string;
    readonly GET_ACCOUNTS: string;
    readonly PAYMENT_SUCCESS: string;
    readonly ERROR: string;
  };
}

declare global {
  interface Window {
    Prometeo?: PrometeoGlobal;
  }
}

export {};