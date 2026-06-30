// [FILE] apps/services/pix-service/src/common/filters/all-exceptions.filter.ts
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Para fins de auditoria e depuração, logamos o erro completo.
    // Em produção, isso pode ser ajustado para mascarar informações sensíveis.
    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)} Path: ${request.url}`,
      (exception instanceof Error ? exception.stack : undefined)
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? (message as any).message || message : message,
      // Não expor o stack trace em produção
      // stack: process.env.NODE_ENV === 'development' ? (exception as Error)?.stack : undefined,
    });
  }
}
