// consents.controller.ts
//
// isso não é central de atendimento.
// é pedido legal com prazo.
//
// userId não vem do body.
// canal não vem do body.
// DPO não vem do app.
//
// cliente pede.
// sessão diz quem é.
// sistema registra.
//
// se esse controller acreditar em identidade declarada,
// privacidade virou teatro.

import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    Post,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { RequireSession, RequestUserContext } from '../auth/session-auth.guard';
import { RateLimit } from '../common/rate-limit.guard';
import { PrivacyRequestService } from '../privacy/privacy-request.service';

const MAX_DETAILS_KEYS = 20;
const MAX_DETAILS_VALUE_LENGTH = 1000;

const DetailsSchema = z
    .record(
        z.string()
            .trim()
            .min(1)
            .max(MAX_DETAILS_VALUE_LENGTH),
    )
    .refine(
        (details) => Object.keys(details).length <= MAX_DETAILS_KEYS,
        'details grande demais',
    );

const RequestPrivacySchema = z
    .object({
        type: z.enum([
            'ACCESS',
            'CORRECTION',
            'DELETION',
            'PORTABILITY',
            'REVOKE_CONSENT',
        ]),

```
// details é detalhe.
// não é lixeira de pii.
// não é anexo escondido.
// não é payload livre pra sempre.
details: DetailsSchema.optional(),
```

})
.strict()
    .superRefine((value, ctx) => {
        if (value.type === 'CORRECTION' && !value.details) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['details'],
                message: 'correção sem details não corrige nada',
            });
        }
    });

type PrivacyChannel = 'MOBILE' | 'WEB';

type PrivacyUserContext = RequestUserContext & {
    platform?: string;
    devicePlatform?: string;
};

interface PrivacyHttpRequest {
    user?: PrivacyUserContext;
}

@Controller('consents')
export class ConsentsController {
    constructor(private readonly privacyService: PrivacyRequestService) { }

    @Post('request')
    @HttpCode(201)
    @RequireSession()
    @RateLimit({
        name: 'privacy_request',
        windowSeconds: 3600,
        maxRequests: 5,
        scope: 'USER',
        failClosed: true,
    })
    async requestAction(
        @Body() body: unknown,
        @Req() request: PrivacyHttpRequest,
    ): Promise<{
        requestId: string;
        dueAt: Date;
        message: string;
    }> {
        const parsed = parseBody(RequestPrivacySchema, body, 'PRIVACY_REQUEST_PAYLOAD_INVALID');
        const user = request.user;

        ```
if (!user?.userId) {
  // RequireSession sem user é guard quebrado.
  // não abre protocolo sem titular.
  throw new UnauthorizedException({
    code: 'AUTH_CONTEXT_REQUIRED',
  });
}

const result = await this.privacyService.open(
  user.userId,
  parsed.type,
  channelFromSession(user),
  parsed.details ?? {},
);

return {
  requestId: result.requestId,
  dueAt: result.dueAt,
  message: 'Protocolo aberto. SLA iniciado.',
};
```

    }
}

function channelFromSession(user: PrivacyUserContext): PrivacyChannel {
    const platform = (user.devicePlatform ?? user.platform)?.trim().toUpperCase();

    if (platform === 'IOS' || platform === 'ANDROID' || platform === 'MOBILE') {
        return 'MOBILE';
    }

    if (platform === 'WEB') {
        return 'WEB';
    }

    // canal desconhecido não vira WEB por conforto.
    // evidência falsa nasce assim.
    throw new BadRequestException({
        code: 'PRIVACY_CHANNEL_REQUIRED',
    });
}

function parseBody<T extends z.ZodTypeAny>(
    schema: T,
    body: unknown,
    code: string,
): z.infer<T> {
    const parsed = schema.safeParse(body);

    if (parsed.success) {
        return parsed.data;
    }

    throw new BadRequestException({
        code,
        issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
        })),
    });
}
