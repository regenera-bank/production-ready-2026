import { HttpException, HttpStatus } from '@nestjs/common';

export const CORE_BANKING_DOMAIN = 'CORE_BANKING' as const;

export interface CoreBankingErrorBody {
  message: string;
  code: string;
  domain: typeof CORE_BANKING_DOMAIN;
  details?: Record<string, unknown>;
}

// Corpo de erro único no core — auditoria e BFF parseiam o mesmo JSON.
// Exceção genérica do Nest sem `code` vira incidente na conciliação de logs.
abstract class CoreBankingException extends HttpException {
  public readonly code: string;

  constructor(
    message: string,
    code: string,
    status: HttpStatus,
    details?: Record<string, unknown>,
  ) {
    const body: CoreBankingErrorBody = {
      message,
      code,
      domain: CORE_BANKING_DOMAIN,
      ...(details !== undefined ? { details } : {}),
    };
    super(body, status);
    this.code = code;
  }

  getBody(): CoreBankingErrorBody {
    return this.getResponse() as CoreBankingErrorBody;
  }
}

// Invariante violada antes de efeito financeiro — entrada, composição de partida, regra de domínio.
export class ValidationException extends CoreBankingException {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, HttpStatus.BAD_REQUEST, details);
  }
}

// Mesma chave com intenção diferente, saldo insuficiente, segunda reversão — não sobrescreve, não duplica.
export class ConflictException extends CoreBankingException {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, HttpStatus.CONFLICT, details);
  }
}

// Conta, pagamento ou lançamento inexistente — 404 explícito evita confundir com negação de acesso.
export class NotFoundException extends CoreBankingException {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, HttpStatus.NOT_FOUND, details);
  }
}

// Máquina de estados recusa transição — UNKNOWN→retry, reversão de reversão, POSTED→DRAFT.
// 422 separa "pedido mal formado" de "estado não permite agora".
export class StateTransitionException extends CoreBankingException {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

export function isCoreBankingException(error: unknown): error is CoreBankingException {
  return error instanceof CoreBankingException;
}