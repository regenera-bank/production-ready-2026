import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface CoreBankingErrorShape {
  readonly message: string;
  readonly code: string;
  readonly domain: 'CORE_BANKING';
  readonly details?: Record<string, unknown>;
}

const isCoreBankingBody = (value: unknown): value is CoreBankingErrorShape =>
  typeof value === 'object' &&
  value !== null &&
  (value as { domain?: unknown }).domain === 'CORE_BANKING' &&
  typeof (value as { code?: unknown }).code === 'string' &&
  typeof (value as { message?: unknown }).message === 'string';

/**
 * O domínio core-bank é compilado com a própria cópia de @nestjs/common.
 * Por isso `instanceof HttpException` falha no BFF e o Nest converteria
 * erros de negócio (400/404/409/422) em 500 genérico — mascarando o
 * contrato de erro canônico do core (message/code/domain).
 *
 * Este filtro reconhece o corpo canônico CORE_BANKING em qualquer exceção
 * "desconhecida" e devolve o status e o JSON originais do core.
 */
@Catch()
export class CoreBankingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CoreBankingExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Exceções HTTP nativas do BFF seguem o fluxo padrão do Nest.
    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .json(exception.getResponse());
      return;
    }

    // Exceções do core-bank: mesma forma de HttpException, outra identidade
    // de classe. Detecta pelo corpo canônico e preserva status + código.
    const maybe = exception as {
      getStatus?: () => number;
      getResponse?: () => unknown;
      status?: number;
    };
    const body =
      typeof maybe?.getResponse === 'function' ? maybe.getResponse() : undefined;
    if (isCoreBankingBody(body)) {
      const status =
        typeof maybe.getStatus === 'function'
          ? maybe.getStatus()
          : typeof maybe.status === 'number'
            ? maybe.status
            : HttpStatus.BAD_REQUEST;
      response.status(status).json(body);
      return;
    }

    // Erro realmente desconhecido: 500 sem vazar detalhes internos.
    this.logger.error(
      exception instanceof Error ? exception.stack ?? exception.message : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
