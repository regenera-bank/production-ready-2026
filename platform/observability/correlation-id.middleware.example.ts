/**
 * Frente 16 — middleware de correlation ID (exemplo NestJS/Express)
 *
 * Propaga x-correlation-id em toda requisição HTTP.
 * Logs estruturados e respostas de erro devem incluir o mesmo ID.
 *
 * Uso:
 *   app.use(correlationIdMiddleware);
 *   // ou registrar como provider global no Nest
 */

import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_HEADER = 'x-correlation-id';

export interface RequestWithCorrelation extends Request {
  correlationId: string;
}

const isValidCorrelationId = (value: string): boolean =>
  value.length >= 8 && value.length <= 128 && /^[\w.-]+$/.test(value);

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header(CORRELATION_HEADER);
  const correlationId =
    incoming && isValidCorrelationId(incoming) ? incoming : randomUUID();

  (req as RequestWithCorrelation).correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  next();
}

/** Helper para logs JSON — incluir em todo log de request/response */
export function logContext(req: RequestWithCorrelation): {
  correlationId: string;
  method: string;
  path: string;
} {
  return {
    correlationId: req.correlationId,
    method: req.method,
    path: req.originalUrl,
  };
}

/**
 * Exemplo de integração com Problem Details (RFC 7807):
 *
 * return {
 *   type: 'https://regenera.bank/problems/conflict',
 *   title: 'Conflito de idempotência',
 *   status: 409,
 *   correlationId: req.correlationId,
 * };
 */