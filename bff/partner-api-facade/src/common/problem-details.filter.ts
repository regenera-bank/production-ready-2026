import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { PartnerApiException } from './partner-api.exception';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ headers: Record<string, string | undefined>; id?: string }>();

    const correlationId =
      request.headers['x-correlation-id'] ??
      request.id ??
      '00000000-0000-4000-8000-000000000000';

    if (exception instanceof PartnerApiException) {
      response
        .status(exception.status)
        .type('application/problem+json')
        .json({
          type: `https://api.regenerabank.example/problems/${exception.code.toLowerCase()}`,
          title: exception.message,
          status: exception.status,
          code: exception.code,
          correlationId,
        });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).type('application/problem+json').json({
        type: 'https://api.regenerabank.example/problems/http-error',
        title: exception.message,
        status,
        code: status === HttpStatus.UNAUTHORIZED ? 'RBK-AUTH-001' : 'RBK-SYS-001',
        correlationId,
      });
      return;
    }

    response.status(500).type('application/problem+json').json({
      type: 'https://api.regenerabank.example/problems/internal-error',
      title: 'Internal error',
      status: 500,
      code: 'RBK-SYS-001',
      correlationId,
    });
  }
}