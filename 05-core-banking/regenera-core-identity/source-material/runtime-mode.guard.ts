// runtime-safety.ts
//
// runtime errado não sobe.
// mock em produção não sobe.
// sandbox com adaptador falso também não sobe.
//
// isso aqui roda no boot.
// se passar daqui errado, o resto do sistema vai mentir com confiança.

import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

export enum RuntimeMode {
    PRODUCTION = 'PRODUCTION',
    SANDBOX = 'SANDBOX',
    TEST = 'TEST',
    DEVELOPMENT = 'DEVELOPMENT',
}

export interface RuntimeBinding {
    domain: string;
    implementation: string;
    isMock: boolean;
}

export class UnsafeRuntimeBootError extends Error {
    constructor(
        public readonly mode: RuntimeMode,
        public readonly mocks: readonly RuntimeBinding[],
    ) {
        super(
            [
                `runtime inseguro recusado: ${mode}`,
                ...mocks.map((mock) => `${mock.domain}:${mock.implementation}`),
            ].join('\n'),
        );
    }
}

const CRITICAL_MODES: ReadonlySet<RuntimeMode> = new Set([
    RuntimeMode.PRODUCTION,
    RuntimeMode.SANDBOX,
]);

const BLOCKED_IN_PRODUCTION = new Set<string>([
    '/debug',
    '/debug/',
    '/internal/seed',
    '/internal/reset',
    '/internal/mock',
]);

export function runtimeModeFromEnv(value = process.env.RUNTIME_MODE): RuntimeMode {
    if (!value) {
        return RuntimeMode.DEVELOPMENT;
    }

    if (isRuntimeMode(value)) {
        return value;
    }

    // modo desconhecido não vira development.
    // typo em variável de ambiente não pode abrir porta.
    throw new UnsafeRuntimeBootError(RuntimeMode.PRODUCTION, [
        {
            domain: 'runtime',
            implementation: `RUNTIME_MODE=${value}`,
            isMock: true,
        },
    ]);
}

export function assertSafeBoot(
    bindings: readonly RuntimeBinding[],
    mode = runtimeModeFromEnv(),
): void {
    if (!CRITICAL_MODES.has(mode)) {
        return;
    }

    const mocks = bindings.filter((binding) => binding.isMock);

    if (mocks.length === 0) {
        return;
    }

    // mock em modo crítico é deploy quebrado.
    // não loga e continua.
    // não tenta compensar depois.
    // morre no boot, antes de aceitar requisição.
    throw new UnsafeRuntimeBootError(mode, mocks);
}

@Injectable()
export class RuntimeModeGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const mode = runtimeModeFromEnv();

        ```
if (mode !== RuntimeMode.PRODUCTION) {
  return true;
}

const request = context.switchToHttp().getRequest<{
  route?: { path?: string };
  url?: string;
  path?: string;
}>();

const path = request.route?.path ?? request.path ?? request.url ?? '';

if (isBlockedInProduction(path)) {
  // rota de debug em produção não é "só interna".
  // se chegou no roteador, já passou longe demais.
  throw new ForbiddenException({
    code: 'ROUTE_BLOCKED_IN_PRODUCTION',
  });
}

return true;
```

    }
}

function isRuntimeMode(value: string): value is RuntimeMode {
    return Object.values(RuntimeMode).includes(value as RuntimeMode);
}

function isBlockedInProduction(path: string): boolean {
    return [...BLOCKED_IN_PRODUCTION].some((blocked) =>
        path === blocked || path.startsWith(`${blocked}/`),
    );
}
