import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, from, switchMap, throwError } from 'rxjs';
import { payloadHash } from './canonical-json';
import { PartnerApiException } from './partner-api.exception';
import type { PartnerPrincipal } from '../auth/principal.types';

type StoredResponse = { status: number; body: unknown };
type RecordState = {
  hash: string;
  state: 'PROCESSING' | 'DONE' | 'UNKNOWN';
  updatedAt: number;
  response?: StoredResponse;
};

const store = new Map<string, RecordState>();

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { principal?: PartnerPrincipal }>();
    const response = http.getResponse<Response>();

    const key = request.header('idempotency-key');
    if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      return throwError(() => new PartnerApiException('RBK-VAL-001', 422, 'Invalid Idempotency-Key'));
    }

    const clientId = request.principal?.clientId ?? 'anonymous';
    const redisKey = `idem:${clientId}:${key}`;
    const hash = payloadHash(request.body ?? {});
    const now = Date.now();
    const existing = store.get(redisKey);

    if (existing) {
      if (existing.hash !== hash) {
        return throwError(() => new PartnerApiException('RBK-IDP-001', 409, 'Idempotency conflict'));
      }
      if (existing.state === 'DONE' && existing.response) {
        response.status(existing.response.status);
        return from(Promise.resolve(existing.response.body));
      }
      if (existing.state === 'UNKNOWN') {
        return throwError(() => new PartnerApiException('RBK-IDP-002', 409, 'Operation in unknown state'));
      }
      return throwError(() => new PartnerApiException('RBK-IDP-001', 409, 'Request in progress'));
    }

    store.set(redisKey, { hash, state: 'PROCESSING', updatedAt: now });

    return next.handle().pipe(
      switchMap((body) =>
        from(
          Promise.resolve().then(() => {
            const status = response.statusCode || 202;
            store.set(redisKey, {
              hash,
              state: 'DONE',
              updatedAt: Date.now(),
              response: { status, body },
            });
            return body;
          }),
        ),
      ),
    );
  }
}