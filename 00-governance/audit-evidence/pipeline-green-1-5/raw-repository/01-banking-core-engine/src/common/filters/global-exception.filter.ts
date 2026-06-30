/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalSecurityFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = request.headers['x-trace-id'] || randomUUID();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorResponse: any;

    if (isHttpException) {
      const resp = exception.getResponse();
      // Formatação padronizada para erros de negócio (FinancialSecurityException, etc)
      errorResponse = typeof resp === 'string' ? { message: resp } : resp;
    } else {
      // Erro desconhecido (Crash, Type Error, DB Timeout) - Impede vazamento de Stack Trace
      errorResponse = {
        error: 'INTERNAL_SERVER_ERROR',
        message:
          'Ocorreu um erro interno de processamento. A operação foi abortada de forma segura.',
      };
    }

    // Log estruturado corporativo
    const logMessage = `[Trace: ${traceId}] HTTP ${status} | Path: ${request.url} | Error: ${exception instanceof Error ? exception.message : 'Unknown'}`;

    if (status >= 500) {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      success: false,
      traceId,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }
}
