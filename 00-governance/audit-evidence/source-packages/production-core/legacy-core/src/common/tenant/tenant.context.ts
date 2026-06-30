import { AsyncLocalStorage } from 'async_hooks';

export interface TenantInfo {
  tenantId: string;
  organizationId?: string;
  environment: string;
}

export const tenantContext = new AsyncLocalStorage<TenantInfo>();

export function getTenantContext(): TenantInfo | undefined {
  return tenantContext.getStore();
}
