// [FILE] apps/services/pix-service/src/common/exceptions/saga-timeout.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * @author Don Paulo Ricardo
 * @description Exceção customizada para indicar que uma SAGA excedeu o tempo limite.
 * Essencial para o controle e compensação de transações distribuídas.
 */
export class SagaTimeoutException extends HttpException {
  constructor(message: string = 'SAGA transaction timed out.') {
    super(message, HttpStatus.GATEWAY_TIMEOUT); // HTTP 504 Gateway Timeout
  }
}
