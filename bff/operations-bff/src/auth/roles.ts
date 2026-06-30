export type OperationsRoleName =
  | 'viewer'
  | 'analyst'
  | 'supervisor'
  | 'admin';

export const ROLE_PERMISSIONS: Record<OperationsRoleName, readonly string[]> = {
  viewer: [
    'clients:read',
    'transactions:read',
    'pix:read',
    'cards:read',
    'credit:read',
    'reports:read',
    'integrations:read',
    'health:read',
    'ledger:read',
    'audit:read',
  ],
  analyst: [
    'clients:read',
    'kyc:review',
    'aml:investigate',
    'fraud:investigate',
    'transactions:read',
    'pix:read',
    'cards:read',
    'credit:read',
    'cases:manage',
    'reports:read',
    'integrations:read',
    'health:read',
    'ledger:read',
    'audit:read',
  ],
  supervisor: [
    'clients:read',
    'kyc:review',
    'aml:investigate',
    'fraud:investigate',
    'transactions:read',
    'pix:read',
    'cards:read',
    'credit:read',
    'disputes:manage',
    'reconciliation:manage',
    'cases:manage',
    'reports:read',
    'integrations:read',
    'health:read',
    'ledger:read',
    'audit:read',
    'users:read',
  ],
  admin: [
    'clients:read',
    'kyc:review',
    'aml:investigate',
    'fraud:investigate',
    'transactions:read',
    'pix:read',
    'cards:read',
    'credit:read',
    'disputes:manage',
    'reconciliation:manage',
    'cases:manage',
    'reports:read',
    'integrations:read',
    'health:read',
    'ledger:read',
    'audit:read',
    'users:read',
    'permissions:admin',
  ],
};

export function normalizeRole(value: string | undefined): OperationsRoleName {
  const role = value?.trim().toLowerCase();
  if (role === 'viewer' || role === 'analyst' || role === 'supervisor' || role === 'admin') {
    return role;
  }
  return 'viewer';
}

export function permissionsForRole(role: OperationsRoleName): readonly string[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(
  role: OperationsRoleName,
  permission: string,
): boolean {
  return permissionsForRole(role).includes(permission);
}