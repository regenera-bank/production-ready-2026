// env.ts
//
// ambiente é parte do sistema.
// se vier errado, o sistema não sobe.
//
// secret sem valor não ganha default.
// produção com localhost não ganha segunda chance.
// tls faltando não vira aviso.
//
// config ruim no boot é mais barata que incidente em horário comercial.

import { z } from 'zod';

export const RUNTIME_MODES = [
    'PRODUCTION',
    'SANDBOX',
    'STAGING',
    'DEVELOPMENT',
    'TEST',
] as const;

export type RuntimeMode = (typeof RUNTIME_MODES)[number];

const CRITICAL_MODES: ReadonlySet<RuntimeMode> = new Set([
    'PRODUCTION',
    'SANDBOX',
    'STAGING',
]);

const nonEmptySecret = (name: string) =>
    z.string().trim().min(1, `${name} é obrigatória e não pode ser vazia`);

const EnvBaseSchema = z.object({
    NODE_ENV: z.enum(['production', 'development', 'test']),

    RUNTIME_MODE: z.enum(RUNTIME_MODES),

    PORT: z.coerce.number().int().min(1).max(65535).default(8080),

    API_URL: z.string().url('API_URL deve ser URL absoluta'),

    DATABASE_URL: nonEmptySecret('DATABASE_URL')
        .regex(/^postgres(ql)?:///, 'DATABASE_URL deve usar postgres:// ou postgresql://'),

REDIS_URL: nonEmptySecret('REDIS_URL')
            .regex(/^rediss?:///, 'REDIS_URL deve usar redis:// ou rediss://'),

JWT_PRIVATE_KEY_REF: nonEmptySecret('JWT_PRIVATE_KEY_REF'),
                JWT_PUBLIC_KEY_REF: nonEmptySecret('JWT_PUBLIC_KEY_REF'),
                JWT_ISSUER: z.string().trim().min(1).default('regenerabank'),

                JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(600),
                JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().min(3600).max(2_592_000).default(604_800),

                FIREBASE_PROJECT_ID: nonEmptySecret('FIREBASE_PROJECT_ID'),
                FIREBASE_CREDENTIALS_REF: nonEmptySecret('FIREBASE_CREDENTIALS_REF'),

                PROMETEO_API_KEY_REF: nonEmptySecret('PROMETEO_API_KEY_REF'),
                PROMETEO_BASE_URL: z.string().url().default('https://banking.prometeoapi.net'),

                GEMINI_API_KEY_REF: z.string().trim().min(1).optional(),

                GCP_PROJECT_ID: nonEmptySecret('GCP_PROJECT_ID'),
                KMS_KEY_RING: nonEmptySecret('KMS_KEY_RING'),
                KMS_CRYPTO_KEY: nonEmptySecret('KMS_CRYPTO_KEY'),

                WEBHOOK_SIGNING_SECRET_REF: nonEmptySecret('WEBHOOK_SIGNING_SECRET_REF'),
                WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(30).max(600).default(300),

                SENTRY_DSN: z.string().url().optional(),
                OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

                LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug']).default('info'),
});

export const EnvSchema = EnvBaseSchema.superRefine((env, ctx) => {
    if (!CRITICAL_MODES.has(env.RUNTIME_MODE)) {
        return;
    }

    // modo crítico não fala com banco local.
    // se isso passar, alguém está testando produção com brinquedo.
    if (/localhost|127.0.0.1|[::1]/i.test(env.DATABASE_URL)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['DATABASE_URL'],
            message: 'DATABASE_URL não pode apontar para localhost em modo crítico',
        });
    }

    if (!/sslmode=(require|verify-full)/i.test(env.DATABASE_URL)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['DATABASE_URL'],
            message: 'DATABASE_URL em modo crítico exige sslmode=require ou verify-full',
        });
    }

    if (!env.REDIS_URL.startsWith('rediss://')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['REDIS_URL'],
            message: 'REDIS_URL em modo crítico exige TLS com rediss://',
        });
    }

    if (env.NODE_ENV !== 'production' && env.RUNTIME_MODE === 'PRODUCTION') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['NODE_ENV'],
            message: 'NODE_ENV precisa ser production quando RUNTIME_MODE é PRODUCTION',
        });
    }
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: Readonly<AppEnv> | null = null;

export class InvalidEnvironmentError extends Error {
    constructor(public readonly issues: readonly string[]) {
        super(`configuração de ambiente inválida:\n  - ${issues.join('\n  - ')}`);
    }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Readonly<AppEnv> {
    if (cached) {
        return cached;
    }

    assertNoForbiddenEnv(source);

    const parsed = EnvSchema.safeParse(source);

    if (!parsed.success) {
        throw new InvalidEnvironmentError(
            parsed.error.issues.map((issue) => {
                const path = issue.path.join('.') || '<root>';
                return `${path}: ${issue.message}`;
            }),
        );
    }

    cached = Object.freeze(parsed.data);

    return cached;
}

export function resetEnvCacheForTests(): void {
    cached = null;
}

export const SECRET_INVENTORY = [
    {
        env: 'DATABASE_URL',
        owner: 'platform',
        rotationDays: 90,
        scope: 'per-env',
    },
    {
        env: 'REDIS_URL',
        owner: 'platform',
        rotationDays: 90,
        scope: 'per-env',
    },
    {
        env: 'JWT_PRIVATE_KEY_REF',
        owner: 'security',
        rotationDays: 30,
        scope: 'per-env',
    },
    {
        env: 'JWT_PUBLIC_KEY_REF',
        owner: 'security',
        rotationDays: 30,
        scope: 'per-env',
    },
    {
        env: 'FIREBASE_CREDENTIALS_REF',
        owner: 'mobile',
        rotationDays: 180,
        scope: 'per-env',
    },
    {
        env: 'PROMETEO_API_KEY_REF',
        owner: 'openfin',
        rotationDays: 90,
        scope: 'per-env',
    },
    {
        env: 'GEMINI_API_KEY_REF',
        owner: 'platform',
        rotationDays: 90,
        scope: 'per-env',
    },
    {
        env: 'WEBHOOK_SIGNING_SECRET_REF',
        owner: 'platform',
        rotationDays: 90,
        scope: 'per-env',
    },
    {
        env: 'SENTRY_DSN',
        owner: 'sre',
        rotationDays: 365,
        scope: 'per-env',
    },
] as const;

export const FORBIDDEN_ENV_NAMES = [
    'TOKEN',
    'ACCESS_TOKEN',
    'NEURAL_TOKEN',
    'PROMETEO_KEY',
] as const;

export function assertNoForbiddenEnv(source: NodeJS.ProcessEnv = process.env): void {
    const present = FORBIDDEN_ENV_NAMES.filter((name) => source[name] !== undefined);

    if (present.length === 0) {
        return;
    }

    // nome genérico de secret é vazamento esperando log.
    // se precisa de segredo, usa *_REF.
    // valor real fica no cofre, não no ambiente.
    throw new InvalidEnvironmentError([
        `variáveis proibidas detectadas: ${present.join(', ')}`,
    ]);
}
