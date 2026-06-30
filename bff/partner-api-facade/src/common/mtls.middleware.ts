import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { mtlsConfigSpec } from './mtls.config';
import { PartnerApiException } from './partner-api.exception';

@Injectable()
export class MtlsMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const spec = mtlsConfigSpec();
    if (!spec.required) {
      next();
      return;
    }

    const socket = req.socket as Request['socket'] & {
      getPeerCertificate?: () => { fingerprint256?: string; raw?: Buffer };
      authorized?: boolean;
    };

    const certificate = socket.getPeerCertificate?.();
    if (!socket.authorized || !certificate?.fingerprint256) {
      throw new PartnerApiException('RBK-AUTH-001', 401, 'mTLS client certificate required');
    }

    (req as Request & { mtlsThumbprint?: string }).mtlsThumbprint =
      certificate.fingerprint256;
    next();
  }
}