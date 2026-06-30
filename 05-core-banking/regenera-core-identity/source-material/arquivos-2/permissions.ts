// permissions.guard.ts
//
// rbac não é menu de admin.
// é limite de estrago.
//
// suporte vê pouco.
// compliance congela conta.
// admin mexe em papel.
//
// juntar tudo na mesma mão é pedir fraude interna.
// depois ninguém pode fingir surpresa.

import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';

export type Permission =
    | 'finance.view_ledger'
    | 'compliance.freeze_account'
    | 'support.view_user_basic'
    | 'support.view_transactions_masked'
    | 'admin.manage_roles';

export const STAFF_ROLES = [
    'SUPPORT_L1',
    'SUPPORT_L2',
    'COMPLIANCE_OFFICER',
    'ADMIN',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export interface StaffContext {
    staffId: string;
    roles: readonly string[];
}

export interface RbacContext {
    requiredPermissions: readonly Permission[];
    grantedPermissions: readonly Permission[];
    justification?: string;
}

interface StaffRequest {
    staff?: StaffContext;
    body?: {
        justification?: unknown;
    };
    rbac?: RbacContext;
}

export const RequirePermissions = (...permissions: readonly Permission[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);

export const ROLE_PERMISSIONS: Readonly<Record<StaffRole, readonly Permission[]>> = {
    SUPPORT_L1: [
        'support.view_user_basic',
    ],

    SUPPORT_L2: [
        'support.view_user_basic',
        'support.view_transactions_masked',
    ],

    COMPLIANCE_OFFICER: [
        'finance.view_ledger',
        'compliance.freeze_account',
    ],

    ADMIN: [
        'admin.manage_roles',
    ],
};

const FORBIDDEN_PERMISSION_PAIRS: readonly (readonly [Permission, Permission])[] = [
    ['compliance.freeze_account', 'admin.manage_roles'],
];

const PERMISSIONS_REQUIRING_JUSTIFICATION: ReadonlySet<Permission> = new Set([
    'compliance.freeze_account',
]);

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const required = this.requiredPermissions(context);

        ```
// rota sem permissão aqui não vira pública.
// só quer dizer que este guard não tem decisão.
// sessão administrativa precisa ter morrido antes.
if (required.length === 0) {
  return true;
}

const request = context.switchToHttp().getRequest<StaffRequest>();
const staff = request.staff;

if (!staff?.staffId || !Array.isArray(staff.roles) || staff.roles.length === 0) {
  throw new ForbiddenException({
    code: 'STAFF_CONTEXT_REQUIRED',
  });
}

const granted = permissionsForRoles(staff.roles);

assertNoForbiddenPermissionPair(granted);
assertRequiredPermissions(required, granted);

const justification = justificationFor(required, request.body?.justification);

request.rbac = {
  requiredPermissions: required,
  grantedPermissions: [...granted].sort(),
  ...(justification ? { justification } : {}),
};

return true;
```

    }

    private requiredPermissions(context: ExecutionContext): readonly Permission[] {
        return (
            this.reflector.getAllAndOverride<readonly Permission[]>(PERMISSIONS_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? []
        );
    }
}

export function permissionsForRoles(rawRoles: readonly string[]): Set<Permission> {
    const granted = new Set<Permission>();

    for (const rawRole of rawRoles) {
        if (!isStaffRole(rawRole)) {
            // papel desconhecido não é negado em silêncio.
            // config quebrada não pode parecer usuário sem permissão.
            throw new ForbiddenException({
                code: 'UNKNOWN_STAFF_ROLE',
                role: rawRole,
            });
        }

        ```
for (const permission of ROLE_PERMISSIONS[rawRole]) {
  granted.add(permission);
}
```

    }

    return granted;
}

function assertRequiredPermissions(
    required: readonly Permission[],
    granted: ReadonlySet<Permission>,
): void {
    const missing = required.filter((permission) => !granted.has(permission));

    if (missing.length > 0) {
        throw new ForbiddenException({
            code: 'PERMISSION_DENIED',
            missing,
        });
    }
}

function assertNoForbiddenPermissionPair(granted: ReadonlySet<Permission>): void {
    for (const [left, right] of FORBIDDEN_PERMISSION_PAIRS) {
        if (granted.has(left) && granted.has(right)) {
            // quem congela conta não gerencia papel.
            // quem gerencia papel não congela conta.
            // esse muro existe porque log depois não desfaz abuso.
            throw new ForbiddenException({
                code: 'SEGREGATION_OF_DUTIES_VIOLATION',
                permissions: [left, right],
            });
        }
    }
}

function justificationFor(
    required: readonly Permission[],
    value: unknown,
): string | undefined {
    const needsJustification = required.some((permission) =>
        PERMISSIONS_REQUIRING_JUSTIFICATION.has(permission),
    );

    if (!needsJustification) {
        return undefined;
    }

    return assertJustification(value);
}

function assertJustification(value: unknown): string {
    if (typeof value !== 'string') {
        throw new ForbiddenException({
            code: 'JUSTIFICATION_REQUIRED',
        });
    }

    const justification = value.trim();

    if (justification.length < 20 || justification.length > 1000) {
        throw new ForbiddenException({
            code: 'JUSTIFICATION_INVALID',
        });
    }

    // justificativa não autoriza nada.
    // só deixa rastro pra auditoria cobrar a pessoa certa depois.
    return justification;
}

function isStaffRole(value: string): value is StaffRole {
    return (STAFF_ROLES as readonly string[]).includes(value);
}
