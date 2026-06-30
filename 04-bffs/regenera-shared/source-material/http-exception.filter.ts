// all-exceptions.filter.ts
//
// erro que escapou cai aqui.
// cliente não recebe stack.
// cliente não recebe nome de tabela.
// cliente não recebe erro cru de lib.
//
// 500 fala pouco pra fora.
// log fala o bastante pra operação achar o corpo.
//
// se isso vazar detalhe interno, o filtro virou parte do incidente.

import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface RequestWithCorrelation extends Request {
    correlationId?: string;
}

interface ErrorBody {
    statusCode: number;
    code: string;
    message: string;
    timestamp: string;
    path: string;
    method: string;
    correlationId: string;
    details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<RequestWithCorrelation>();
        const response = ctx.getResponse<Response>();

        ```
const status = statusFrom(exception);
const correlationId = request.correlationId ?? 'SEM-CORRELATION';

if (status >= 500) {
  // 5xx sem log é falha sem endereço.
  // loga dentro. higieniza fora.
  this.logger.error(
    `[${ correlationId }] ${ request.method } ${ request.url } falhou com ${ status } `,
    stackFrom(exception),
  );
}

response.status(status).json(
  bodyFrom(exception, {
    status,
    method: request.method,
    path: request.url,
    correlationId,
  }),
);
```

    }
}

function statusFrom(exception: unknown): number {
    if (exception instanceof HttpException) {
        return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
}

function bodyFrom(
    exception: unknown,
    context: {
        status: number;
        method: string;
        path: string;
        correlationId: string;
    },
): ErrorBody {
    const base = {
        statusCode: context.status,
        timestamp: new Date().toISOString(),
        path: context.path,
        method: context.method,
        correlationId: context.correlationId,
    };

    if (context.status >= 500) {
        return {
            ...base,
            code: 'INTERNAL_ERROR',
            message: 'Erro interno no processamento.',
        };
    }

    if (!(exception instanceof HttpException)) {
        return {
            ...base,
            code: 'INTERNAL_ERROR',
            message: 'Erro interno no processamento.',
        };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
        return {
            ...base,
            code: codeFromStatus(context.status),
            message: response,
        };
    }

    if (isObject(response)) {
        return {
            ...base,
            code: stringField(response, 'code') ?? codeFromStatus(context.status),
            message: messageFrom(response),
            details: detailsFrom(response),
        };
    }

    return {
        ...base,
        code: codeFromStatus(context.status),
        message: 'Requisição recusada.',
    };
}

function messageFrom(response: Record<string, unknown>): string {
    const message = response.message;

    if (typeof message === 'string') {
        return message;
    }

    if (Array.isArray(message)) {
        return message
            .filter((item): item is string => typeof item === 'string')
            .join('; ');
    }

    return 'Requisição recusada.';
}

function detailsFrom(response: Record<string, unknown>): unknown {
    // details pode sair.
    // stack, query, constraint e cause não.
    // erro de banco é ferramenta de ataque quando volta pro cliente.
    if ('details' in response) {
        return response.details;
    }

    if ('issues' in response) {
        return response.issues;
    }

    return undefined;
}

function codeFromStatus(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return 'BAD_REQUEST';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'UNPROCESSABLE_ENTITY';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return 'SERVICE_UNAVAILABLE';

    return 'REQUEST_FAILED';
}

function stringField(source: Record<string, unknown>, key: string): string | undefined {
    const value = source[key];

    return typeof value === 'string' && value.trim() ? value : undefined;
}

function stackFrom(exception: unknown): string {
    if (exception instanceof Error) {
        return exception.stack ?? exception.message;
    }

    return safeString(exception);
}

function safeString(value: unknown): string {
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
