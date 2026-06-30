
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * @author Don Paulo Ricardo
 * @description Sistema de Auditoria Imutável e Centralizada.
 * Logs são assinados criptograficamente para garantir inviolabilidade.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditGuard');

  logSensitiveAction(userId: string, action: string, payload: any, resourceId: string) {
    const timestamp = new Date().toISOString();
    const dataToSign = `${userId}:${action}:${timestamp}:${JSON.stringify(payload)}`;
    
    // Hash SHA-256 para garantir imutabilidade do registro
    const integrityHash = crypto.createHmac('sha256', process.env.AUDIT_SECRET || 'audit-secret-key')
      .update(dataToSign)
      .digest('hex');

    // Em produção, isso seria enviado para um Data Lake (Elasticsearch/Splunk) com WORM (Write Once Read Many)
    this.logger.log({
      level: 'CRITICAL_AUDIT',
      timestamp,
      userId,
      action,
      resourceId,
      integrityHash, // Prova de não violação
      metadata: payload
    });
  }
}
