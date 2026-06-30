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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import { Logger } from '@nestjs/common';

export class LogSanitizer {
  private static readonly logger = new Logger('LogSanitizer');

  /**
   * Mascara dados PII (CPF, CNPJ, Email, Chave Aleatória, Telefone) na string de log.
   */
  static sanitize(message: string): string {
    return message.replace(
      /(?:\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\S+@\S+\.\S+|\+?\d{10,14})/g,
      (match) => {
        if (match.includes('@')) {
          const [name, domain] = match.split('@');
          return `${name.slice(0, 3)}***@${domain}`;
        }
        if (match.replace(/\D/g, '').length === 11) {
          return `${match.slice(0, 3)}***${match.slice(-4)}`;
        }
        if (match.replace(/\D/g, '').length >= 10) {
          return `${match.slice(0, 3)}***${match.slice(-4)}`;
        }
        return '***';
      },
    );
  }

  static log(logger: Logger, message: string) {
    logger.log(this.sanitize(message));
  }

  static warn(logger: Logger, message: string) {
    logger.warn(this.sanitize(message));
  }
}
